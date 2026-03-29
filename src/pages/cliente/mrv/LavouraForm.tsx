import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Leaf, Plus, Save } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function LavouraForm() {
  const [registros, setRegistros] = useState([
    { id: 1, cultura: 'Soja', area: '1200', preparo: 'Plantio Direto', produtividade: '60 sc/ha' }
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Leaf className="text-primary" /> Uso do Solo e Culturas
          </h2>
          <p className="text-sm text-muted-foreground">Informe o planejamento de plantio para a safra atual.</p>
        </div>
        <Button className="btn-micro rounded-xl gap-2 bg-primary">
          <Plus size={16} /> Novo Talhão
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-6 border-b border-border/50">
        <div className="space-y-2">
          <Label>Cultura Principal</Label>
          <Select defaultValue="soja">
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="soja">Soja</SelectItem>
              <SelectItem value="milho">Milho</SelectItem>
              <SelectItem value="algodao">Algodão</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Área Plantada (Hectares)</Label>
          <Input type="number" placeholder="Ex: 500" className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>Tipo de Preparo</Label>
          <Select defaultValue="pd">
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pd">Plantio Direto</SelectItem>
              <SelectItem value="convencional">Convencional</SelectItem>
              <SelectItem value="reduzido">Cultivo Reduzido</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 flex items-end">
          <Button variant="outline" className="w-full rounded-xl gap-2">Adicionar</Button>
        </div>
      </div>

      <Table>
        <TableHeader className="bg-accent/5">
          <TableRow>
            <TableHead>Cultura</TableHead>
            <TableHead>Área</TableHead>
            <TableHead>Manejo</TableHead>
            <TableHead>Produtividade Estimada</TableHead>
            <TableHead className="text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {registros.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium text-foreground">{r.cultura}</TableCell>
              <TableCell>{r.area} ha</TableCell>
              <TableCell>{r.preparo}</TableCell>
              <TableCell>{r.produtividade}</TableCell>
              <TableCell className="text-right"><Button variant="ghost" size="sm" className="text-danger btn-micro">Remover</Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-end pt-4">
        <Button className="rounded-xl gap-2"><Save size={16} /> Salvar Etapa</Button>
      </div>
    </div>
  )
}
