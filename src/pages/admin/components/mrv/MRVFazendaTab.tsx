import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Map, Droplets, Settings2, FileText } from 'lucide-react'
import KmlUploader from '@/components/maps/KmlUploader'
import FazendaMap from '@/components/maps/FazendaMap'
import FertilizacaoForm from '@/pages/cliente/mrv/FertilizacaoForm'
import OperacionalForm from '@/pages/cliente/mrv/OperacionalForm'
import DocumentosForm from '@/pages/cliente/mrv/DocumentosForm'
import { useDataStore } from '@/store/data'
import { toast } from 'sonner'

type FazendaSubTab = 'mapa' | 'fertilizacao' | 'maquinario' | 'evidencias'

const SUBTABS: { id: FazendaSubTab; label: string; Icon: any }[] = [
  { id: 'mapa',         label: 'Área & Mapa',    Icon: Map },
  { id: 'fertilizacao', label: 'Fertilização',   Icon: Droplets },
  { id: 'maquinario',  label: 'Maquinário',      Icon: Settings2 },
  { id: 'evidencias',  label: 'Evidências',       Icon: FileText },
]

interface Props {
  fazendaId: string
  anoAgricola: number
  talhaoIds: string[]
}

export function MRVFazendaTab({ fazendaId, anoAgricola, talhaoIds }: Props) {
  const [sub, setSub] = useState<FazendaSubTab>('mapa')
  const { fazendas, talhoes, updateFazenda } = useDataStore()
  const fazenda = fazendas.find(f => f.id === fazendaId)
  const projetoTalhoes = talhoes.filter(t => t.fazendaId === fazendaId && t.tipo === 'projeto')

  const handleKmlLoad = (result: { areaHa: number; geojson: any; fileName: string }) => {
    if (fazenda) {
      updateFazenda(fazenda.id, { kmlGeoJson: result.geojson, areaTotalHa: result.areaHa })
      toast.success(`KML carregado: ${result.areaHa.toFixed(1)} ha`)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tabs L2 — underline style */}
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
            <KmlUploader onLoad={handleKmlLoad} label="Carregar KML da fazenda" />
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
