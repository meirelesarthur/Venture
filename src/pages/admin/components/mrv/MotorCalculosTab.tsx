import { useDataStore } from '@/store/data'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Send, Lock, TrendingUp, AlertCircle } from 'lucide-react'
import { AdminMotorTab } from '../AdminMotorTab'

interface Props {
  fazendaId: string
  anoAgricola: number
}

export function MotorCalculosTab({ fazendaId, anoAgricola }: Props) {
  const {
    talhoes, manejo, submitManejo,
    resultadosMotor,
    submeterBaseline, getBaselineByFazenda,
  } = useDataStore()

  const projetoTalhoes = talhoes.filter(t => t.fazendaId === fazendaId && t.tipo === 'projeto')
  const baseline = getBaselineByFazenda(fazendaId)

  const resultadosAtuais = resultadosMotor.filter(
    r => projetoTalhoes.some(t => t.id === r.talhaoId) && r.anoAgricola === anoAgricola
  )

  const totalAtual = resultadosAtuais.reduce((s, r) => s + r.vcusEmitidosTotal, 0)
  const totalBaseline = baseline?.totalTco2e ?? 0
  const creditosGerados = totalAtual - totalBaseline

  const fmt = (n: number) => n.toFixed(1)

  const handleForcaValidacao = () => {
    let count = 0
    projetoTalhoes.forEach(t => {
      const m = manejo.find(
        x => x.talhaoId === t.id && x.anoAgricola === anoAgricola && x.cenario === 'projeto'
      )
      if (m && m.status !== 'aprovado') {
        submitManejo(m.id)
        count++
      }
    })
    if (count > 0) toast.success(`${count} talhão(ões) validado(s)!`)
    else toast.error('Nenhum dado de manejo pendente para validar.')
  }

  const handleSubmeterBaseline = () => {
    if (resultadosAtuais.length === 0) {
      toast.error('Execute o motor antes de submeter a baseline.')
      return
    }
    try {
      submeterBaseline(fazendaId, resultadosAtuais)
      toast.success('Baseline submetida! Este valor é imutável e servirá como referência para todos os anos futuros.')
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <div className="space-y-4">
      {/* ── Bloco sticky: Resultado / Baseline / Créditos ── */}
      {resultadosAtuais.length > 0 && (
        <div className="sticky top-0 z-10 bg-background border border-border/50 rounded-xl shadow-sm px-4 py-3 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-[10px] text-muted uppercase tracking-wide mb-0.5">Resultado ano atual</p>
            <p className="text-lg font-bold text-foreground">{fmt(totalAtual)}</p>
            <p className="text-[10px] text-muted">tCO₂e</p>
          </div>
          <div>
            <p className="text-[10px] text-muted uppercase tracking-wide mb-0.5">Baseline (ano zero)</p>
            <p className="text-lg font-bold text-foreground">{baseline ? fmt(totalBaseline) : '—'}</p>
            <p className="text-[10px] text-muted">{baseline ? 'tCO₂e' : 'não submetida'}</p>
          </div>
          <div className="border-l border-border/50 pl-3">
            <p className="text-[10px] text-success uppercase tracking-wide mb-0.5">= Créditos gerados</p>
            <p className="text-lg font-bold text-success">{baseline ? fmt(creditosGerados) : '—'}</p>
            <p className="text-[10px] text-muted">tCO₂e</p>
          </div>
        </div>
      )}

      {/* ── Status / Ações da Baseline ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-1">
        <div className="flex items-center gap-2">
          {baseline ? (
            <Badge className="bg-success/10 text-success border-success/20 shadow-none gap-1.5">
              <Lock size={11} />
              Baseline submetida em {new Date(baseline.submetidaEm).toLocaleDateString('pt-BR')}
            </Badge>
          ) : resultadosAtuais.length > 0 ? (
            <div className="flex items-center gap-2 text-xs text-warning bg-warning/5 border border-warning/20 px-3 py-1.5 rounded-lg">
              <AlertCircle size={12} />
              Baseline ainda não submetida. Execute o motor e submeta para registrar o ano zero.
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {!baseline && resultadosAtuais.length > 0 && (
            <Button
              size="sm"
              onClick={handleSubmeterBaseline}
              className="gap-2 rounded-xl h-9 bg-primary hover:bg-primary/90 text-white font-semibold shadow-sm"
            >
              <TrendingUp size={14} />
              Submeter Baseline
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleForcaValidacao}
            className="gap-2 rounded-xl border-teal-600 text-teal-600 hover:bg-teal-600 hover:text-white transition-colors"
          >
            <Send size={14} />
            Forçar Validação
          </Button>
        </div>
      </div>

      <AdminMotorTab fazendaId={fazendaId} anoAgricola={anoAgricola} />

      {/* ── Linha delta no racional de carbono ── */}
      {resultadosAtuais.length > 0 && (
        <div className="sticky bottom-0 bg-background border-t-2 border-foreground/20 rounded-b-xl px-4 py-3 font-mono text-sm shadow-lg">
          <div className="space-y-1 max-w-sm">
            <div className="flex justify-between">
              <span className="text-muted">+ Sequestro SOC (RothC)</span>
              <span className="font-medium">{fmt(resultadosAtuais.reduce((s, r) => s + r.co2SocTco2eHa * (talhoes.find(t => t.id === r.talhaoId)?.areaHa ?? 0), 0))} tCO₂</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">+ Redução de emissões (N₂O/CH₄)</span>
              <span className="font-medium">{fmt(resultadosAtuais.reduce((s, r) => s + (r.deltaN2oTco2eHa + r.deltaCh4Tco2eHa) * (talhoes.find(t => t.id === r.talhaoId)?.areaHa ?? 0), 0))} tCO₂e</span>
            </div>
            {baseline && (
              <div className="flex justify-between text-danger">
                <span>− Baseline (ano zero)</span>
                <span className="font-medium">{fmt(totalBaseline)} tCO₂e</span>
              </div>
            )}
            <div className="border-t border-foreground/20 pt-1 flex justify-between font-bold text-success text-base">
              <span>= Créditos gerados (delta)</span>
              <span>{baseline ? fmt(creditosGerados) : fmt(totalAtual)} tCO₂e</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
