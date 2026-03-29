import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Shield, ShieldAlert, ShieldCheck, UserPlus, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

const mockUsers = [
  { id: '1', nome: 'Admin Principal', email: 'admin@venturecarbon.com', role: 'Super Admin', status: 'Ativo' },
  { id: '2', nome: 'Auditor Externo', email: 'auditor@certificadora.com', role: 'Visualizador', status: 'Ativo' },
  { id: '3', nome: 'João G. (Operações)', email: 'operacoes@venturecarbon.com', role: 'Editor', status: 'Inativo' },
]

export default function AdminUsers() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Acesso e Permissões</h1>
          <p className="text-muted-foreground">Gerencie quem tem acesso ao painel administrativo da Geração e Motor de Créditos.</p>
        </div>
        <Button className="gap-2 shrink-0 shadow-soft btn-micro rounded-xl">
          <UserPlus size={16} /> Novo Administrador
        </Button>
      </div>

      <Card className="card-minimal mt-6">
        <CardHeader className="bg-surface/50 border-b flex-row items-center justify-between pb-4 rounded-t-xl">
          <CardTitle className="text-lg flex items-center gap-2"><Shield className="text-primary"/> Equipe Interna</CardTitle>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 h-9 rounded-xl" placeholder="Buscar usuário..." />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-accent/5">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Nível de Acesso</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-semibold text-foreground">{u.nome}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
                  <TableCell>
                    {u.role === 'Super Admin' && <span className="flex items-center gap-1 text-sm font-medium text-danger"><ShieldAlert size={14}/> {u.role}</span>}
                    {u.role === 'Editor' && <span className="flex items-center gap-1 text-sm font-medium text-primary"><ShieldCheck size={14}/> {u.role}</span>}
                    {u.role === 'Visualizador' && <span className="flex items-center gap-1 text-sm font-medium text-muted-foreground"><Shield size={14}/> {u.role}</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    {u.status === 'Ativo' ? (
                      <Badge className="bg-success/10 text-success shadow-none">Ativo</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground shadow-none">Bloqueado</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 btn-micro">
                      Gerenciar
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
