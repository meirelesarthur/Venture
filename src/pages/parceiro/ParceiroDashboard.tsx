import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { Users, Map, DollarSign, Trophy } from 'lucide-react'

export default function ParceiroDashboard() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Painel do Parceiro</h1>
          <p className="text-muted">Desempenho da sua carteira de produtores e comissões.</p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/parceiro/leads/novo">Indicar Produtor</Link>
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 shadow-sm bg-surface">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">12</div>
            <p className="text-xs text-muted-foreground">+2 no último mês</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm bg-surface">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted">Hectares na Carteira</CardTitle>
            <Map className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">8.400 ha</div>
            <p className="text-xs text-muted-foreground">Elegíveis e aprovados</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm bg-surface">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted">Comissão Projetada</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">U$ 8.400</div>
            <p className="text-xs text-muted-foreground">Ano 0 garantido</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Seu Ranking</CardTitle>
            <Trophy className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">4º Lugar</div>
            <p className="text-xs text-muted-foreground">Região Centro-Oeste</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Próximo Nível (Prata D+)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted">Atraseja 10.000 hectares para desbloquear um bônus de performance de +20%.</p>
            <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
              <div className="bg-primary h-2.5 rounded-full" style={{ width: '84%' }} />
            </div>
            <p className="text-xs text-right text-muted font-medium">Faltam 1.600 ha</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
