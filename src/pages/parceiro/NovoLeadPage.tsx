import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, UploadCloud } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export default function NovoLeadPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success('Lead cadastrado com sucesso!')
      navigate('/parceiro/leads')
    }, 1000)
  }

  return (
    <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link to="/parceiro"><ArrowLeft size={20} /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Indicar Produtor</h1>
          <p className="text-muted">Cadastre um novo lead para ingressar no programa de carbono.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-4 border-b bg-surface/50">
            <CardTitle className="text-lg">Dados Principais</CardTitle>
            <CardDescription>Informações obrigatórias para análise preliminar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nomeProdutor">Nome do Produtor</Label>
                <Input id="nomeProdutor" required placeholder="João da Silva" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input id="telefone" required placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nomeFazenda">Nome da Fazenda</Label>
                <Input id="nomeFazenda" required placeholder="Fazenda Boa Vista" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="municipio">Município / Estado</Label>
                <Input id="municipio" required placeholder="Rio Verde - GO" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="area">Área Total Aproximada (ha)</Label>
                <Input id="area" type="number" required placeholder="Ex: 1000" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="detalhes">Cultura Principal e Observações</Label>
              <Textarea id="detalhes" placeholder="Ex: Planta soja no verão e tem interesse em ILPF..." />
            </div>

            <div className="border border-dashed p-6 rounded-lg bg-secondary/20 flex flex-col items-center justify-center text-center space-y-2">
              <UploadCloud className="text-muted" size={32} />
              <div>
                <Label className="text-primary font-medium cursor-pointer hover:underline">
                  Clique para anexar arquivo KML
                  <input type="file" className="hidden" accept=".kml" />
                </Label>
                <p className="text-xs text-muted">Isso acelera a análise de elegibilidade (Opcional).</p>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="outline" asChild>
                <Link to="/parceiro">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading ? 'Salvando...' : <><Save size={16} /> Cadastrar Lead</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
