import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CheckCircle2, Clock, DollarSign, DownloadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'

import { useDataStore } from '@/store/data'

export default function ComissoesPage() {
  const comissoes = useDataStore((state) => state.comissoes)
  const totalPago = comissoes.filter(c => c.status === 'pago').reduce((acc, curr) => acc + curr.valor, 0)
  const totalProjetado = comissoes.filter(c => c.status === 'projetado').reduce((acc, curr) => acc + curr.valor, 0)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Minhas Comissões</h1>
          <p className="text-muted">Extrato de comissões pagas e projetadas para os próximos anos.</p>
        </div>
        <Button variant="outline" className="gap-2 shrink-0">
          <DownloadCloud size={16} /> Exportar Relatório
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="border-border/50 bg-success/5 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-success">Total Pago (Realizado)</CardTitle>
            <DollarSign className="w-4 h-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPago)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Ano 0 garantido liquidado</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-primary/5 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-primary">Saldo Projetado (A Receber)</CardTitle>
            <Clock className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalProjetado)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Anos 2, 4, 6, 8 e 10 estimados</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-sm mt-6">
        <CardHeader className="bg-surface/50 border-b">
          <CardTitle className="text-lg">Extrato Detalhado</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-accent/30">
              <TableRow>
                <TableHead>Propriedade / Lead</TableHead>
                <TableHead>Parcela</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-center w-32">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comissoes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.fazenda}</TableCell>
                  <TableCell>{c.parcela}</TableCell>
                  <TableCell className="text-muted-foreground">{c.dataVencimento}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.valor)}
                  </TableCell>
                  <TableCell className="text-center">
                    {c.status === 'pago' ? (
                      <Badge className="bg-success/10 text-success hover:bg-success/20 border-success/20 shadow-none"><CheckCircle2 className="w-3 h-3 mr-1" /> Pago</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 shadow-none"><Clock className="w-3 h-3 mr-1" /> Projetado</Badge>
                    )}
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
