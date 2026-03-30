import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDataStore } from '@/store/data'
import { Plus, Map, ChevronRight, Leaf, MapPin } from 'lucide-react'
import { toast } from 'sonner'

const ESTADOS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO']

export default function AdminFazendas() {
  const { fazendas, clientes, talhoes, addFazenda } = useDataStore()
  const [showForm, setShowForm] = useState(false)
  const [nome, setNome] = useState('')
  const [municipio, setMunicipio] = useState('')
  const [estado, setEstado] = useState('')
  const [area, setArea] = useState('')
  const [produtorId, setProdutorId] = useState('')
  const [zona, setZona] = useState<'tropical_umido' | 'tropical_seco'>('tropical_umido')

  const handleAdd = () => {
    if (!nome || !municipio || !estado || !area || !produtorId) { toast.error('Preencha todos os campos obrigatórios.'); return }
    addFazenda({ nome, municipio, estado, areaTotalHa: parseFloat(area), produtorId, zonaClimatica: zona })
    toast.success('Fazenda cadastrada com sucesso!')
    setShowForm(false)
    setNome(''); setMunicipio(''); setEstado(''); setArea(''); setProdutorId('')
  }

  const getCliente = (id: string) => clientes.find(c => c.id === id)
  const getTalhoesCount = (fid: string) => talhoes.filter(t => t.fazendaId === fid)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Fazendas</h1>
          <p className="text-muted">Propriedades cadastradas e seus talhões.</p>
        </div>
        <Button className="gap-2 rounded-xl" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Nova Fazenda
        </Button>
      </div>

      {/* Formulário novo */}
      {showForm && (
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Cadastrar Nova Fazenda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Produtor *</Label>
                <Select value={produtorId} onValueChange={setProdutorId}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Nome da Fazenda *</Label>
                <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Fazenda Boa Vista" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
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
              <div className="space-y-1.5">
                <Label>Área Total (ha) *</Label>
                <Input type="number" value={area} onChange={e => setArea(e.target.value)} placeholder="1200" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Zona Climática</Label>
                <Select value={zona} onValueChange={v => setZona(v as any)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tropical_umido">Tropical Úmido</SelectItem>
                    <SelectItem value="tropical_seco">Tropical Seco</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" className="rounded-xl" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button className="rounded-xl" onClick={handleAdd}>Salvar Fazenda</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {fazendas.map(f => {
          const cliente = getCliente(f.produtorId)
          const meusTalhoes = getTalhoesCount(f.id)
          const projetoCount = meusTalhoes.filter(t => t.tipo === 'projeto').length
          const controlCount = meusTalhoes.filter(t => t.tipo === 'control_site').length

          return (
            <Card key={f.id} className="border-border/50 shadow-sm hover:border-primary/30 transition-colors bg-surface">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{f.nome}</CardTitle>
                    <div className="flex items-center gap-1.5 text-xs text-muted mt-1">
                      <MapPin size={11} />
                      <span>{f.municipio}/{f.estado}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-xs flex-shrink-0 ${f.zonaClimatica === 'tropical_umido' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-warning/10 text-warning border-warning/20'}`}>
                    {f.zonaClimatica === 'tropical_umido' ? 'Úmido' : 'Seco'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="p-2 bg-background rounded-xl">
                    <p className="text-lg font-bold text-foreground">{f.areaTotalHa.toLocaleString('pt-BR')}</p>
                    <p className="text-xs text-muted">ha total</p>
                  </div>
                  <div className="p-2 bg-success/5 rounded-xl">
                    <p className="text-lg font-bold text-success">{projetoCount}</p>
                    <p className="text-xs text-success/70">projeto</p>
                  </div>
                  <div className="p-2 bg-primary/5 rounded-xl">
                    <p className="text-lg font-bold text-primary">{controlCount}</p>
                    <p className="text-xs text-primary/70">controle</p>
                  </div>
                </div>
                {cliente && (
                  <div className="flex items-center gap-2 p-2 bg-background rounded-xl text-xs">
                    <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold flex-shrink-0">
                      {cliente.nome.charAt(0)}
                    </div>
                    <span className="text-muted-foreground truncate">{cliente.nome}</span>
                  </div>
                )}
                <Button variant="outline" size="sm" asChild className="w-full rounded-xl gap-2">
                  <Link to={`/admin/fazendas/${f.id}`}><Leaf size={13} /> Gerenciar Talhões <ChevronRight size={13} /></Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
