import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { MapPin, Plus, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useDataStore } from '@/store/data'

interface SiteFormData {
  nome: string; area: string; biome: string; distanciaKm: string
  topografia: string; texturaFao: string; fazendasVinculadasIds: string[]
}

const BIOMAS = ['Cerrado','Amazônia','Mata Atlântica','Pampa','Pantanal','Caatinga']
const TOPOGRAFIAS = ['plano','suave_ondulado','ondulado','forte_ondulado','montanhoso']
const TEXTURAS = ['arenosa','franco-arenosa','franca','franco-argilosa','argilo-arenosa','argilosa','muito-argilosa']

export default function AdminControlSites() {
  const { controlSites, fazendas, addControlSite } = useDataStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<SiteFormData>({
    nome: '', area: '', biome: 'Cerrado', distanciaKm: '', topografia: 'plano', texturaFao: 'argilosa', fazendasVinculadasIds: [],
  })

  const totalValidos  = controlSites.filter(s => s.status === 'Valido').length
  const totalAlerta   = controlSites.filter(s => s.status === 'Alerta').length

  // Conformidade por fazenda — 3 níveis VM0042 §8.2
  const conformidade = fazendas.map(f => {
    const sitesVinculados = controlSites.filter(s => (s.fazendasVinculadasIds ?? []).includes(f.id))
    const validos = sitesVinculados.filter(s => s.status === 'Valido').length
    const status = validos >= 10 ? 'ouro' : validos >= 3 ? 'ok' : validos >= 1 ? 'parcial' : 'nenhum'
    return { fazenda: f, sitesVinculados, validos, status }
  }).filter(c => c.sitesVinculados.length > 0 || fazendas.length <= 3)

  const handleSubmit = () => {
    const areaNum = parseFloat(form.area)
    const distNum = parseFloat(form.distanciaKm)
    if (!form.nome || isNaN(areaNum)) {
      toast.error('Preencha ao menos Nome e Área.')
      return
    }
    // Similaridade automática básica (critérios preenchidos)
    let sim = 0
    if (form.biome) sim += 2
    if (form.topografia) sim += 2
    if (form.texturaFao) sim += 2
    if (!isNaN(distNum) && distNum <= 30) sim += 3
    else if (!isNaN(distNum) && distNum <= 60) sim += 1
    if (areaNum >= 50) sim += 2
    const status = sim >= 8 ? 'Valido' : 'Alerta'

    addControlSite({
      nome: form.nome, area: areaNum, biome: form.biome,
      distanciaKm: isNaN(distNum) ? undefined : distNum,
      topografia: form.topografia || undefined, texturaFao: form.texturaFao || undefined,
      fazendasVinculadasIds: form.fazendasVinculadasIds.length > 0 ? form.fazendasVinculadasIds : undefined,
      status, similaridade: sim, data: new Date().toLocaleDateString('pt-BR'),
    })
    toast.success(`Site "${form.nome}" cadastrado. Similaridade: ${sim}/11 → ${status}`)
    setModalOpen(false)
    setForm({ nome:'', area:'', biome:'Cerrado', distanciaKm:'', topografia:'plano', texturaFao:'argilosa', fazendasVinculadasIds:[] })
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Control Sites</h1>
          <p className="text-muted">Áreas mantendo baseline convencional. Mínimo de 3 por projeto (VM0042 §6.4).</p>
        </div>
        <Button className="gap-2" onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Adicionar Site
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-5 border-border/50 bg-surface shadow-sm">
          <p className="text-xs font-medium text-muted mb-1">Total Cadastrados</p>
          <p className="text-3xl font-bold text-foreground">{controlSites.length}</p>
        </Card>
        <Card className="p-5 border-border/50 bg-surface shadow-sm">
          <p className="text-xs font-medium text-muted mb-1">Válidos (Sim. ≥ 8/11)</p>
          <p className="text-3xl font-bold text-success">{totalValidos}</p>
        </Card>
        <Card className="p-5 border-border/50 bg-surface shadow-sm">
          <p className="text-xs font-medium text-muted mb-1">Em Alerta</p>
          <p className="text-3xl font-bold text-warning">{totalAlerta}</p>
        </Card>
      </div>

      {/* Conformidade por fazenda */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="border-b bg-surface/50 pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle size={16} className="text-primary" /> Conformidade Metodológica por Projeto
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          {conformidade.map(({ fazenda, sitesVinculados, validos, status }) => (
            <div key={fazenda.id} className={`flex items-center justify-between p-4 rounded-xl border ${status === 'ouro' ? 'border-primary/20 bg-primary/5' : status === 'ok' ? 'border-success/20 bg-success/5' : status === 'parcial' ? 'border-warning/20 bg-warning/5' : 'border-danger/20 bg-danger/5'}`}>
              <div>
                <p className="font-medium text-sm text-foreground">{fazenda.nome}</p>
                <p className="text-xs text-muted mt-0.5">{sitesVinculados.length} site(s) vinculado(s) · {validos} válidos</p>
              </div>
              <div className="flex items-center gap-2">
                {status === 'ouro' && <Badge className="bg-primary/10 text-primary border-primary/20 shadow-none"><CheckCircle2 size={12} className="mr-1" /> Excelente ≥10</Badge>}
                {status === 'ok' && <Badge className="bg-success/10 text-success border-success/20 shadow-none"><CheckCircle2 size={12} className="mr-1" /> Atende ≥3 (recom. 10)</Badge>}
                {status === 'parcial' && <Badge className="bg-warning/10 text-warning border-warning/20 shadow-none"><AlertCircle size={12} className="mr-1" /> Incompleto ({validos}/3 mín.)</Badge>}
                {status === 'nenhum' && <Badge className="bg-danger/10 text-danger border-danger/20 shadow-none"><XCircle size={12} className="mr-1" /> Sem sites — bloqueado</Badge>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Tabela de sites */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="border-b bg-surface/50">
          <CardTitle className="text-base flex items-center gap-2"><MapPin size={18} className="text-primary" /> Lista de Control Sites</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-accent/10">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Bioma</TableHead>
                <TableHead>Dist. (km)</TableHead>
                <TableHead>Similaridade</TableHead>
                <TableHead>Fazenda</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {controlSites.map(c => {
                const linkedFarms = fazendas.filter(f => (c.fazendasVinculadasIds ?? []).includes(f.id))
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell>{c.area} ha</TableCell>
                    <TableCell>{c.biome}</TableCell>
                    <TableCell>{c.distanciaKm ?? '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono">{c.similaridade}/11</span>
                        <div className="w-16 bg-secondary h-1.5 rounded-full overflow-hidden">
                          <div className={`h-1.5 rounded-full ${c.similaridade >= 8 ? 'bg-success' : 'bg-warning'}`} style={{ width: `${(c.similaridade/11)*100}%` }} />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {linkedFarms.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {linkedFarms.map(f => (
                            <span key={f.id} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-medium">{f.nome}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted">Avulso</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {c.status === 'Valido'
                        ? <Badge className="bg-success/10 text-success border-success/20 shadow-none text-xs"><CheckCircle2 className="w-3 h-3 mr-1" /> Válido</Badge>
                        : <Badge className="bg-warning/10 text-warning border-warning/20 shadow-none text-xs"><AlertCircle className="w-3 h-3 mr-1" /> Alerta</Badge>}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de novo site */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Adicionar Control Site</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-1">
              <Label>Nome *</Label>
              <Input placeholder="Ex: Site Controle Norte MT-04" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label>Área (ha) *</Label>
              <Input type="number" placeholder="50" value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label>Distância do projeto (km)</Label>
              <Input type="number" placeholder="15" value={form.distanciaKm} onChange={e => setForm(f => ({ ...f, distanciaKm: e.target.value }))} className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label>Bioma</Label>
              <Select value={form.biome} onValueChange={v => setForm(f => ({ ...f, biome: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{BIOMAS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Topografia</Label>
              <Select value={form.topografia} onValueChange={v => setForm(f => ({ ...f, topografia: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{TOPOGRAFIAS.map(t => <SelectItem key={t} value={t}>{t.replace('_',' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Textura FAO</Label>
              <Select value={form.texturaFao} onValueChange={v => setForm(f => ({ ...f, texturaFao: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{TEXTURAS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Vincular a Fazendas (opcional)</Label>
              <p className="text-xs text-muted mb-2">Selecione uma ou mais fazendas. Deixe vazio para cadastro avulso.</p>
              <div className="flex flex-wrap gap-2">
                {fazendas.map(f => {
                  const selected = form.fazendasVinculadasIds.includes(f.id)
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setForm(prev => ({
                        ...prev,
                        fazendasVinculadasIds: selected
                          ? prev.fazendasVinculadasIds.filter(id => id !== f.id)
                          : [...prev.fazendasVinculadasIds, f.id]
                      }))}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                        selected
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border/50 text-muted-foreground hover:bg-accent/5'
                      }`}
                    >
                      {f.nome}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <p className="text-xs text-muted">A similaridade será calculada automaticamente com base nos critérios preenchidos.</p>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button className="rounded-xl" onClick={handleSubmit}>Salvar Site</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
