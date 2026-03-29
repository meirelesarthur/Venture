import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, UploadCloud, FileCheck2, Trash2, Send } from 'lucide-react'

export default function DocumentosForm() {
  const [docs, setDocs] = useState([
    { id: 1, nome: 'CAR_Fazenda_Boa_Vista.pdf', tipo: 'CAR/Geo', data: '12/10/2026', size: '2.4 MB' },
    { id: 2, nome: 'NFs_Calcario_Abril.pdf', tipo: 'Nota Fiscal', data: '05/11/2026', size: '1.1 MB' },
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-border/50 pb-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <FileText className="text-primary" /> Central de Documentos
          </h2>
          <p className="text-sm text-muted-foreground">Upload de evidências, shapefiles e notas fiscais exigidos pela certificadora.</p>
        </div>
      </div>

      <Card className="border-dashed border-2 border-border/60 bg-surface/30">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <UploadCloud size={32} className="text-primary" />
          </div>
          <h3 className="text-lg font-medium">Arraste seus arquivos aqui</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Formatos suportados: PDF, JPG, PNG, e ZIP (contendo KML/SHP). Tamanho máximo: 50MB por arquivo.
          </p>
          <Button variant="outline" className="mt-6 rounded-xl shadow-sm">
            Selecionar do Computador
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4 pt-4">
        <h3 className="font-medium text-foreground">Arquivos Anexados ({docs.length})</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {docs.map((doc) => (
            <div key={doc.id} className="p-4 rounded-xl border border-border/50 bg-surface flex items-start justify-between gap-4 group hover:bg-muted/5 transition-colors">
              <div className="flex gap-3 items-start overflow-hidden">
                <FileCheck2 size={24} className="text-success shrink-0" />
                <div className="overflow-hidden">
                  <p className="font-medium text-sm truncate">{doc.nome}</p>
                  <p className="text-xs text-muted-foreground flex gap-2 mt-1">
                    <span>{doc.tipo}</span> • <span>{doc.size}</span> • <span>{doc.data}</span>
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-danger btn-micro shrink-0">
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-8 border-t border-border/50">
        <Button className="rounded-xl gap-2 bg-success hover:bg-success/90 text-white shadow-soft pointer-events-none">
          <Send size={16} /> Finalizar e Submeter MRV
        </Button>
      </div>
    </div>
  )
}
