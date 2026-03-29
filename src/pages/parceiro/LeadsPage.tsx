import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileSearch, CheckCircle2, Clock, XCircle } from 'lucide-react'

import { useDataStore } from '@/store/data'

export default function LeadsPage() {
  const leads = useDataStore((state) => state.leads)
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Meus Leads</h1>
        <p className="text-muted">Acompanhe o funil de vendas dos seus indicados.</p>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="bg-surface/50 border-b">
          <CardTitle className="text-lg">Lista de Indicações</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {leads.map(lead => (
              <div key={lead.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/5 transition-colors">
                <div className="space-y-1">
                  <h4 className="font-semibold text-foreground">{lead.nome}</h4>
                  <div className="text-sm text-muted flex items-center gap-2">
                    <span>{lead.fazenda}</span>
                    <span>•</span>
                    <span>{lead.area} ha</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">Indicado em {lead.data}</span>
                  
                  {lead.status === 'em_analise' && <Badge variant="secondary" className="bg-warning/10 text-warning hover:bg-warning/20 border-warning/20"><Clock className="w-3 h-3 mr-1" /> Em Análise</Badge>}
                  {lead.status === 'aprovado' && <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"><FileSearch className="w-3 h-3 mr-1" /> Aprovado</Badge>}
                  {lead.status === 'contratado' && <Badge variant="secondary" className="bg-success/10 text-success hover:bg-success/20 border-success/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Contratado</Badge>}
                  {lead.status === 'recusado' && <Badge variant="secondary" className="bg-danger/10 text-danger hover:bg-danger/20 border-danger/20"><XCircle className="w-3 h-3 mr-1" /> Recusado</Badge>}
                  {lead.status === 'efetivado' && <Badge variant="secondary" className="bg-success/10 text-success hover:bg-success/20 border-success/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Efetivado</Badge>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
