import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, XAxis, YAxis } from 'recharts'

const mockTimelineData = [
  { ano: '2026', vcus: 0, acumulado: 0, status: 'Auditoria' },
  { ano: '2027', vcus: 1245, acumulado: 1245, status: 'Emitido' },
  { ano: '2028', vcus: 1250, acumulado: 2495, status: 'Projetado' },
  { ano: '2029', vcus: 1240, acumulado: 3735, status: 'Projetado' },
  { ano: '2030', vcus: 1260, acumulado: 4995, status: 'Projetado' },
]

export default function ResultadosPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Resultados e Extrato</h1>
        <p className="text-muted">Histórico de emissões e projeção de Créditos de Carbono (VCUs).</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-6 border-border/50 bg-surface">
          <h4 className="text-sm font-medium text-muted mb-2">VCUs Emitidos Total</h4>
          <p className="text-3xl font-bold text-success">1.245 <span className="text-sm font-normal text-muted">tCO₂e</span></p>
        </Card>
        <Card className="p-6 border-border/50 bg-surface">
          <h4 className="text-sm font-medium text-muted mb-2">Valor Estimado (Mercado)</h4>
          <p className="text-3xl font-bold text-foreground">US$ 24.900</p>
          <p className="text-xs text-muted mt-1">@ US$ 20.00 / VCU</p>
        </Card>
        <Card className="p-6 border-border/50 bg-surface">
          <h4 className="text-sm font-medium text-muted mb-2">Projeção Projeto (10 anos)</h4>
          <p className="text-3xl font-bold text-primary">12.450 <span className="text-sm font-normal text-muted">tCO₂e</span></p>
        </Card>
      </div>

      <Card className="border-border/50 shadow-sm mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Projeção e Emissão ao Longo do Tempo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockTimelineData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="ano" axisLine={false} tickLine={false} tickMargin={10} fontSize={12} fill="var(--color-muted)" />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} fontSize={12} tickMargin={10} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} fontSize={12} tickMargin={10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line yAxisId="left" type="monotone" dataKey="vcus" name="VCUs Anuais" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                <Line yAxisId="right" type="monotone" dataKey="acumulado" name="Acumulado" stroke="var(--color-success)" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
