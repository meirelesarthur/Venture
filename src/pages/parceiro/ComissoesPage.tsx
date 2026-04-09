import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CheckCircle2, Clock, DollarSign, DownloadCloud, Eye, EyeOff, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

import { useDataStore } from '@/store/data'

export default function ComissoesPage() {
  const comissoes = useDataStore((state) => state.comissoes)
  const totalPago = comissoes.filter(c => c.status === 'pago').reduce((acc, curr) => acc + curr.valor, 0)
  const totalProjetado = comissoes.filter(c => c.status === 'projetado').reduce((acc, curr) => acc + curr.valor, 0)
  const [showValues, setShowValues] = useState(false)

  const fmt = (n: number) => {
    if (!showValues) return 'R$ ••••••'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
  }

  const fmtAlways = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Minhas Comissões</h1>
          <p className="text-muted">Extrato de comissões pagas e projetadas para os próximos anos.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted hover:text-foreground"
            onClick={() => setShowValues(!showValues)}
          >
            {showValues ? <EyeOff size={16} /> : <Eye size={16} />}
            {showValues ? 'Ocultar Valores' : 'Mostrar Valores'}
          </Button>
          <Button variant="outline" className="gap-2 shrink-0">
            <DownloadCloud size={16} /> Exportar Relatório
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="border-border/50 bg-success/5 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-success">Total Pago (Realizado)</CardTitle>
            <DollarSign className="w-4 h-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold text-success ${!showValues ? 'value-masked' : ''}`}>
              {fmt(totalPago)}
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
            <div className={`text-3xl font-bold text-primary ${!showValues ? 'value-masked' : ''}`}>
              {fmt(totalProjetado)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Anos 2, 4, 6, 8 e 10 estimados</p>
          </CardContent>
        </Card>
      </div>

      {/* Regras de comissão — card explicativo */}
      <div className="p-4 bg-surface border border-border/50 rounded-xl">
        <div className="flex items-start gap-3">
          <HelpCircle size={16} className="text-primary flex-shrink-0 mt-0.5" />
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <p className="text-sm font-medium text-foreground">Como funciona a comissão?</p>
            <p>
              <strong className="text-success">● Ano 0 (Garantido):</strong> Comissão fixa paga na assinatura do contrato e coleta de solo.
              Calculada como: <code className="bg-secondary px-1.5 py-0.5 rounded text-[11px]">ha × US$ 1,00/ha × PTAX</code>.
            </p>
            <p>
              <strong className="text-primary">● Anos 2, 4, 6, 8, 10 (Condicionados):</strong> Comissão variável condicionada à performance
              de créditos emitidos e vendidos. Calculada como: <code className="bg-secondary px-1.5 py-0.5 rounded text-[11px]">(VCUs_emitidos ÷ 2) × ha × US$/ha × PTAX</code>.
            </p>
            <p className="text-[11px] text-muted">
              Os valores dos anos condicionados são estimativas e dependem do resultado real do motor de cálculos, validação do auditor e condições de mercado.
            </p>
          </div>
        </div>
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
                <TableHead className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    Valor
                    <button onClick={() => setShowValues(!showValues)} className="text-muted hover:text-foreground">
                      {showValues ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                  </div>
                </TableHead>
                <TableHead className="text-center w-32">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comissoes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.fazenda}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {c.parcela}
                      {c.anoPagamento === 0 && (
                        <span className="text-[10px] bg-success/10 text-success px-1.5 py-0.5 rounded-full">garantido</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.dataVencimento}</TableCell>
                  <TableCell className={`text-right font-semibold ${!showValues ? 'value-masked' : ''}`}>
                    {showValues ? fmtAlways(c.valor) : 'R$ ••••'}
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
