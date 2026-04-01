import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Mail, Link as LinkIcon, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useDataStore } from '@/store/data'
import { Toaster, toast } from 'sonner'

export default function AdminParceiros() {
  const parceiros = useDataStore((state) => state.parceiros)

  const copyRefLink = (id: string) => {
    const link = `${window.location.origin}/simulacao?ref=${id}`
    navigator.clipboard.writeText(link)
    toast.success('Link de afiliado copiado!')
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Parceiros</h1>
          <p className="text-muted-foreground">Convide assessores e exportadores para originar leads e distribua comissões.</p>
        </div>
        <Button className="gap-2 shrink-0 shadow-soft btn-micro rounded-xl">
          <Plus size={16} /> Convidar Parceiro
        </Button>
      </div>

      <Card className="card-minimal mt-6">
        <CardHeader className="bg-surface/50 border-b flex-row items-center justify-between pb-4 rounded-t-xl">
          <CardTitle className="text-lg">Rede de Afiliados</CardTitle>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 h-9 rounded-xl" placeholder="Buscar parceiro..." />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-accent/5">
              <TableRow>
                <TableHead>Parceiro</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead className="text-center">Leads Gerados</TableHead>
                <TableHead className="text-right">Comissão Total</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Afiliado Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parceiros.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-semibold text-foreground">{p.nome}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    <div className="flex items-center gap-2">
                      <Mail size={14} /> {p.email}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium">{p.leadsGerados}</TableCell>
                  <TableCell className="text-right font-medium text-success">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.comissaoTotal)}
                  </TableCell>
                  <TableCell className="text-center">
                    {p.status === 'ativo' ? (
                      <Badge className="bg-success/10 text-success hover:bg-success/20 border-success/20 shadow-none">Ativo</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground shadow-none">Pendente</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 btn-micro" onClick={() => copyRefLink(p.id)}>
                      <LinkIcon size={16} className="mr-2" /> Copiar Link
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
