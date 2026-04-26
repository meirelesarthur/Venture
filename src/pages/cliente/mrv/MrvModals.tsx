import { useState } from 'react'
import { useDataStore } from '@/store/data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Settings2, X, Trash2, Send } from 'lucide-react'

export function TalhaoEditModal({ talhaoId, onClose }: { talhaoId: string; onClose: () => void }) {
  const { talhoes, updateTalhao } = useDataStore()
  const talhao = talhoes.find(t => t.id === talhaoId)
  const [nome, setNome] = useState(talhao?.nome || '')
  const [area, setArea] = useState(String(talhao?.areaHa || ''))
  const [soc, setSoc] = useState(String(talhao?.socPercent || ''))
  if (!talhao) return null
  const handleSave = () => {
    updateTalhao(talhaoId, { nome, areaHa: Number(area), socPercent: soc ? Number(soc) : undefined })
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
            <div className="space-y-1.5"><Label>SOC (%)</Label><Input type="number" step="0.1" value={soc} onChange={e => setSoc(e.target.value)} className="rounded-xl" placeholder="Ex: 2.1" /></div>
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
