import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CheckCircle2, Search, XCircle, Clock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useDataStore } from '@/store/data'

export default function AdminLeads() {
  const { leads, updateLeadStatus, convertLeadToCliente } = useDataStore()

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestão de Leads</h1>
        <p className="text-muted-foreground">Acompanhe todos os potenciais clientes propectados pelo formulário público ou parceiros.</p>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="bg-surface/50 border-b flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg">Fila de Prospecções</CardTitle>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 h-9" placeholder="Buscar por lead ou produtor..." />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-accent/5">
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produtor</TableHead>
                <TableHead>Propriedade</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="text-muted-foreground text-sm">{lead.data}</TableCell>
                  <TableCell className="font-semibold text-foreground">{lead.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{lead.fazenda}</TableCell>
                  <TableCell>{lead.area.toLocaleString('pt-br')} ha</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{lead.email || 'N/A'}</TableCell>
                  <TableCell className="text-center">
                    {lead.status === 'em_analise' && <Badge variant="secondary" className="bg-warning/10 text-warning hover:bg-warning/20 border-warning/20 shadow-none"><Clock className="w-3 h-3 mr-1" /> Em Análise</Badge>}
                    {lead.status === 'aprovado' && <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 shadow-none">Aprovado</Badge>}
                    {lead.status === 'recusado' && <Badge variant="secondary" className="bg-danger/10 text-danger hover:bg-danger/20 border-danger/20 shadow-none"><XCircle className="w-3 h-3 mr-1" /> Recusado</Badge>}
                    {lead.status === 'efetivado' && <Badge variant="secondary" className="bg-success/10 text-success hover:bg-success/20 border-success/20 shadow-none"><CheckCircle2 className="w-3 h-3 mr-1" /> Cliente Efetivado</Badge>}
                    {lead.status === 'contratado' && <Badge variant="secondary" className="bg-success/10 text-success border-success/20 shadow-none">Contratado</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    {lead.status === 'em_analise' ? (
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="text-danger hover:bg-danger/10 btn-micro" onClick={() => updateLeadStatus(lead.id, 'recusado')} title="Recusar">
                          <XCircle size={18} />
                        </Button>
                        <Button variant="default" size="sm" className="bg-success hover:bg-success/90 text-white btn-micro shadow-soft" onClick={() => convertLeadToCliente(lead.id)}>
                          <CheckCircle2 size={16} className="mr-2" /> Efetivar Cliente
                        </Button>
                      </div>
                    ) : (
                       <Button variant="ghost" size="sm" disabled>
                         Concluído
                       </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {leads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                    Nenhum lead encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
