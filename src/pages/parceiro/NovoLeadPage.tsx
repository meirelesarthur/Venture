import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Send, MapPin } from 'lucide-react'
import { useDataStore } from '@/store/data'
import { useAuthStore } from '@/store/auth'
import { toast } from 'sonner'

const ESTADOS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO']
const CULTURAS = ['Soja','Milho','Algodão','Cana-de-açúcar','Café','Pastagem','Trigo','Arroz','Outro']

export default function NovoLeadPage() {
  const navigate = useNavigate()
  const addLead  = useDataStore(s => s.addLead)
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)

  const [nome, setNome]           = useState('')
  const [email, setEmail]         = useState('')
  const [telefone, setTelefone]   = useState('')
  const [fazenda, setFazenda]     = useState('')
  const [municipio, setMunicipio] = useState('')
  const [estado, setEstado]       = useState('')
  const [area, setArea]           = useState('')
  const [culturas, setCulturas]   = useState<string[]>([])
  const [obs, setObs]             = useState('')

  const toggleCultura = (c: string) =>
    setCulturas(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])

  const areaNum = parseFloat(area.replace(',','.')) || 0
  const comissaoAno0 = areaNum > 0 ? (areaNum * 1 * 5.65).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome || !fazenda || !municipio || !estado || !area) {
      toast.error('Preencha os campos obrigatórios.')
      return
    }
    if (areaNum < 100) { toast.error('Área mínima elegível: 100 ha.'); return }

    setLoading(true)
    setTimeout(() => {
      addLead({
        nome, email, telefone, fazenda, municipio, estado,
        area: areaNum, culturas,
        parceiroId: user?.id ?? 'p1',
        status: 'em_analise',
      })
      toast.success('Lead indicado com sucesso! Em breve nosso time analisará a indicação.')
      navigate('/parceiro/leads')
      setLoading(false)
    }, 800)
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/parceiro/leads')} className="rounded-full">
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Indicar Produtor</h1>
          <p className="text-muted text-sm">Preencha os dados do produtor que deseja indicar ao programa.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="bg-surface/50 border-b pb-4">
            <CardTitle className="text-base">Dados do Produtor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nome Completo / Razão Social *</Label>
                <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="João da Silva" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="joao@email.com" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(65) 99999-9999" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Nome da Fazenda *</Label>
                <Input value={fazenda} onChange={e => setFazenda(e.target.value)} placeholder="Fazenda Boa Vista" className="rounded-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="bg-surface/50 border-b pb-4">
            <CardTitle className="text-base flex items-center gap-2"><MapPin size={16} /> Localização e Área</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Município *</Label>
                <Input value={municipio} onChange={e => setMunicipio(e.target.value)} placeholder="Sorriso" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Estado *</Label>
                <Select value={estado} onValueChange={setEstado}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="UF" /></SelectTrigger>
                  <SelectContent>{ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-3 space-y-1.5">
                <Label>Área Estimada (hectares) *</Label>
                <Input type="number" min={100} value={area} onChange={e => setArea(e.target.value)} placeholder="Min. 100 ha" className="rounded-xl" />
                {areaNum > 0 && areaNum < 100 && <p className="text-xs text-danger">Área mínima elegível: 100 ha</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="bg-surface/50 border-b pb-4">
            <CardTitle className="text-base">Culturas na Propriedade</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="flex flex-wrap gap-2">
              {CULTURAS.map(c => (
                <button
                  type="button" key={c}
                  onClick={() => toggleCultura(c)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${culturas.includes(c) ? 'bg-primary text-primary-foreground border-primary' : 'border-border/50 text-muted-foreground hover:bg-accent/5'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="bg-surface/50 border-b pb-4">
            <CardTitle className="text-base">Observações</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <Textarea
              value={obs} onChange={e => setObs(e.target.value)}
              placeholder="Informações adicionais relevantes para a análise..."
              className="rounded-xl resize-none" rows={4}
            />
          </CardContent>
        </Card>

        {/* Prévia de comissão */}
        {comissaoAno0 && (
          <div className="p-4 bg-success/5 border border-success/20 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-success">Sua comissão estimada (Ano 0)</p>
              <p className="text-xs text-success/70 mt-0.5">US$ 1,00/ha × {areaNum.toLocaleString('pt-BR')} ha × PTAX R$ 5,65</p>
            </div>
            <p className="text-2xl font-bold text-success">{comissaoAno0}</p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => navigate('/parceiro/leads')}>Cancelar</Button>
          <Button type="submit" disabled={loading} className="rounded-xl gap-2 min-w-36">
            <Send size={16} />
            {loading ? 'Enviando...' : 'Enviar Indicação'}
          </Button>
        </div>
      </form>
    </div>
  )
}
