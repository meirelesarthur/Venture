import { useParams, useSearchParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDataStore } from '@/store/data'
import { ArrowLeft, Thermometer } from 'lucide-react'
import { cn } from '@/lib/utils'

import { MRVFazendaTab } from './components/mrv/MRVFazendaTab'
import { TalhoesTab } from './components/mrv/TalhoesTab'
import { MotorCalculosTab } from './components/mrv/MotorCalculosTab'
import { AdminHistoricoTab } from './components/AdminHistoricoTab'

const CURRENT_YEAR = new Date().getFullYear()
const ANOS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2, CURRENT_YEAR - 3]

type L1Tab = 'fazenda' | 'talhoes' | 'motor' | 'historico'

const TABS: { id: L1Tab; label: string }[] = [
  { id: 'fazenda', label: 'Fazenda' },
  { id: 'talhoes', label: 'Talhões' },
  { id: 'motor', label: 'Motor de Cálculos' },
  { id: 'historico', label: 'Histórico' },
]

export default function AdminFazendaDetalhe() {
  const { fazendaId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { fazendas, clientes, talhoes } = useDataStore()

  const fazenda = fazendas.find(f => f.id === fazendaId) ?? fazendas[0]
  const cliente = clientes.find(c => c.id === fazenda?.produtorId)

  const tab = (searchParams.get('tab') as L1Tab) ?? 'fazenda'
  const anoAgricola = Number(searchParams.get('ano')) || CURRENT_YEAR

  const projetoTalhaoIds = talhoes
    .filter(t => t.tipo === 'projeto' && t.fazendaId === fazenda?.id)
    .map(t => t.id)

  if (!fazenda) return <div className="p-6 text-muted">Fazenda não encontrada.</div>

  const setTab = (t: L1Tab) =>
    setSearchParams(prev => { prev.set('tab', t); return prev }, { replace: true })

  const setAno = (a: number) =>
    setSearchParams(prev => { prev.set('ano', String(a)); return prev }, { replace: true })

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="rounded-full flex-shrink-0">
            <Link to="/admin/fazendas"><ArrowLeft size={18} /></Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold leading-tight">MRV: {fazenda.nome}</h1>
            <p className="text-xs text-muted">
              Produtor: {cliente?.nome} — {fazenda.municipio}/{fazenda.estado}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={String(anoAgricola)} onValueChange={v => setAno(Number(v))}>
            <SelectTrigger className="w-36 rounded-xl font-semibold text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ANOS.map(a => (
                <SelectItem key={a} value={String(a)}>Safra {a}/{a + 1}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1.5 text-[10px] text-muted uppercase font-bold tracking-tight bg-background/50 px-3 py-1.5 rounded-lg border border-border/50">
            <Thermometer size={12} className="text-primary" />
            INMET: {fazenda.municipio}
          </div>
        </div>
      </div>

      {/* ── Main card ── */}
      <div className="bg-background border border-border/50 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">

        {/* ── Tab bar L1 ── */}
        <div
          className="flex border-b border-border/50 overflow-x-auto"
          role="tablist"
          aria-label="Navegação MRV"
        >
          {TABS.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500',
                tab === t.id
                  ? 'bg-teal-600 text-white'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {tab === 'fazenda' && (
            <MRVFazendaTab
              fazendaId={fazenda.id}
              anoAgricola={anoAgricola}
              talhaoIds={projetoTalhaoIds}
            />
          )}
          {tab === 'talhoes' && (
            <TalhoesTab fazendaId={fazenda.id} anoAgricola={anoAgricola} />
          )}
          {tab === 'motor' && (
            <div className="p-6 overflow-y-auto flex-1">
              <MotorCalculosTab fazendaId={fazenda.id} anoAgricola={anoAgricola} />
            </div>
          )}
          {tab === 'historico' && (
            <div className="p-6 overflow-y-auto flex-1">
              <AdminHistoricoTab fazendaId={fazenda.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
