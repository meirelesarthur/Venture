import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, Plus, Save } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function FertilizacaoForm() {
  const [registros, setRegistros] = useState([
    { id: 1, tipo: 'Sintético N', produto: 'Ureia', quantidade: '25.000 kg', aplicacao: 'Lanços Cobertura' },
    { id: 2, tipo: 'Corretivo', produto: 'Calcário Dolomítico', quantidade: '150.000 kg', aplicacao: 'Incorporado' },
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-border/50 pb-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <AlertCircle className="text-primary" /> Uso de Fertilizantes e Corretivos
          </h2>
          <p className="text-sm text-muted-foreground">Registre os insumos aplicados na safra. Isso impacta as emissões da baseline (N2O).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-6">
        <div className="space-y-2">
          <Label>Classe do Insumo</Label>
          <Select defaultValue="sintetico_n">
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sintetico_n">Sintético - Nitrogênio</SelectItem>
              <SelectItem value="sintetico_p">Sintético - Fósforo/Potássio</SelectItem>
              <SelectItem value="organico">Orgânico (Esterco/Cama)</SelectItem>
              <SelectItem value="corretivo">Corretivo (Calcário)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Nome do Produto/Composição</Label>
          <Input placeholder="Ex: Ureia 46%" className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>Quantidade Total (kg)</Label>
          <Input type="number" placeholder="0" className="rounded-xl" />
        </div>
        <div className="space-y-2 flex items-end">
          <Button variant="outline" className="w-full rounded-xl gap-2"><Plus size={16}/> Adicionar Aplicação</Button>
        </div>
      </div>

      <Table>
        <TableHeader className="bg-accent/5">
          <TableRow>
            <TableHead>Classe</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead>Método</TableHead>
            <TableHead className="text-right">Quantidade Aplicada</TableHead>
            <TableHead className="text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {registros.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium text-foreground">{r.tipo}</TableCell>
              <TableCell>{r.produto}</TableCell>
              <TableCell>{r.aplicacao}</TableCell>
              <TableCell className="text-right font-medium">{r.quantidade}</TableCell>
              <TableCell className="text-right"><Button variant="ghost" size="sm" className="text-danger btn-micro">Excluir</Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-end pt-4">
        <Button className="rounded-xl gap-2 bg-primary"><Save size={16} /> Salvar Etapa</Button>
      </div>
    </div>
  )
}
