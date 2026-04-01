import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Shield, ShieldAlert, ShieldCheck, UserPlus, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useDataStore, type AppUser, type UserRole } from '@/store/data'

export default function AdminUsers() {
  const { usuarios, addUsuario, updateUsuario } = useDataStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AppUser | null>(null)

  // Form state
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('Editor')
  const [status, setStatus] = useState<'Ativo' | 'Bloqueado'>('Ativo')

  const filteredUsers = usuarios.filter(u => 
    u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openForm = (u?: AppUser) => {
    if (u) {
      setEditingUser(u)
      setNome(u.nome)
      setEmail(u.email)
      setRole(u.role)
      setStatus(u.status)
    } else {
      setEditingUser(null)
      setNome('')
      setEmail('')
      setRole('Editor')
      setStatus('Ativo')
    }
    setIsSheetOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingUser) {
      updateUsuario(editingUser.id, { nome, email, role, status })
    } else {
      addUsuario({ nome, email, role, status })
    }
    setIsSheetOpen(false)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Acesso e Permissões</h1>
          <p className="text-muted-foreground">Gerencie quem tem acesso ao painel administrativo da Geração e Motor de Créditos.</p>
        </div>
        <Button className="gap-2 shrink-0 shadow-soft btn-micro rounded-xl" onClick={() => openForm()}>
          <UserPlus size={16} /> Novo Administrador
        </Button>
      </div>

      <Card className="card-minimal mt-6">
        <CardHeader className="bg-surface/50 border-b flex-row items-center justify-between pb-4 rounded-t-xl">
          <CardTitle className="text-lg flex items-center gap-2"><Shield className="text-primary"/> Equipe Interna</CardTitle>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              className="pl-9 h-9 rounded-xl" 
              placeholder="Buscar usuário..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u) => (
                <TableRow key={u.id} className="cursor-pointer hover:bg-accent/5" onClick={() => openForm(u)}>
                  <TableCell className="font-semibold text-foreground">{u.nome}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
                  <TableCell>
                    {u.role === 'Super Admin' && <span className="flex items-center gap-1 text-sm font-medium text-danger"><ShieldAlert size={14}/> {u.role}</span>}
                    {u.role === 'Admin' && <span className="flex items-center gap-1 text-sm font-medium text-warning"><ShieldCheck size={14}/> {u.role}</span>}
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
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum usuário encontrado.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-md">
          <SheetHeader className="mb-6">
            <SheetTitle>{editingUser ? 'Editar Administrador' : 'Novo Administrador'}</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input 
                value={nome} 
                onChange={(e) => setNome(e.target.value)} 
                required 
                placeholder="Ex. João Silva"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">E-mail</label>
              <Input 
                type="email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="joao@venturecarbon.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nível de Acesso</label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="flex h-10 w-full rounded-md border border-input bg-surface px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="Super Admin">Super Admin</option>
                <option value="Admin">Admin</option>
                <option value="Editor">Editor</option>
                <option value="Visualizador">Visualizador</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value as 'Ativo' | 'Bloqueado')}
                className="flex h-10 w-full rounded-md border border-input bg-surface px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="Ativo">Ativo</option>
                <option value="Bloqueado">Bloqueado</option>
              </select>
            </div>

            <div className="pt-6 flex justify-end gap-3 w-full">
              <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)} className="w-full">
                Cancelar
              </Button>
              <Button type="submit" className="w-full">
                {editingUser ? 'Salvar Alterações' : 'Criar Administrador'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
