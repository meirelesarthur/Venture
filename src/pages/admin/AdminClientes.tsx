import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useDataStore } from '@/store/data'
import { Users, Map, CheckCircle2, Clock, MapPin, ArrowRight } from 'lucide-react'

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    'Auditoria Aprovada': 'bg-success/10 text-success border-success/20',
    'Em Validação':       'bg-primary/10 text-primary border-primary/20',
    'Em submissão':       'bg-warning/10 text-warning border-warning/20',
    'Aberto':             'bg-muted/20 text-muted-foreground border-border/50',
    'N/A':                'bg-muted/20 text-muted-foreground border-border/50',
  }
  return (
    <Badge variant="outline" className={`shadow-none text-xs ${map[status] ?? 'bg-muted/20 text-muted-foreground'}`}>
      {status}
    </Badge>
  )
}

export default function AdminClientes() {
  const { clientes, fazendas, talhoes } = useDataStore()
  const navigate = useNavigate()

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted">Produtores ativos no programa de carbono.</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-surface shadow-sm">
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm text-muted">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold">{clientes.length}</p></CardContent>
        </Card>
        <Card className="border-border/50 bg-surface shadow-sm">
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm text-muted">Total Hectares</CardTitle>
            <Map className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold">{clientes.reduce((a,c)=>a+c.area,0).toLocaleString('pt-BR')}</p></CardContent>
        </Card>
        <Card className="border-border/50 bg-surface shadow-sm">
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm text-muted">MRV Aprovado</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold">{clientes.filter(c=>c.statusMRV==='Auditoria Aprovada').length}</p></CardContent>
        </Card>
        <Card className="border-border/50 bg-surface shadow-sm">
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm text-muted">Em Validação</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold">{clientes.filter(c=>c.statusMRV==='Em Validação').length}</p></CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="bg-surface/50 border-b pb-4">
          <CardTitle className="text-lg">Lista de Produtores</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-accent/5">
              <TableRow>
                <TableHead>Produtor</TableHead>
                <TableHead>Fazenda (Principal)</TableHead>
                <TableHead>Área Total</TableHead>
                <TableHead>Talhões</TableHead>
                <TableHead className="text-center">Status MRV</TableHead>
                <TableHead className="text-right">Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.map(c => {
                const fazenda = fazendas.find(f => f.produtorId === c.id)
                const meusTalhoes = fazenda ? talhoes.filter(t => t.fazendaId === fazenda.id) : []
                return (
                  <TableRow key={c.id} className="cursor-pointer hover:bg-accent/50" onClick={() => navigate(`/admin/clientes/${c.id}`)}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-foreground">{c.nome}</p>
                        {c.email && <p className="text-xs text-muted">{c.email}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {fazenda ? (
                        <div className="flex items-center gap-1.5 text-sm">
                          <MapPin size={12} className="text-muted" />
                          <span>{fazenda.nome}</span>
                          <span className="text-xs text-muted">— {fazenda.municipio}/{fazenda.estado}</span>
                        </div>
                      ) : <span className="text-muted text-sm">—</span>}
                    </TableCell>
                    <TableCell>{c.area.toLocaleString('pt-BR')} ha</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{meusTalhoes.length}</span>
                        <span className="text-xs text-success">{meusTalhoes.filter(t => t.tipo === 'projeto').length} proj.</span>
                        <span className="text-xs text-primary">{meusTalhoes.filter(t => t.tipo === 'control_site').length} ctrl.</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center"><StatusBadge status={c.statusMRV} /></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" asChild className="rounded-xl gap-1 h-8">
                        <Link to={`/admin/clientes/${c.id}`}><ArrowRight size={14} /></Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
