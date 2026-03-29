import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, Plus, Save } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function PecuariaForm() {
  const [registros, setRegistros] = useState([
    { id: 1, categoria: 'Bovino de Corte', sistema: 'Pasto', cabeças: '850', pesoMedio: '350 kg' }
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Users className="text-primary" /> Atividade Pecuária
          </h2>
          <p className="text-sm text-muted-foreground">Registre os animais presentes na propriedade durante a safra.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-6 border-b border-border/50">
        <div className="space-y-2">
          <Label>Categoria Animal</Label>
          <Select defaultValue="bovino_corte">
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="bovino_corte">Bovino de Corte</SelectItem>
              <SelectItem value="bovino_leite">Bovino de Leite</SelectItem>
              <SelectItem value="ovinos">Ovinos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Sistema de Criação</Label>
          <Select defaultValue="pasto">
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pasto">Pasto</SelectItem>
              <SelectItem value="confinamento">Confinamento</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Qnt. de Animais (Média/Ano)</Label>
          <Input type="number" placeholder="Ex: 1000" className="rounded-xl" />
        </div>
        <div className="space-y-2 flex items-end">
          <Button variant="outline" className="w-full rounded-xl gap-2"><Plus size={16}/> Adicionar Lote</Button>
        </div>
      </div>

      <Table>
        <TableHeader className="bg-accent/5">
          <TableRow>
            <TableHead>Categoria</TableHead>
            <TableHead>Sistema</TableHead>
            <TableHead>Cabeças</TableHead>
            <TableHead>Peso Médio Vivo</TableHead>
            <TableHead className="text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {registros.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium text-foreground">{r.categoria}</TableCell>
              <TableCell>{r.sistema}</TableCell>
              <TableCell>{r.cabeças}</TableCell>
              <TableCell>{r.pesoMedio}</TableCell>
              <TableCell className="text-right"><Button variant="ghost" size="sm" className="text-danger btn-micro">Excluir</Button></TableCell>
            </TableRow>
          ))}
          {registros.length === 0 && (
            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Propriedade sem pecuária declarada.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex justify-end pt-4">
        <Button className="rounded-xl gap-2 bg-primary"><Save size={16} /> Salvar Etapa</Button>
      </div>
    </div>
  )
}
