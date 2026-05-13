import { useState } from 'react'
import { useDataStore } from '@/store/data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Settings2, X, Trash2, Send, Map, CheckCircle2 } from 'lucide-react'
import type { FeatureCollection } from 'geojson'

function parseKml(text: string): FeatureCollection | null {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(text, 'text/xml')
    const coords = doc.querySelector('coordinates')?.textContent?.trim()
    if (!coords) return null
    const points = coords.split(/\s+/).map(c => {
      const [lng, lat] = c.split(',').map(Number)
      return [lng, lat] as [number, number]
    }).filter(([lng, lat]) => !isNaN(lng) && !isNaN(lat))
    if (points.length < 3) return null
    return {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [points] },
        properties: {},
      }],
    }
  } catch { return null }
}

export function TalhaoEditModal({ talhaoId, onClose }: { talhaoId: string; onClose: () => void }) {
  const { talhoes, updateTalhao } = useDataStore()
  const talhao = talhoes.find(t => t.id === talhaoId)
  const [nome, setNome] = useState(talhao?.nome || '')
  const [area, setArea] = useState(String(talhao?.areaHa || ''))
  const [argila, setArgila] = useState(String(talhao?.argilaPercent || ''))
  const [kmlFiles, setKmlFiles] = useState<FeatureCollection[]>(talhao?.kmlGeoJsons ?? [])
  if (!talhao) return null

  const handleKmlFiles = (files: FileList) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = e => {
        const text = e.target?.result as string
        const fc = parseKml(text)
        if (fc) {
          setKmlFiles(prev => [...prev, fc])
          toast.success(`KML "${file.name}" carregado.`)
        } else {
          toast.error(`Não foi possível ler "${file.name}" como KML válido.`)
        }
      }
      reader.readAsText(file)
    })
  }

  const handleSave = () => {
    updateTalhao(talhaoId, {
      nome,
      areaHa: Number(area),
      argilaPercent: argila ? Number(argila) : undefined,
      kmlGeoJsons: kmlFiles.length > 0 ? kmlFiles : undefined,
    })
    toast.success('Talhão atualizado!')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background border border-border/50 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2"><Settings2 size={18} className="text-primary" /> Editar Talhão</h2>
          <button onClick={onClose} className="p-2 text-muted hover:text-foreground"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome do Talhão</Label>
            <Input value={nome} onChange={e => setNome(e.target.value)} className="rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Área (ha)</Label><Input type="number" value={area} onChange={e => setArea(e.target.value)} className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label>Argila (%)</Label><Input type="number" step="0.1" value={argila} onChange={e => setArgila(e.target.value)} className="rounded-xl" placeholder="Ex: 35" /></div>
          </div>

          {/* Polígonos KML */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Map size={13} className="text-primary" /> Polígonos KML
              {kmlFiles.length > 0 && <span className="text-[10px] text-success font-medium ml-1 flex items-center gap-0.5"><CheckCircle2 size={10} /> {kmlFiles.length} carregado{kmlFiles.length > 1 ? 's' : ''}</span>}
            </Label>
            {kmlFiles.map((_, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-success/5 border border-success/20 rounded-lg text-xs">
                <span className="text-success font-medium">Polígono {i + 1}</span>
                <button onClick={() => setKmlFiles(prev => prev.filter((_, j) => j !== i))} className="text-muted hover:text-danger"><X size={12} /></button>
              </div>
            ))}
            <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-border/50 rounded-xl cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors">
              <input type="file" accept=".kml,.kmz" multiple className="hidden" onChange={e => e.target.files && handleKmlFiles(e.target.files)} />
              <Map size={14} className="text-muted" />
              <span className="text-xs text-muted">Adicionar arquivo KML/KMZ</span>
            </label>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancelar</Button>
          <Button onClick={handleSave} className="flex-1 rounded-xl">Salvar</Button>
        </div>
      </div>
    </div>
  )
}

export function DeleteTalhaoModal({ talhaoId, onClose }: { talhaoId: string; onClose: () => void }) {
  const { talhoes, updateTalhao } = useDataStore()
  const talhao = talhoes.find(t => t.id === talhaoId)
  if (!talhao) return null
  const handleDelete = () => {
    updateTalhao(talhaoId, { tipo: 'excluido' })
    toast.success(`${talhao.nome} removido.`)
    onClose()
  }
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background border border-border/50 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-danger/10 flex items-center justify-center shrink-0">
            <Trash2 size={18} className="text-danger" />
          </div>
          <div>
            <h2 className="text-base font-bold">Remover talhão?</h2>
            <p className="text-sm text-muted mt-0.5">
              <strong className="text-foreground">{talhao.nome}</strong> será marcado como excluído. Esta ação pode ser revertida pelo administrador.
            </p>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancelar</Button>
          <Button variant="destructive" onClick={handleDelete} className="flex-1 rounded-xl">Remover</Button>
        </div>
      </div>
    </div>
  )
}

export function SubmitConfirmModal({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background border border-border/50 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Send size={18} className="text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold">Submeter manejo?</h2>
            <p className="text-sm text-muted mt-0.5">
              Os dados serão enviados para validação pelo time Venture Carbon. Após a submissão, não será possível editar.
            </p>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancelar</Button>
          <Button onClick={() => { onConfirm(); onClose() }} className="flex-1 rounded-xl gap-2">
            <Send size={14} /> Submeter
          </Button>
        </div>
      </div>
    </div>
  )
}
