import { useState } from 'react'
import type React from 'react'
import { cn } from '@/lib/utils'
import { Map, Droplets, Settings2, FileText, Info } from 'lucide-react'
import FazendaMap from '@/components/maps/FazendaMap'
import FertilizacaoForm from '@/pages/cliente/mrv/FertilizacaoForm'
import OperacionalForm from '@/pages/cliente/mrv/OperacionalForm'
import DocumentosForm from '@/pages/cliente/mrv/DocumentosForm'
import { useDataStore } from '@/store/data'

type FazendaSubTab = 'mapa' | 'fertilizacao' | 'maquinario' | 'evidencias'

const SUBTABS: { id: FazendaSubTab; label: string; Icon: React.ElementType }[] = [
  { id: 'mapa',         label: 'Área & Mapa',  Icon: Map },
  { id: 'fertilizacao', label: 'Fertilização', Icon: Droplets },
  { id: 'maquinario',  label: 'Maquinário',    Icon: Settings2 },
  { id: 'evidencias',  label: 'Evidências',    Icon: FileText },
]

interface Props {
  fazendaId: string
  anoAgricola: number
  talhaoIds: string[]
}

export function MRVFazendaTab({ fazendaId, anoAgricola, talhaoIds }: Props) {
  const [sub, setSub] = useState<FazendaSubTab>('mapa')
  const { fazendas, talhoes } = useDataStore()
  const fazenda = fazendas.find(f => f.id === fazendaId)
  const projetoTalhoes = talhoes.filter(t => t.fazendaId === fazendaId && t.tipo === 'projeto')

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tabs L2 */}
      <div className="flex border-b border-border/50 px-6 bg-surface/10" role="tablist">
        {SUBTABS.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={sub === t.id}
            onClick={() => setSub(t.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all -mb-px',
              sub === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            <t.Icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto p-6">
        {sub === 'mapa' && (
          <div className="space-y-5 max-w-2xl">
            <div>
              <h3 className="text-base font-bold mb-1">Área da Fazenda</h3>
              <p className="text-sm text-muted">Georreferenciamento e visualização dos talhões cadastrados.</p>
            </div>

            {/* KML info — somente leitura para o admin */}
            {fazenda?.kmlGeoJson ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-success/5 border border-success/20 text-sm">
                <Info size={14} className="text-success shrink-0" />
                <div>
                  <p className="font-medium text-success">KML carregado pelo produtor</p>
                  <p className="text-xs text-muted mt-0.5">
                    {fazenda.areaTotalHa?.toFixed(1)} ha · o envio do arquivo é de responsabilidade do produtor.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/5 border border-border/50 text-sm">
                <Info size={14} className="text-muted-foreground shrink-0" />
                <p className="text-xs text-muted">
                  O produtor ainda não enviou o KML da fazenda. O upload é de responsabilidade do próprio produtor via painel MRV.
                </p>
              </div>
            )}

            <div className="rounded-xl overflow-hidden border border-border/50">
              <FazendaMap talhoes={projetoTalhoes} height="320px" />
            </div>
          </div>
        )}

        {sub === 'fertilizacao' && (
          <FertilizacaoForm talhaoIds={talhaoIds} fazendaId={fazendaId} anoAgricola={anoAgricola} locked={false} />
        )}

        {sub === 'maquinario' && (
          <OperacionalForm talhaoIds={talhaoIds} fazendaId={fazendaId} anoAgricola={anoAgricola} locked={false} />
        )}

        {sub === 'evidencias' && (
          <DocumentosForm talhaoIds={talhaoIds} fazendaId={fazendaId} anoAgricola={anoAgricola} locked={false} />
        )}
      </div>
    </div>
  )
}
