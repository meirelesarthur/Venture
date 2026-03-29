import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserCircle, Save } from 'lucide-react'

export default function PerfilPage() {
  const { user } = useAuthStore()

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Meu Perfil</h1>
        <p className="text-muted-foreground">Gerencie suas informações pessoais e credenciais de acesso.</p>
      </div>

      <Card className="card-minimal mt-6">
        <CardHeader className="bg-surface/50 border-b pb-6 rounded-t-xl">
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="text-primary" /> Dados Gerais
          </CardTitle>
          <CardDescription>
            Informações básicas associadas à sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input id="nome" defaultValue={user?.name} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail de Acesso</Label>
              <Input id="email" type="email" defaultValue={user?.email} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Nível de Acesso</Label>
              <Input id="role" defaultValue={user?.role?.toUpperCase()} disabled className="rounded-xl bg-muted/20" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" placeholder="(00) 00000-0000" className="rounded-xl" />
            </div>
          </div>
          
          <div className="flex justify-end pt-4 border-t border-border/50">
            <Button className="rounded-xl shadow-soft btn-micro bg-primary text-primary-foreground">
              <Save size={16} className="mr-2" /> Salvar Alterações
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className="card-minimal border-danger/20">
        <CardHeader className="bg-danger/5 border-b border-danger/10 pb-6 rounded-t-xl">
          <CardTitle className="text-danger flex items-center gap-2">
            Segurança
          </CardTitle>
          <CardDescription className="text-danger/70">
            Ações sensíveis da sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
             <div>
               <p className="font-medium text-foreground">Alterar Senha</p>
               <p className="text-sm text-muted-foreground">Recomendamos alterar sua senha a cada 90 dias.</p>
             </div>
             <Button variant="outline" className="rounded-xl shadow-sm border-border">Atualizar Senha</Button>
           </div>
        </CardContent>
      </Card>
    </div>
  )
}
