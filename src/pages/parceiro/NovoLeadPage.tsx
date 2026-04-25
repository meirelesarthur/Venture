import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Send, MapPin, Leaf, Eye, EyeOff, CheckCircle2, ChevronRight } from 'lucide-react'
import { useDataStore } from '@/store/data'
import { useAuthStore } from '@/store/auth'
import { toast } from 'sonner'

const ESTADOS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO']
const CULTURAS = ['Soja','Milho','Algodão','Cana-de-açúcar','Café','Pastagem','Trigo','Arroz','Outro']

const PRATICAS = [
  { id: 'plantio_direto', label: 'Plantio Direto (SPD)' },
  { id: 'cobertura', label: 'Plantas de Cobertura' },
  { id: 'rotacao', label: 'Rotação de Culturas' },
  { id: 'ilpf', label: 'ILPF / ILP' },
  { id: 'pastagem', label: 'Reforma de Pastagem' },
  { id: 'organico', label: 'Adubação Orgânica' },
  { id: 'biologicos', label: 'Biológicos / Inoculantes' },
  { id: 'rotac_pasto', label: 'Manejo Rotacionado de Pasto' },
]

interface PraticaSelecionada {
  id: string
  anos: number
}

export default function NovoLeadPage() {
  const navigate = useNavigate()
  const addLead  = useDataStore(s => s.addLead)
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [showComissao, setShowComissao] = useState(false)
  const [submitted, setSubmitted] = useState<{ nome: string; fazenda: string; area: number } | null>(null)

  const [nome, setNome]           = useState('')
  const [email, setEmail]         = useState('')
  const [telefone, setTelefone]   = useState('')
  const [fazenda, setFazenda]     = useState('')
  const [municipio, setMunicipio] = useState('')
  const [estado, setEstado]       = useState('')
  const [area, setArea]           = useState('')
  const [culturas, setCulturas]   = useState<string[]>([])
  const [praticas, setPraticas]   = useState<PraticaSelecionada[]>([])
  const [obs, setObs]             = useState('')

  const toggleCultura = (c: string) =>
    setCulturas(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])

  const togglePratica = (id: string) => {
    setPraticas(prev => {
      const exists = prev.find(p => p.id === id)
      if (exists) return prev.filter(p => p.id !== id)
      return [...prev, { id, anos: 1 }]
    })
  }

  const updatePraticaAnos = (id: string, anos: number) => {
    setPraticas(prev => prev.map(p => p.id === id ? { ...p, anos } : p))
  }

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
        praticas: praticas.map(p => p.id),
        parceiroId: user?.id ?? 'p1',
        status: 'em_analise',
      })
      setSubmitted({ nome, fazenda, area: areaNum })
      setLoading(false)
    }, 800)
  }

  if (submitted) {
    return (
      <div className="w-full max-w-lg mx-auto py-16 flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
          <CheckCircle2 size={40} className="text-success" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Indicação enviada!</h2>
          <p className="text-muted text-sm">
            <strong className="text-foreground">{submitted.nome}</strong> ({submitted.fazenda} · {submitted.area.toLocaleString('pt-BR')} ha) foi registrado e está em análise.
          </p>
        </div>
        <div className="w-full bg-surface border border-border/50 rounded-2xl p-5 text-left space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Próximos passos</p>
          {[
            'Nosso time analisa a elegibilidade em até 48h',
            'Você é notificado quando o lead for aprovado',
            'Comissão liberada após assinatura do contrato',
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</div>
              <p className="text-sm text-muted-foreground">{step}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-3 w-full">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={() => navigate('/parceiro/leads')}>
            Ver meus leads
          </Button>
          <Button className="flex-1 rounded-xl gap-2" onClick={() => { setSubmitted(null); setNome(''); setEmail(''); setTelefone(''); setFazenda(''); setMunicipio(''); setEstado(''); setArea(''); setCulturas([]); setPraticas([]); setObs('') }}>
            <Send size={14} /> Nova indicação
          </Button>
        </div>
      </div>
    )
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

        {/* Práticas Adotadas — Nova seção */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="bg-surface/50 border-b pb-4">
            <CardTitle className="text-base flex items-center gap-2"><Leaf size={16} className="text-success" /> Práticas Adotadas</CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-3">
            <p className="text-xs text-muted mb-2">Selecione as práticas regenerativas que o produtor já adota. Informe há quantos anos.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {PRATICAS.map(p => {
                const selected = praticas.find(x => x.id === p.id)
                return (
                  <div key={p.id} className={`rounded-xl border transition-all ${selected ? 'border-success/40 bg-success/5' : 'border-border/50 hover:border-border'}`}>
                    <button
                      type="button"
                      onClick={() => togglePratica(p.id)}
                      className="flex items-center gap-3 w-full px-4 py-3 text-left"
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selected ? 'bg-success border-success text-white' : 'border-border'}`}>
                        {selected && <span className="text-xs">✓</span>}
                      </div>
                      <span className={`text-sm ${selected ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{p.label}</span>
                    </button>
                    {/* Campo de anos — aparece quando selecionado */}
                    {selected && (
                      <div className="px-4 pb-3 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <Label className="text-xs text-muted whitespace-nowrap">Há quantos anos?</Label>
                        <Input
                          type="number"
                          min={1}
                          max={30}
                          value={selected.anos}
                          onChange={e => updatePraticaAnos(p.id, parseInt(e.target.value) || 1)}
                          className="w-20 h-8 rounded-lg text-sm text-center"
                        />
                        <span className="text-xs text-muted">ano(s)</span>
                      </div>
                    )}
                  </div>
                )
              })}
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

        {/* Prévia de comissão — mascarada por padrão */}
        {comissaoAno0 && (
          <div className="p-4 bg-success/5 border border-success/20 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-success">Sua comissão estimada (Ano 0)</p>
              <p className="text-xs text-success/70 mt-0.5">US$ 1,00/ha × {areaNum.toLocaleString('pt-BR')} ha × PTAX R$ 5,65</p>
            </div>
            <div className="flex items-center gap-3">
              <p className={`text-2xl font-bold text-success transition-all ${!showComissao ? 'value-masked' : ''}`}>
                {showComissao ? comissaoAno0 : 'R$ ••••••'}
              </p>
              <button
                type="button"
                onClick={() => setShowComissao(!showComissao)}
                className="text-success/60 hover:text-success transition-colors"
              >
                {showComissao ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
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
