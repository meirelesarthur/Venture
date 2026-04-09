import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { useDataStore } from '@/store/data'
import { rodarMotorCompleto } from '@/motor'
import { Play, CheckCircle2, Factory, Layers } from 'lucide-react'

interface LogEntry { step: string; percent: number }

export function AdminMotorTab({ fazendaId, anoAgricola }: { fazendaId: string; anoAgricola: number }) {
  const { talhoes, manejo, dadosClimaticos, parametros, addResultadoMotor, clearResultadosTalhao, addNotificacao } = useDataStore()

  const meusTalhoes = talhoes.filter(t => t.fazendaId === fazendaId && t.tipo === 'projeto')
  const [talhaoId, setTalhaoId] = useState<string>('todos')
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [progresso, setProgresso] = useState(0)
  const [log, setLog] = useState<LogEntry[]>([])

  const handleRodar = async () => {
    let talhoesParaRodar = meusTalhoes

    if (talhaoId !== 'todos') {
      const t = meusTalhoes.find(x => x.id === talhaoId)
      if (!t) return
      talhoesParaRodar = [t]
    }

    if (talhoesParaRodar.length === 0) {
      toast.error('Nenhum talhão selecionado ou disponível.')
      return
    }

    setStatus('running')
    setProgresso(0)
    setLog([])

    let successCount = 0
    let totalVcu = 0

    for (let i = 0; i < talhoesParaRodar.length; i++) {
      const t = talhoesParaRodar[i]
      const manejoProj = manejo.find(m => m.talhaoId === t.id && m.anoAgricola === anoAgricola && m.cenario === 'projeto')

      if (!manejoProj) {
        setLog(prev => [...prev, { step: `[Ignorado] ${t.nome}: Sem dados de projeto na safra ${anoAgricola}`, percent: progresso }])
        continue
      }

      const manejoBase = manejo.find(m => m.talhaoId === t.id && m.cenario === 'baseline') ?? null
      const clima = dadosClimaticos.find(d => d.talhaoId === t.id) ?? null
      
      setLog(prev => [...prev, { step: `[Iniciando] ${t.nome}`, percent: progresso }])
      clearResultadosTalhao(t.id, anoAgricola)

      try {
        const resultado = await rodarMotorCompleto(t, manejoProj, manejoBase, clima, parametros, () => {
           // We don't log the granular percent when running for all to avoid spam, just update global progress
        })

        addResultadoMotor(resultado)
        totalVcu += resultado.vcusEmitidosTotal
        successCount++
        setLog(prev => [...prev, { step: `[Sucesso] ${t.nome} - Gerou ${resultado.vcusEmitidosTotal.toFixed(1)} VCUs`, percent: progresso }])
      } catch (err) {
        setLog(prev => [...prev, { step: `[Erro] Falha ao rodar motor para ${t.nome}`, percent: progresso }])
      }
      
      setProgresso(((i + 1) / talhoesParaRodar.length) * 100)
    }

    setStatus('done')
    if (successCount > 0) {
      toast.success(`Motor finalizado! ${totalVcu.toFixed(1)} VCUs emitidos.`)
      addNotificacao({
        para: 'cliente',
        texto: `Motor executado para ${successCount} talhões (Safra ${anoAgricola}). Total: ${totalVcu.toFixed(0)} VCUs.`,
        link: '/dashboard/resultados',
      })
    } else {
      toast.warning('Motor finalizado sem cálculos. Verifique se há dados válidos de manejo.')
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/50 shadow-sm bg-surface">
        <CardHeader className="border-b bg-surface/50 pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Factory size={18} className="text-primary"/> Configuração do Motor
          </CardTitle>
          <CardDescription>Executar modelo de carbono (RothC + QA3) para quantificação de créditos.</CardDescription>
        </CardHeader>
        <CardContent className="pt-5 grid sm:grid-cols-2 gap-4 items-end">
          <div className="space-y-2">
            <Label>Alvo da Execução</Label>
            <Select value={talhaoId} onValueChange={setTalhaoId}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos" className="font-bold text-primary">
                  <div className="flex items-center gap-2"><Layers size={14}/> Todos os Talhões</div>
                </SelectItem>
                {meusTalhoes.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nome} ({t.areaHa} ha) {t.dadosValidados ? '✓' : '⚠'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Button onClick={handleRodar} disabled={status === 'running'} className="rounded-xl w-full sm:w-auto gap-2">
              <Play size={16} /> {status === 'running' ? 'Executando...' : 'Rodar Motor'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {(status === 'running' || status === 'done' || log.length > 0) && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between bg-surface/30">
            <div>
              <CardTitle className="text-base">Log de Execução</CardTitle>
              {status === 'running' && <p className="text-xs text-primary mt-1 flex items-center gap-1">Rodando modelos...</p>}
            </div>
            {status === 'done' && <CheckCircle2 className="text-success" size={20} />}
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center gap-4">
              <Progress value={progresso} className="h-2 flex-1" />
              <span className="text-xs font-bold w-10 text-right">{progresso.toFixed(0)}%</span>
            </div>
            <div className="bg-background border border-border/50 rounded-xl p-3 h-64 overflow-y-auto font-mono text-[11px] sm:text-xs">
              {log.length === 0 && <p className="text-muted-foreground italic">Aguardando início...</p>}
              {log.map((l, i) => (
                <div key={i} className="mb-1.5 pb-1.5 border-b border-border/20 last:border-0 last:pb-0 text-foreground/80 flex items-start gap-2">
                  <span className="text-muted opacity-50 shrink-0">[{l.percent.toFixed(0).padStart(3, '0')}%]</span>
                  <span>{l.step}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
