import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Play, CheckCircle2, RefreshCw, ChevronDown, ChevronRight, Download, FlaskConical } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { useDataStore } from '@/store/data'
import { rodarMotorCompleto } from '@/motor'
import { SecaoRothC, SecaoN2O, SecaoCH4, SecaoCO2, SecaoCreditos, exportarCSV } from './components/motor/MotorSections'

interface LogEntry { step: string; percent: number }

export default function AdminMotor() {
  const { fazendaId } = useParams()
  const { fazendas, talhoes, manejo, dadosClimaticos, parametros, resultadosMotor, addResultadoMotor, clearResultadosTalhao, addNotificacao } = useDataStore()

  const [selFazendaId, setSelFazendaId] = useState(fazendaId || fazendas[0]?.id || '')
  const fazenda = fazendas.find(f => f.id === selFazendaId) ?? fazendas[0]

  const meusTalhoes = talhoes.filter(t => t.fazendaId === fazenda?.id && t.tipo === 'projeto')

  const [talhaoId, setTalhaoId] = useState(meusTalhoes[0]?.id ?? '')
  const [expandAllModulos, setExpandAllModulos] = useState<boolean | undefined>(undefined)

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

  const currentYear = new Date().getFullYear()
  const anos = [currentYear - 1, currentYear, currentYear + 1]

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
      setExpandedResult(null)
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
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecionar fazenda..." /></SelectTrigger>
              <SelectContent>
                {fazendas.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Talhão de Projeto</Label>
            <Select value={talhaoId} onValueChange={setTalhaoId} disabled={meusTalhoes.length === 0}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder={meusTalhoes.length ? "Selecionar talhão..." : "Nenhum talhão"} /></SelectTrigger>
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

      {/* Resultados detalhados */}
      {resultados.length > 0 && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="border-b bg-surface/50 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <FlaskConical size={16} className="text-primary" />
                  Cadeia Completa de Equações — {talhaoSel?.nome} · Safra {anoAgricola}/{Number(anoAgricola)+1}
                </CardTitle>
                <CardDescription className="mt-1">
                  Cada módulo pode ser expandido para ver as equações intermediárias passo a passo com valores reais calculados.
                </CardDescription>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => setExpandAllModulos(true)} className="text-xs text-primary hover:underline">Expandir todos</button>
                <span className="text-muted-foreground/30">|</span>
                <button onClick={() => setExpandAllModulos(false)} className="text-xs text-muted-foreground hover:underline">Colapsar todos</button>
              </div>
            </div>
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
                      <p className="text-xs text-muted">Buffer: {(r.bufferPoolRate*100).toFixed(0)}% · UNC SOC: ±{(r.uncCo2*100).toFixed(1)}% · UNC N₂O: ±{(r.uncN2o*100).toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-success">{r.vcusEmitidosTotal.toFixed(1)}</p>
                    <p className="text-xs text-muted">VCUs totais</p>
                  </div>
                </button>

                {expandedResult === r.id && (
                  <div className="p-4 space-y-3 border-t border-border/50">
                    {r.detalhesCalculo && (
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 rounded-lg text-xs"
                          onClick={() => exportarCSV(r, talhaoSel?.nome ?? 'talhao', talhaoSel?.areaHa ?? 0)}
                        >
                          <Download size={13} />
                          Exportar Planilha CSV (Análise Técnica)
                        </Button>
                      </div>
                    )}

                    {r.detalhesCalculo ? (
                      <div className="space-y-3">
                        <SecaoRothC r={r} talhaoArea={talhaoSel?.areaHa ?? 0} forceOpen={expandAllModulos} />
                        <SecaoN2O r={r} forceOpen={expandAllModulos} />
                        <SecaoCH4 r={r} forceOpen={expandAllModulos} />
                        <SecaoCO2 r={r} forceOpen={expandAllModulos} />
                        <SecaoCreditos r={r} talhaoArea={talhaoSel?.areaHa ?? 0} forceOpen={expandAllModulos} />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-muted italic text-center py-2">
                          Este resultado foi calculado sem dados intermediários. Recalcule para ver a cadeia completa de equações.
                        </p>
                      </div>
                    )}
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
