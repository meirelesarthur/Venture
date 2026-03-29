import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Link } from 'react-router-dom'
import { FileSearch, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

import { useDataStore } from '@/store/data'

export default function AdminClientes() {
  const clientes = useDataStore((state) => state.clientes)
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestão de Clientes</h1>
        <p className="text-muted">Revise os dados reportados na plataforma MRV e acesse os resultados do Motor de Cálculos.</p>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="bg-surface/50 border-b flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg">Carteira de Clientes</CardTitle>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 h-9" placeholder="Buscar produtor ou fazenda..." />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-accent/30">
              <TableRow>
                <TableHead>Produtor</TableHead>
                <TableHead>Área Elegível</TableHead>
                <TableHead>Progresso MRV</TableHead>
                <TableHead>Status Motor (RothC)</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-foreground">{c.nome}</TableCell>
                  <TableCell>{c.area.toLocaleString('pt-br')} ha</TableCell>
                  <TableCell>
                    {c.statusMRV === 'Em Validação' && <Badge variant="secondary" className="bg-warning/10 text-warning">{c.statusMRV}</Badge>}
                    {c.statusMRV === 'Auditoria Aprovada' && <Badge variant="secondary" className="bg-success/10 text-success">{c.statusMRV}</Badge>}
                    {c.statusMRV === 'Em submissão' && <Badge variant="outline" className="text-muted-foreground">{c.statusMRV}</Badge>}
                  </TableCell>
                  <TableCell>
                    {c.motor === 'Rodado' ? (
                      <span className="text-sm font-medium text-success flex items-center gap-1">✔ Concluído</span>
                    ) : (
                      <span className="text-sm text-muted-foreground flex items-center gap-1">{c.motor}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild className="text-primary">
                      <Link to={`/admin/motor/${c.id}`}><FileSearch size={16} className="mr-2" /> Revisar e Rodar</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
