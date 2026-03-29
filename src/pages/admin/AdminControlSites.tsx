import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MapPin, Plus, AlertCircle, CheckCircle2 } from 'lucide-react'

import { useDataStore } from '@/store/data'

export default function AdminControlSites() {
  const mockSites = useDataStore((state) => state.controlSites)
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Control Sites</h1>
          <p className="text-muted">Áreas mantenedoras de baseline convencional. Mínimo de 3 requeridos (VM0042).</p>
        </div>
        <Button className="gap-2">
          <Plus size={16} /> Adicionar Site
        </Button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="border-border/50 bg-surface shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted">Total Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{mockSites.length}</div>
            <p className="text-xs text-muted mt-1 text-warning flex items-center gap-1"><AlertCircle size={12}/> {mockSites.length <= 3 ? 'No limite mínimo metodológico' : 'Metodologia atendida'}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-sm mt-6">
        <CardHeader className="bg-surface/50 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin size={20} className="text-primary" /> Lista de Control Sites Ativos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-accent/30">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Área (ha)</TableHead>
                <TableHead>Bioma</TableHead>
                <TableHead>Similaridade (Critérios)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockSites.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-foreground">{c.nome}</TableCell>
                  <TableCell>{c.area} ha</TableCell>
                  <TableCell>{c.biome}</TableCell>
                  <TableCell>
                    {c.similaridade}/11
                    <div className="w-24 bg-secondary h-1.5 rounded-full mt-1 overflow-hidden">
                      <div className={`h-1.5 rounded-full ${c.similaridade >= 8 ? 'bg-success' : 'bg-warning'}`} style={{ width: `${(c.similaridade/11)*100}%` }} />
                    </div>
                  </TableCell>
                  <TableCell>
                    {c.status === 'Valido' ? (
                      <Badge className="bg-success/10 text-success hover:bg-success/20 border-success/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Válido</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-warning/10 text-warning hover:bg-warning/20 border-warning/20"><AlertCircle className="w-3 h-3 mr-1" /> Revisão de Similaridade</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">Editar</Button>
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
