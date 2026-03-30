import { useState } from 'react'
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

export default function AdminMotor() {
  const { fazendaId } = useParams()
  const { fazendas, talhoes, manejo, dadosClimaticos, parametros, resultadosMotor, addResultadoMotor, clearResultadosTalhao, addNotificacao } = useDataStore()

  const fazenda = fazendas.find(f => f.id === fazendaId) ?? fazendas[0]
  const meusTalhoes = talhoes.filter(t => t.fazendaId === fazenda?.id && t.tipo === 'projeto')

  const [talhaoId, setTalhaoId] = useState(meusTalhoes[0]?.id ?? '')
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
          <CardDescription>Selecione talhão, ano e cenário antes de rodar.</CardDescription>
        </CardHeader>
        <CardContent className="pt-5 grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Talhão de Projeto</Label>
            <Select value={talhaoId} onValueChange={setTalhaoId}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Selecionar talhão..." />
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
                  <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm border-t border-border/50">
                    {[
                      { label: 'SOC Baseline', val: `${r.socBaselineTcHa.toFixed(2)} tC/ha`, color: '' },
                      { label: 'SOC Projeto', val: `${r.socProjetoTcHa.toFixed(2)} tC/ha`, color: 'text-success' },
                      { label: 'ΔC orgânico', val: `${r.deltaSocTcHa.toFixed(3)} tC/ha`, color: r.deltaSocTcHa>0?'text-success':'text-danger' },
                      { label: 'Remoção CO₂ (CR_t)', val: `${r.crTTco2eHa.toFixed(3)} tCO₂e/ha`, color: 'text-primary' },
                      { label: 'Δ N₂O', val: `${r.deltaN2oTco2eHa.toFixed(4)} tCO₂e/ha`, color: r.deltaN2oTco2eHa>0?'text-success':'' },
                      { label: 'Δ CH₄', val: `${r.deltaCh4Tco2eHa.toFixed(4)} tCO₂e/ha`, color: r.deltaCh4Tco2eHa>0?'text-success':'' },
                      { label: 'CO₂ combustíveis', val: `${r.co2FfTco2eHa.toFixed(4)} tCO₂e/ha`, color: '' },
                      { label: 'CO₂ calagem', val: `${r.co2LimeTco2eHa.toFixed(4)} tCO₂e/ha`, color: '' },
                      { label: 'ER_t (reduções)', val: `${r.erTTco2eHa.toFixed(3)} tCO₂e/ha`, color: 'text-success' },
                      { label: 'ERR_net (bruto)', val: `${r.errNetTco2eHa.toFixed(3)} tCO₂e/ha`, color: '' },
                      { label: 'Buffer pool', val: `${(r.bufferPoolRate*100).toFixed(0)}%`, color: 'text-warning' },
                      { label: 'VCUs/ha', val: `${r.vcusEmitidosHa.toFixed(3)}`, color: 'text-success font-bold' },
                    ].map(item => (
                      <div key={item.label} className="bg-background rounded-lg p-3">
                        <p className="text-xs text-muted">{item.label}</p>
                        <p className={`font-semibold mt-0.5 ${item.color}`}>{item.val}</p>
                      </div>
                    ))}
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
