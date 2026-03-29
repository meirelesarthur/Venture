import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminParametros() {
  const handleSave = () => {
    toast.success('Parâmetros globais atualizados com sucesso.')
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Parâmetros Globais</h1>
        <p className="text-muted">Configurações globais financeiras e fatores de emissão (Metodologia VM0042).</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="bg-surface/50 border-b pb-4">
            <CardTitle className="text-lg">Parâmetros Financeiros</CardTitle>
            <CardDescription>Impactam diretamente na projeção do simulador e comissões.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="vcu_price">Preço Base do VCU (US$)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input id="vcu_price" type="number" defaultValue="20.00" className="pl-8" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ptax">PTAX Fixa/Fallback (R$)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <Input id="ptax" type="number" defaultValue="5.50" className="pl-8" />
              </div>
              <p className="text-xs text-muted flex items-center gap-1 mt-1">
                <AlertCircle size={12} /> Usada caso a API do BCB falhe.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="buffer_pool">Buffer Pool (%)</Label>
              <div className="relative">
                <Input id="buffer_pool" type="number" defaultValue="15" className="pr-8" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
            </div>
            <Button onClick={handleSave} className="w-full gap-2 mt-2"><Save size={16} /> Salvar Financeiro</Button>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="bg-surface/50 border-b pb-4">
            <CardTitle className="text-lg">Fatores de Emissão (EFs)</CardTitle>
            <CardDescription>Valores default do RothC e IPCC.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="iom">IOM (Inert Organic Matter) %</Label>
              <Input id="iom" type="number" defaultValue="0.049" step="0.001" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="n2o_ef">EF N₂O Sintético Direto</Label>
              <Input id="n2o_ef" type="number" defaultValue="0.01" step="0.001" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="n2o_volatil">Fraç. N Volatilizado</Label>
              <Input id="n2o_volatil" type="number" defaultValue="0.10" step="0.01" />
            </div>
            <Button variant="secondary" onClick={handleSave} className="w-full gap-2 mt-2"><Save size={16} /> Salvar Fatores</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
