import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tractor, Plus, Save } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function OperacionalForm() {
  const [registros, setRegistros] = useState([
    { id: 1, operacao: 'Plantio e Pulverização', comb: 'Diesel S10', litros: '15.400 L' },
    { id: 2, operacao: 'Colheita e Transporte Interno', comb: 'Diesel S10', litros: '8.200 L' },
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-border/50 pb-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Tractor className="text-primary" /> Operações Mecanizadas
          </h2>
          <p className="text-sm text-muted-foreground">Registre o consumo de energia e combustíveis fósseis das máquinas agrícolas.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-6">
        <div className="space-y-2 md:col-span-2">
          <Label>Grupo Operacional</Label>
          <Select defaultValue="plantio">
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="preparo">Preparo de Solo (Gradagem, Subsolagem)</SelectItem>
              <SelectItem value="plantio">Plantio, Tratos e Pulverização</SelectItem>
              <SelectItem value="colheita">Colheita e Transporte</SelectItem>
              <SelectItem value="bombeio">Irrigação (Motores a Combustão)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Consumo Bruto Declarado</Label>
          <div className="flex items-center gap-2">
             <Input type="number" placeholder="0" className="rounded-xl" />
             <span className="text-sm font-medium text-muted-foreground">Litros</span>
          </div>
        </div>
        <div className="space-y-2 flex items-end">
          <Button variant="outline" className="w-full rounded-xl gap-2"><Plus size={16}/> Lançar Consumo</Button>
        </div>
      </div>

      <Table>
        <TableHeader className="bg-accent/5">
          <TableRow>
            <TableHead>Grupo de Operação</TableHead>
            <TableHead>Combustível</TableHead>
            <TableHead className="text-right">Volume Consumido</TableHead>
            <TableHead className="text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {registros.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium text-foreground">{r.operacao}</TableCell>
              <TableCell>{r.comb}</TableCell>
              <TableCell className="text-right font-medium">{r.litros}</TableCell>
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
