import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Leaf, Map } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useDataStore } from '@/store/data'

// Remover array de mrvSections que era usado para overview complexo.

export default function DashboardPage() {
  const { user } = useAuthStore()
  const clientes = useDataStore(state => state.clientes)
  
  // Para fins de demonstração do relacional: Pega o primeiro cliente como sendo a conta, ou busca pelo nome
  const userClient = clientes.find(c => c.nome.includes(user?.name?.split(' ')[0] || 'x')) || clientes[0]

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Olá, {user?.name || userClient?.nome}</h1>
          <p className="text-muted">Acompanhe sua jornada na Geração de Créditos de Carbono para a área de {userClient?.area} ha.</p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/dashboard/mrv">Retomar MRV</Link>
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Resumo de Dados e Práticas */}
        <Card className="md:col-span-2 border-border/50 shadow-sm bg-surface">
          <CardHeader className="border-b bg-surface/50 pb-4">
            <CardTitle className="text-lg flex items-center gap-2"><Leaf className="text-primary"/> Dados e Práticas da Propriedade</CardTitle>
            <CardDescription>Resumo do escopo do seu projeto regenerativo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border/50 bg-accent/5">
                <p className="text-sm text-muted">Área Total Elegível</p>
                <p className="text-2xl font-bold text-foreground">{userClient?.area?.toLocaleString('pt-br')} ha</p>
              </div>
              <div className="p-4 rounded-xl border border-border/50 bg-accent/5">
                <p className="text-sm text-muted">Culturas Principais</p>
                <p className="text-xl font-semibold text-foreground">Soja, Milho Especial</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wider">Práticas Adotadas na Safra</h4>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-success/10 text-success text-sm font-medium">Plantio Direto</span>
                <span className="px-3 py-1 rounded-full bg-success/10 text-success text-sm font-medium">Rotação de Culturas</span>
                <span className="px-3 py-1 rounded-full bg-success/10 text-success text-sm font-medium">Fertilizante Orgânico</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projeções Financeiras Minimais */}
        <Card className="border-border/50 shadow-sm bg-success/5 border-success/20">
          <CardHeader>
            <CardTitle className="text-lg text-success flex items-center gap-2">Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm text-success/80 mb-1">Receita Potencial Estimada</p>
              <p className="text-3xl font-bold text-success">R$ 1.369.500</p>
            </div>
            <div className="pt-4 border-t border-success/20">
              <p className="text-sm text-success/80 mb-1">Total de Créditos (VCUs)</p>
              <p className="text-2xl font-bold text-success/90">12.450</p>
              <p className="text-xs text-success/70 flex items-center gap-1 mt-1">Ao longo de 10 anos</p>
            </div>
            <Button className="w-full bg-success hover:bg-success/90 text-white rounded-xl shadow-soft" asChild>
              <Link to="/dashboard/resultados">Explorar Finanças</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Mapa Visão Geral */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-surface/50">
          <CardTitle className="text-lg flex items-center gap-2">
            <Map size={20} className="text-muted-foreground" /> 
            Suas Áreas (Talhões)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[400px] w-full bg-accent/20 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-[url('https://maps.wikimedia.org/osm-intl/12/1559/2288.png')] opacity-30 bg-cover bg-center mix-blend-multiply" />
            <div className="relative text-center p-6 bg-surface/80 backdrop-blur-sm rounded-xl border border-border/50 shadow-lg max-w-sm">
              <Map size={48} className="mx-auto text-muted mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-1">Mapa de Talhões</h3>
              <p className="text-sm text-muted mb-4">
                As áreas estão sendo georreferenciadas com base nos arquivos KML enviados.
              </p>
              <Button size="sm">Gerenciar Áreas</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
