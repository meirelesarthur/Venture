import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { Users, FileText, AlertTriangle, ArrowRight, Settings, MapPin } from 'lucide-react'

export default function AdminDashboard() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Painel Administrador</h1>
          <p className="text-muted">Visão global da plataforma e gestão de auditoria.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild className="gap-2">
            <Link to="/admin/parametros"><Settings size={16} /> Parâmetros globais</Link>
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-border/50 shadow-sm bg-surface">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">42</div>
            <p className="text-xs text-muted-foreground mt-1">Produtores c/ MRV em andamento</p>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 shadow-sm bg-surface">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted">Parceiros Originadores</CardTitle>
            <Users className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">18</div>
            <p className="text-xs text-muted-foreground mt-1">Consultorias com leads convertidos</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-surface">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted">Control Sites Configurados</CardTitle>
            <MapPin className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">15</div>
            <p className="text-xs text-muted-foreground mt-1">3 em alerta de similaridade VMD0053</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-danger/20 bg-danger/5 shadow-sm">
          <CardHeader className="pb-3 border-b border-danger/10">
            <CardTitle className="text-lg flex items-center gap-2 text-danger">
              <AlertTriangle size={20} /> Alertas de Plataforma
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-danger/10">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-foreground text-sm">Control Sites Insuficientes (Região Sul)</h4>
                  <p className="text-xs text-muted">Apenas 2 cadastrados. Mínimo de 3 requeridos na metodologia.</p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/admin/control-sites" className="text-danger">Revisar</Link>
                </Button>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-foreground text-sm">Cotação PTAX desatualizada</h4>
                  <p className="text-xs text-muted">Falha na integração com BCB hoje. Usando fallback.</p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/admin/parametros" className="text-primary">Resolver</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText size={20} className="text-primary" /> Fila de Validação (MRV)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-foreground text-sm">Fazenda Boa Esperança</h4>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Lavoura</Badge>
                  </div>
                  <p className="text-xs text-muted mt-1">Aguardando aprovação de dados de plantio.</p>
                </div>
                <Button size="sm" variant="secondary" asChild className="gap-2">
                  <Link to="/admin/clientes/1">Revisar <ArrowRight size={14} /></Link>
                </Button>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-foreground text-sm">Sítio das Águas</h4>
                    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Documentos</Badge>
                  </div>
                  <p className="text-xs text-muted mt-1">Notas fiscais Inibidores submetidas.</p>
                </div>
                <Button size="sm" variant="secondary" asChild className="gap-2">
                  <Link to="/admin/clientes/2">Revisar <ArrowRight size={14} /></Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
