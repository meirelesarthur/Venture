import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Play, CheckCircle2, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { useDataStore } from '@/store/data'
import { rodarMotorCompleto } from '@/motor'

interface LogEntry { step: string; percent: number }

interface FormulaCardProps {
  title: string
  formula: string
  values: { label: string; val: string }[]
  result: string
  resultColor: string
  calculation: string
}

function FormulaCard({ title, formula, values, result, resultColor, calculation }: FormulaCardProps) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-border/50 rounded-xl overflow-hidden">
      <button
        className="flex items-center justify-between w-full px-4 py-3 bg-surface/30 hover:bg-accent/5 text-left transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
        <span className={`text-sm font-bold ${resultColor}`}>{result}</span>
      </button>
      {open && (
        <div className="px-4 py-3 bg-background/50 space-y-3 border-t border-border/30 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Formula */}
          <div className="bg-primary/5 border border-primary/15 rounded-lg px-3 py-2">
            <p className="text-xs text-primary/70 mb-0.5">Fórmula</p>
            <p className="font-mono text-sm font-semibold text-primary">{formula}</p>
          </div>
          {/* Intermediate values */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {values.map(v => (
              <div key={v.label} className="bg-surface rounded-lg p-2.5 border border-border/30">
                <p className="text-[10px] text-muted">{v.label}</p>
                <p className="text-sm font-semibold text-foreground">{v.val}</p>
              </div>
            ))}
          </div>
          {/* Calculation */}
          <div className="bg-secondary/50 rounded-lg px-3 py-2">
            <p className="text-[10px] text-muted mb-0.5">Cálculo</p>
            <p className="font-mono text-xs text-foreground/80">{calculation}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminMotor() {
  const { fazendaId } = useParams()
  const { fazendas, talhoes, manejo, dadosClimaticos, parametros, resultadosMotor, addResultadoMotor, clearResultadosTalhao, addNotificacao } = useDataStore()

  const [selFazendaId, setSelFazendaId] = useState(fazendaId || fazendas[0]?.id || '')
  const fazenda = fazendas.find(f => f.id === selFazendaId) ?? fazendas[0]
  
  const meusTalhoes = talhoes.filter(t => t.fazendaId === fazenda?.id && t.tipo === 'projeto')

  const [talhaoId, setTalhaoId] = useState(meusTalhoes[0]?.id ?? '')

  useEffect(() => {
    const ts = talhoes.filter(t => t.fazendaId === selFazendaId && t.tipo === 'projeto')
    if (ts.length > 0 && !ts.find(t => t.id === talhaoId)) {
      setTalhaoId(ts[0].id)
    } else if (ts.length === 0) {
      setTalhaoId('')
    }
  }, [selFazendaId, talhoes, talhaoId])

  const [anoAgricola, setAnoAgricola] = useState('2025')
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [progresso, setProgresso] = useState(0)
  const [log, setLog] = useState<LogEntry[]>([])
  const [expandedResult, setExpandedResult] = useState<string | null>(null)

  const talhaoSel  = talhoes.find(t => t.id === talhaoId)
  const resultados = resultadosMotor.filter(r => r.talhaoId === talhaoId && r.anoAgricola === Number(anoAgricola))

  const anos = [2024, 2025, 2026]

  const handleRodar = async () => {
    if (!talhaoSel) { toast.error('Selecione um talhão.'); return }

    const anoNum   = Number(anoAgricola)
    const manejoProj = manejo.find(m => m.talhaoId === talhaoId && m.anoAgricola === anoNum && m.cenario === 'projeto')

    if (!manejoProj) {
      toast.error(`Não há dados MRV (projeto) para ${talhaoSel.nome} — Safra ${anoNum}.`)
      return
    }

    const manejoBase = manejo.find(m => m.talhaoId === talhaoId && m.cenario === 'baseline') ?? null
    const clima      = dadosClimaticos.find(d => d.talhaoId === talhaoId) ?? null

    setStatus('running')
    setProgresso(0)
    setLog([])
    clearResultadosTalhao(talhaoId, anoNum)

    try {
      const resultado = await rodarMotorCompleto(
        talhaoSel,
        manejoProj,
        manejoBase,
        clima,
        parametros,
        (step, percent) => {
          setLog(prev => [...prev, { step, percent }])
          setProgresso(percent)
        },
      )

      addResultadoMotor(resultado)
      addNotificacao({
        para: 'cliente',
        texto: `Motor executado: ${talhaoSel.nome} — ${resultado.vcusEmitidosTotal.toFixed(0)} VCUs calculados para safra ${anoNum}.`,
        link: '/dashboard/resultados',
      })
      setStatus('done')
      toast.success(`Motor concluído! ${resultado.vcusEmitidosTotal.toFixed(1)} VCUs emitidos.`)
    } catch (err) {
      setStatus('error')
      toast.error('Erro ao executar o motor de cálculos.')
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link to="/admin/fazendas"><ArrowLeft size={20} /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Motor de Cálculos — RothC + IPCC</h1>
          <p className="text-muted">{fazenda?.nome} · VM0042 v2.2 · VMD0053 v2.1</p>
        </div>
      </div>

      {/* Seletores */}
      <Card className="border-border/50 shadow-sm bg-surface">
        <CardHeader className="border-b bg-surface/50 pb-4">
          <CardTitle className="text-base">Configuração da Execução</CardTitle>
          <CardDescription>Selecione fazenda, talhão e ano antes de rodar.</CardDescription>
        </CardHeader>
        <CardContent className="pt-5 grid sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Fazenda</Label>
            <Select value={selFazendaId} onValueChange={setSelFazendaId}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Selecionar fazenda..." />
              </SelectTrigger>
              <SelectContent>
                {fazendas.map(f => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Talhão de Projeto</Label>
            <Select value={talhaoId} onValueChange={setTalhaoId} disabled={meusTalhoes.length === 0}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder={meusTalhoes.length ? "Selecionar talhão..." : "Nenhum talhão"} />
              </SelectTrigger>
              <SelectContent>
                {meusTalhoes.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nome} ({t.areaHa} ha){t.dadosValidados ? ' ✓' : ' ⚠'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Ano Agrícola</Label>
            <Select value={anoAgricola} onValueChange={setAnoAgricola}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {anos.map(a => <SelectItem key={a} value={String(a)}>{a}/{a+1}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Log de execução */}
        <Card className="md:col-span-2 border-border/50 shadow-sm">
          <CardHeader className="border-b bg-surface/50 pb-4">
            <CardTitle className="text-base">Log de Execução</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {status === 'idle' && log.length === 0 && (
              <div className="text-center py-8 text-muted text-sm">
                Configure os parâmetros e clique em "Rodar Motor".
              </div>
            )}
            <div className="space-y-1 font-mono text-xs max-h-72 overflow-y-auto">
              {log.map((entry, i) => (
                <div key={i} className={`flex items-center gap-3 py-1 ${entry.percent === 100 ? 'text-success font-bold' : 'text-foreground/80'}`}>
                  <span className="text-muted w-10 shrink-0">[{String(entry.percent).padStart(3)}%]</span>
                  <span>{entry.step}</span>
                </div>
              ))}
            </div>
            {status === 'running' && (
              <div className="mt-4 space-y-2">
                <Progress value={progresso} className="h-2" />
                <p className="text-xs text-center text-primary animate-pulse">Calculando...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Painel de execução */}
        <Card className="border-border/50 shadow-sm flex flex-col">
          <CardHeader className="border-b bg-surface/50 pb-4">
            <CardTitle className="text-base">Execução</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex-1 flex flex-col justify-center gap-6">
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-foreground">
                {status === 'done' && resultados.length > 0
                  ? resultados[resultados.length-1].vcusEmitidosTotal.toFixed(1)
                  : '---'}
              </div>
              <p className="text-sm text-muted">VCUs emitidos (total)</p>
              {status === 'done' && resultados.length > 0 && (
                <p className="text-xs text-success">
                  {resultados[resultados.length-1].vcusEmitidosHa.toFixed(2)} tCO₂e/ha
                </p>
              )}
            </div>

            {status === 'idle' && (
              <Button onClick={handleRodar} className="w-full gap-2 h-12 rounded-xl">
                <Play size={18} /> Rodar Motor (RothC + IPCC)
              </Button>
            )}
            {status === 'running' && (
              <Button disabled className="w-full gap-2 h-12 rounded-xl opacity-70">
                <RefreshCw size={16} className="animate-spin" /> Calculando...
              </Button>
            )}
            {(status === 'done' || status === 'error') && (
              <div className="space-y-3">
                {status === 'done' && (
                  <div className="flex items-center gap-2 justify-center text-xs text-success">
                    <CheckCircle2 size={14} /> Cálculo concluído com sucesso
                  </div>
                )}
                <Button onClick={handleRodar} variant="outline" className="w-full gap-2 rounded-xl">
                  <RefreshCw size={14} /> Recalcular
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Histórico de resultados */}
      {resultados.length > 0 && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="border-b bg-surface/50 pb-4">
            <CardTitle className="text-base">Resultado Detalhado — {talhaoSel?.nome} · Safra {anoAgricola}/{Number(anoAgricola)+1}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {resultados.map(r => (
              <div key={r.id} className="border border-border/50 rounded-xl overflow-hidden">
                <button
                  className="flex items-center justify-between w-full p-4 bg-surface/30 hover:bg-accent/5 text-left"
                  onClick={() => setExpandedResult(expandedResult === r.id ? null : r.id)}
                >
                  <div className="flex items-center gap-3">
                    {expandedResult === r.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <div>
                      <p className="text-sm font-semibold">Motor v{r.versaoMotor} · {new Date(r.rodadoEm).toLocaleString('pt-BR')}</p>
                      <p className="text-xs text-muted">Buffer: {(r.bufferPoolRate*100).toFixed(0)}% · Incerteza SOC: {(r.uncCo2*100).toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-success">{r.vcusEmitidosTotal.toFixed(1)}</p>
                    <p className="text-xs text-muted">VCUs totais</p>
                  </div>
                </button>

                {expandedResult === r.id && (
                  <div className="p-4 space-y-3 border-t border-border/50">
                    {/* ΔC Orgânico (RothC) */}
                    <FormulaCard
                      title="ΔC Orgânico (RothC)"
                      formula="CR_t = (SOC_proj − SOC_base) × 44/12"
                      values={[
                        { label: 'SOC Baseline', val: `${r.socBaselineTcHa.toFixed(2)} tC/ha` },
                        { label: 'SOC Projeto', val: `${r.socProjetoTcHa.toFixed(2)} tC/ha` },
                        { label: 'ΔC', val: `${r.deltaSocTcHa.toFixed(3)} tC/ha` },
                      ]}
                      result={`CR_t = ${r.crTTco2eHa.toFixed(3)} tCO₂e/ha`}
                      resultColor="text-success"
                      calculation={`(${r.socProjetoTcHa.toFixed(2)} − ${r.socBaselineTcHa.toFixed(2)}) × 3.667 = ${r.crTTco2eHa.toFixed(3)}`}
                    />
                    {/* Δ N₂O */}
                    <FormulaCard
                      title="Δ N₂O (IPCC Tier 1)"
                      formula="ΔN₂O = (N₂O_base − N₂O_proj) × GWP_N₂O"
                      values={[
                        { label: 'N₂O Baseline', val: `${r.n2oBaselineTco2eHa.toFixed(4)} tCO₂e/ha` },
                        { label: 'N₂O Projeto', val: `${r.n2oProjetoTco2eHa.toFixed(4)} tCO₂e/ha` },
                        { label: 'GWP N₂O', val: `${r.parametrosUsados?.gwp_n2o ?? 265}` },
                      ]}
                      result={`ΔN₂O = ${r.deltaN2oTco2eHa.toFixed(4)} tCO₂e/ha`}
                      resultColor={r.deltaN2oTco2eHa > 0 ? 'text-success' : 'text-warning'}
                      calculation={`N₂O_direct + N₂O_indirect (volatilização EF4 + lixiviação EF5)`}
                    />
                    {/* Δ CH₄ */}
                    <FormulaCard
                      title="Δ CH₄ (Entérico + Manejo)"
                      formula="ΔCH₄ = (CH₄_base − CH₄_proj) × GWP_CH₄"
                      values={[
                        { label: 'CH₄ Baseline', val: `${r.ch4BaselineTco2eHa.toFixed(4)} tCO₂e/ha` },
                        { label: 'CH₄ Projeto', val: `${r.ch4ProjetoTco2eHa.toFixed(4)} tCO₂e/ha` },
                        { label: 'GWP CH₄', val: `${r.parametrosUsados?.gwp_ch4 ?? 28}` },
                      ]}
                      result={`ΔCH₄ = ${r.deltaCh4Tco2eHa.toFixed(4)} tCO₂e/ha`}
                      resultColor={r.deltaCh4Tco2eHa > 0 ? 'text-success' : ''}
                      calculation={`(${r.ch4BaselineTco2eHa.toFixed(4)} − ${r.ch4ProjetoTco2eHa.toFixed(4)}) = ${r.deltaCh4Tco2eHa.toFixed(4)}`}
                    />
                    {/* CO₂ Combustíveis */}
                    <FormulaCard
                      title="CO₂ Combustíveis Fósseis"
                      formula="CO₂_ff = Σ (L_diesel × EF_diesel) + Σ (L_gas × EF_gas)"
                      values={[
                        { label: 'EF Diesel', val: `${r.parametrosUsados?.ef_diesel ?? 0.002886} tCO₂/L` },
                        { label: 'EF Gasolina', val: `${r.parametrosUsados?.ef_gasolina ?? 0.00231} tCO₂/L` },
                      ]}
                      result={`CO₂_ff = ${r.co2FfTco2eHa.toFixed(4)} tCO₂e/ha`}
                      resultColor="text-warning"
                      calculation={`Soma dos consumos × fatores de emissão por tipo`}
                    />
                    {/* CO₂ Calagem */}
                    <FormulaCard
                      title="CO₂ Calagem"
                      formula="CO₂_lime = Σ (t_calcário × EF_calc × 44/12)"
                      values={[
                        { label: 'EF Calcítico', val: `${r.parametrosUsados?.ef_limestone ?? 0.12} tC/t` },
                        { label: 'EF Dolomita', val: `${r.parametrosUsados?.ef_dolomite ?? 0.13} tC/t` },
                      ]}
                      result={`CO₂_lime = ${r.co2LimeTco2eHa.toFixed(4)} tCO₂e/ha`}
                      resultColor="text-warning"
                      calculation={`Quantidade aplicada × EF × 3.667 (conversão C→CO₂)`}
                    />
                    {/* ERR_net */}
                    <FormulaCard
                      title="Remoção Líquida (ERR_net)"
                      formula="ERR_net = CR_t + ER_t − LK_t"
                      values={[
                        { label: 'CR_t (remoções)', val: `${r.crTTco2eHa.toFixed(3)} tCO₂e/ha` },
                        { label: 'ER_t (reduções)', val: `${r.erTTco2eHa.toFixed(3)} tCO₂e/ha` },
                        { label: 'LK_t (leakage)', val: `${r.lkTTco2eHa.toFixed(3)} tCO₂e/ha` },
                      ]}
                      result={`ERR_net = ${r.errNetTco2eHa.toFixed(3)} tCO₂e/ha`}
                      resultColor="text-primary font-bold"
                      calculation={`${r.crTTco2eHa.toFixed(3)} + ${r.erTTco2eHa.toFixed(3)} − ${r.lkTTco2eHa.toFixed(3)} = ${r.errNetTco2eHa.toFixed(3)}`}
                    />
                    {/* VCUs Finais */}
                    <FormulaCard
                      title="VCUs Emitidos (Final)"
                      formula="VCUs = ERR_net × (1 − buffer) × área"
                      values={[
                        { label: 'ERR_net', val: `${r.errNetTco2eHa.toFixed(3)} tCO₂e/ha` },
                        { label: 'Buffer Pool', val: `${(r.bufferPoolRate * 100).toFixed(0)}%` },
                        { label: 'Área', val: `${talhaoSel?.areaHa ?? '—'} ha` },
                        { label: 'Incerteza SOC', val: `±${(r.uncCo2 * 100).toFixed(1)}%` },
                        { label: 'Incerteza N₂O', val: `±${(r.uncN2o * 100).toFixed(1)}%` },
                      ]}
                      result={`VCUs = ${r.vcusEmitidosTotal.toFixed(1)} tCO₂e`}
                      resultColor="text-success text-lg"
                      calculation={`${r.errNetTco2eHa.toFixed(3)} × (1 − ${r.bufferPoolRate}) × ${talhaoSel?.areaHa ?? '?'} = ${r.vcusEmitidosTotal.toFixed(1)}`}
                    />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
