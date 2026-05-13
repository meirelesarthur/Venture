import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { FileText, UploadCloud, CheckCircle2, Clock, Trash2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Doc { name: string; type: string; size: string; status: 'enviado' | 'aprovado'; url: string }

const CATEGORIAS = [
  { id: 'laudo_solo',   label: 'Laudos de Solo (Agricultura de Precisão)',    desc: 'PDF com análises de SOC%, BD, textura',   accept: '.pdf', required: true },
  { id: 'fotos',        label: 'Fotos Geolocalizadas',             desc: 'JPEG/PNG com EXIF de GPS',                accept: 'image/*', required: true },
  { id: 'doc_fundiario',label: 'Documentos Fundiários',            desc: 'CAR, Matrícula atualizada ou Contrato de Arrendamento', accept: '.pdf,.zip', required: true },
  { id: 'nfe_insumos',  label: 'Notas Fiscais de Insumos',         desc: 'PDF — fertilizantes, sementes, defensivos',accept: '.pdf', required: false },
  { id: 'kml_atualiz',  label: 'KML / Shapefile Atualizado',       desc: 'Talhões do projeto com delimitação atual', accept: '.kml,.kmz,.zip', required: false },
  { id: 'crea_anotacao', label: 'ART / RRT Agronômico',            desc: 'Anotação de responsabilidade técnica',     accept: '.pdf', required: false },
]

const MOCK_DOCS: Doc[] = [
  { name: 'laudo_solo_t1_2025.pdf', type: 'laudo_solo', size: '1.2 MB', status: 'aprovado', url: '#' },
  { name: 'fotos_talhao_a1.zip', type: 'fotos', size: '18.5 MB', status: 'enviado', url: '#' },
]

export default function DocumentosForm({ locked }: { talhaoIds: string[]; fazendaId: string; anoAgricola: number; locked: boolean }) {
  const [docs, setDocs] = useState<Doc[]>(MOCK_DOCS)
  const [uploading, setUploading] = useState<string | null>(null)

  const handleUpload = (catId: string, files: FileList) => {
    setUploading(catId)
    const newDocs: Doc[] = Array.from(files).map(file => ({
      name: file.name,
      type: catId,
      size: `${(file.size / 1048576).toFixed(1)} MB`,
      status: 'enviado' as const,
      url: URL.createObjectURL(file),
    }))
    setTimeout(() => {
      setDocs(prev => [...prev, ...newDocs])
      setUploading(null)
      toast.success(`${newDocs.length === 1 ? newDocs[0].name : `${newDocs.length} arquivos`} enviado${newDocs.length > 1 ? 's' : ''} com sucesso!`)
    }, 1500)
  }

  const removeDoc = (catId: string, name: string) =>
    setDocs(prev => prev.filter(d => !(d.type === catId && d.name === name)))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <FileText className="text-primary" size={20} /> Evidências e Documentos
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Envie os laudos e evidências exigidos para a auditoria VVB. Múltiplos arquivos são aceitos por categoria.</p>
      </div>

      <div className="space-y-4">
        {CATEGORIAS.map(cat => {
          const catDocs = docs.filter(d => d.type === cat.id)
          const isUploading = uploading === cat.id
          const hasApproved = catDocs.some(d => d.status === 'aprovado')
          const hasDocs = catDocs.length > 0
          return (
            <div key={cat.id} className={cn(
              'border rounded-xl p-4 space-y-3 transition-colors',
              hasApproved ? 'border-success/30 bg-success/5' :
              hasDocs ? 'border-primary/30 bg-primary/5' : 'border-border/50 bg-surface/50'
            )}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground">{cat.label}</p>
                    {cat.required && <Badge variant="destructive" className="bg-danger/10 text-danger border-danger/20 hover:bg-danger/20 shadow-none text-[10px] uppercase px-1.5 py-0">Obrigatório</Badge>}
                    {catDocs.length > 0 && <Badge className="bg-background border border-border/50 text-muted shadow-none text-[10px]">{catDocs.length} arquivo{catDocs.length > 1 ? 's' : ''}</Badge>}
                  </div>
                  <p className="text-xs text-muted mt-0.5">{cat.desc}</p>
                </div>
              </div>

              {/* Lista de arquivos já enviados */}
              {catDocs.length > 0 && (
                <div className="space-y-1.5">
                  {catDocs.map(doc => (
                    <div key={doc.name} className="flex items-center gap-3 p-2.5 bg-background/50 rounded-lg border border-border/30">
                      <FileText size={14} className="text-muted flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground truncate">{doc.name}</p>
                        <p className="text-xs text-muted">{doc.size}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {doc.status === 'aprovado' ? (
                          <Badge className="bg-success/10 text-success border-success/20 shadow-none text-[10px]">
                            <CheckCircle2 size={9} className="mr-1" /> Aprovado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 shadow-none text-[10px]">
                            <Clock size={9} className="mr-1" /> Revisão
                          </Badge>
                        )}
                        <a href={doc.url} target="_blank" rel="noreferrer" className="text-primary hover:text-primary/80"><ExternalLink size={13} /></a>
                        {!locked && doc.status !== 'aprovado' && (
                          <button onClick={() => removeDoc(cat.id, doc.name)} className="text-muted hover:text-danger">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Zona de upload — sempre visível enquanto não bloqueado */}
              {!locked && (
                <label className={cn(
                  'flex flex-col items-center justify-center gap-1.5 p-5 border-2 border-dashed rounded-xl cursor-pointer transition-colors',
                  isUploading ? 'border-primary/40 bg-primary/5' : 'border-border/40 hover:border-primary/40 hover:bg-primary/5'
                )}>
                  <input
                    type="file"
                    accept={cat.accept}
                    multiple
                    className="hidden"
                    onChange={e => { if (e.target.files?.length) handleUpload(cat.id, e.target.files) }}
                  />
                  {isUploading ? (
                    <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  ) : (
                    <UploadCloud size={20} className="text-muted" />
                  )}
                  <p className="text-xs font-medium text-muted">
                    {isUploading ? 'Enviando...' : hasDocs ? 'Adicionar mais arquivos' : 'Clique para enviar'}
                  </p>
                  <p className="text-[10px] text-muted/70">{cat.accept.replace(/\./g,'').toUpperCase().replace(/,/g,', ')}</p>
                </label>
              )}
            </div>
          )
        })}
      </div>

      {!locked && (
        <p className="text-xs text-muted text-center">
          Arquivos são enviados para revisão do time técnico. Documentos aprovados ficam imutáveis.
        </p>
      )}
    </div>
  )
}
