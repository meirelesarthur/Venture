import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { useDataStore } from '@/store/data'
import { ArrowLeft, Plus, CheckCircle2, XCircle, Leaf, Pencil, Save, Map, CloudRain } from 'lucide-react'
import { toast } from 'sonner'
import FazendaMap from '@/components/maps/FazendaMap'

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const TEXTURAS = ['arenosa','franco-arenosa','franca','franco-argilosa','argilo-arenosa','argilosa','muito-argilosa']
const TOPOGRAFIAS = ['plano','suave_ondulado','ondulado','forte_ondulado','montanhoso']

// Presets de clima por bioma
const PRESETS: Record<string, { tempMensal: number[]; precipMensal: number[]; evapMensal: number[] }> = {
  preset_cerrado: {
    tempMensal:   [27.2, 27.0, 26.8, 26.5, 25.2, 24.1, 23.8, 25.0, 27.0, 27.5, 27.3, 27.1],
    precipMensal: [230,  210,  200,  100,   30,   10,    5,   20,   80,  160,  210,  240],
    evapMensal:   [100,   90,   95,  105,   95,   85,   90,  100,  110,  115,  105,  100],
  },
  preset_amazonia: {
    tempMensal:   [26.5, 26.4, 26.2, 26.5, 27.0, 26.8, 26.5, 27.1, 27.5, 27.8, 27.6, 27.0],
    precipMensal: [280,  280,  320,  300,  250,  100,   70,   60,   90,  150,  200,  280],
    evapMensal:   [ 90,   80,   85,   90,   95,   90,   95,  100,  110,  115,  100,   95],
  },
  preset_pampa: {
    tempMensal:   [24.0, 23.5, 21.0, 17.0, 13.0, 10.0,  9.5, 11.5, 14.5, 18.0, 21.0, 23.0],
    precipMensal: [130,  110,  120,  100,   90,   90,  110,  100,  120,  110,  120,  130],
    evapMensal:   [140,  120,   95,   70,   45,   30,   30,   40,   60,   90,  115,  135],
  },
}

export default function AdminFazendaDetalhe() {
  const { fazendaId } = useParams()
  const { fazendas, talhoes, clientes, addTalhao, updateTalhao } = useDataStore()

  const fazenda = fazendas.find(f => f.id === fazendaId) ?? fazendas[0]
  const meusTalhoes = talhoes.filter(t => t.fazendaId === fazenda?.id)
  const cliente = clientes.find(c => c.id === fazenda?.produtorId)

  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  // Novo talão form
  const [nt, setNt] = useState({
    nome:'', areaHa:0, tipo:'projeto' as 'projeto'|'control_site'|'excluido',
    socPercent:0, bdGCm3:0, argilaPercent:0, profundidadeCm:30,
    grupoSoloFao:'', texturaFao:'', topografia:'plano'
  })

  const handleAdd = () => {
    if (!nt.nome || !nt.areaHa) { toast.error('Preencha nome e área.'); return }
    addTalhao({ ...nt, fazendaId: fazenda.id, dadosValidados: false })
    toast.success('Talhão adicionado!')
    setShowAdd(false)
    setNt({ nome:'', areaHa:0, tipo:'projeto', socPercent:0, bdGCm3:0, argilaPercent:0, profundidadeCm:30, grupoSoloFao:'', texturaFao:'', topografia:'plano' })
  }

  // Edit solo
  const [editSolo, setEditSolo] = useState<{[k:string]: any}>({})
  const startEdit = (t: typeof meusTalhoes[0]) => {
    setEditId(t.id)
    setEditSolo({
      socPercent: t.socPercent ?? '', bdGCm3: t.bdGCm3 ?? '',
      argilaPercent: t.argilaPercent ?? '', profundidadeCm: t.profundidadeCm,
      grupoSoloFao: t.grupoSoloFao ?? '', texturaFao: t.texturaFao ?? '', topografia: t.topografia ?? 'plano'
    })
  }
  const saveEdit = (id: string) => {
    updateTalhao(id, { ...editSolo, dadosValidados: true })
    toast.success('Dados de solo salvos!')
    setEditId(null)
  }

  // Dados climáticos
  const { dadosClimaticos, saveDadoClimatico } = useDataStore()
  const [climaTalhaoId, setClimaTalhaoId] = useState(meusTalhoes.find(t => t.tipo === 'projeto')?.id ?? '')
  const climaExistente = dadosClimaticos.find(d => d.talhaoId === climaTalhaoId)
  const [climaEdit, setClimaEdit] = useState<{ tempMensal: number[]; precipMensal: number[]; evapMensal: number[] }>(
    climaExistente ?? { tempMensal: Array(12).fill(25), precipMensal: Array(12).fill(100), evapMensal: Array(12).fill(90) }
  )

  const aplicarPreset = (presetKey: string) => {
    const p = PRESETS[presetKey]
    if (p) setClimaEdit({ ...p })
  }

  const salvarClima = () => {
    if (!climaTalhaoId) { toast.error('Selecione um talhão.'); return }
    saveDadoClimatico({ talhaoId: climaTalhaoId, ...climaEdit, fonte: 'manual' })
    toast.success('Dados climáticos salvos!')
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link to="/admin/fazendas"><ArrowLeft size={20} /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{fazenda?.nome}</h1>
          <p className="text-sm text-muted">{fazenda?.municipio}/{fazenda?.estado} — {fazenda?.areaTotalHa?.toLocaleString('pt-BR')} ha | Produtor: {cliente?.nome}</p>
        </div>
        <Button className="gap-2 rounded-xl" onClick={() => setShowAdd(!showAdd)}>
          <Plus size={16} /> Novo Talhão
        </Button>
      </div>

      {/* Form novo talhão */}
      {showAdd && (
        <Card className="border-success/20 bg-success/5">
          <CardHeader className="pb-3"><CardTitle className="text-base">Adicionar Talhão</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Nome *</Label>
                <Input value={nt.nome} onChange={e => setNt(p => ({...p, nome:e.target.value}))} placeholder="Talhão A3" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Área (ha) *</Label>
                <Input type="number" value={nt.areaHa || ''} onChange={e => setNt(p => ({...p, areaHa:Number(e.target.value)}))} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Função</Label>
                <Select value={nt.tipo} onValueChange={v => setNt(p => ({...p, tipo:v as any}))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="projeto">Projeto</SelectItem>
                    <SelectItem value="control_site">Control Site</SelectItem>
                    <SelectItem value="excluido">Excluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>SOC (%) </Label>
                <Input type="number" step="0.1" value={nt.socPercent || ''} onChange={e => setNt(p => ({...p, socPercent:Number(e.target.value)}))} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>BD (g/cm³)</Label>
                <Input type="number" step="0.01" value={nt.bdGCm3 || ''} onChange={e => setNt(p => ({...p, bdGCm3:Number(e.target.value)}))} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Argila (%)</Label>
                <Input type="number" value={nt.argilaPercent || ''} onChange={e => setNt(p => ({...p, argilaPercent:Number(e.target.value)}))} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Textura FAO</Label>
                <Select value={nt.texturaFao} onValueChange={v => setNt(p => ({...p, texturaFao:v}))}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                  <SelectContent>
                    {TEXTURAS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Topografia</Label>
                <Select value={nt.topografia} onValueChange={v => setNt(p => ({...p, topografia:v}))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TOPOGRAFIAS.map(t => <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Grupo Solo FAO</Label>
                <Input value={nt.grupoSoloFao} onChange={e => setNt(p => ({...p, grupoSoloFao:e.target.value}))} placeholder="Ex: Latossolo" className="rounded-xl" />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" className="rounded-xl" onClick={() => setShowAdd(false)}>Cancelar</Button>
              <Button className="rounded-xl" onClick={handleAdd}>Adicionar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de talhões */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="border-b bg-surface/50 pb-4">
          <CardTitle className="text-lg flex items-center gap-2"><Leaf size={18} /> Talhões ({meusTalhoes.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-accent/5">
                <tr>
                  <th className="text-left p-3 font-medium text-muted-foreground">Nome</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Área</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Tipo</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">SOC %</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">BD (g/cm³)</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Argila %</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Prof. (cm)</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Solo OK</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {meusTalhoes.map(t => (
                  <tr key={t.id} className="hover:bg-accent/5 transition-colors">
                    <td className="p-3 font-medium text-foreground">{t.nome}</td>
                    <td className="p-3 text-muted">{t.areaHa} ha</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`text-xs shadow-none ${t.tipo === 'projeto' ? 'bg-success/10 text-success border-success/20' : t.tipo === 'control_site' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted/20 text-muted-foreground'}`}>
                        {t.tipo === 'projeto' ? 'Projeto' : t.tipo === 'control_site' ? 'Controle' : 'Excluído'}
                      </Badge>
                    </td>
                    {editId === t.id ? (
                      <>
                        <td className="p-1.5"><Input type="number" step="0.1" value={editSolo.socPercent} onChange={e => setEditSolo(p=>({...p,socPercent:e.target.value}))} className="h-8 w-20 rounded-lg text-sm" /></td>
                        <td className="p-1.5"><Input type="number" step="0.01" value={editSolo.bdGCm3} onChange={e => setEditSolo(p=>({...p,bdGCm3:e.target.value}))} className="h-8 w-20 rounded-lg text-sm" /></td>
                        <td className="p-1.5"><Input type="number" value={editSolo.argilaPercent} onChange={e => setEditSolo(p=>({...p,argilaPercent:e.target.value}))} className="h-8 w-20 rounded-lg text-sm" /></td>
                        <td className="p-1.5"><Input type="number" value={editSolo.profundidadeCm} onChange={e => setEditSolo(p=>({...p,profundidadeCm:e.target.value}))} className="h-8 w-20 rounded-lg text-sm" /></td>
                      </>
                    ) : (
                      <>
                        <td className="p-3 text-muted">{t.socPercent ?? '—'}</td>
                        <td className="p-3 text-muted">{t.bdGCm3 ?? '—'}</td>
                        <td className="p-3 text-muted">{t.argilaPercent ?? '—'}</td>
                        <td className="p-3 text-muted">{t.profundidadeCm}</td>
                      </>
                    )}
                    <td className="p-3 text-center">
                      {t.dadosValidados ? <CheckCircle2 size={16} className="text-success mx-auto" /> : <XCircle size={16} className="text-muted mx-auto" />}
                    </td>
                    <td className="p-3 text-right">
                      {editId === t.id ? (
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="ghost" className="h-7 text-xs rounded-lg" onClick={() => setEditId(null)}>✕</Button>
                          <Button size="sm" className="h-7 text-xs rounded-lg gap-1" onClick={() => saveEdit(t.id)}><Save size={11} /> Salvar</Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" className="h-7 text-xs rounded-lg gap-1" onClick={() => startEdit(t)}>
                          <Pencil size={12} /> Editar Solo
                        </Button>
                       )}\n                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meusTalhoes.length === 0 && (
            <div className="text-center py-12 text-muted">Nenhum talhão cadastrado. Clique em "Novo Talhão" para começar.</div>
          )}
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Área Projeto', val: `${meusTalhoes.filter(t=>t.tipo==='projeto').reduce((a,t)=>a+t.areaHa,0).toLocaleString('pt-BR')} ha`, color: 'text-success' },
          { label: 'Área Controle', val: `${meusTalhoes.filter(t=>t.tipo==='control_site').reduce((a,t)=>a+t.areaHa,0).toLocaleString('pt-BR')} ha`, color: 'text-primary' },
          { label: 'Solo Validado', val: `${meusTalhoes.filter(t=>t.dadosValidados).length} / ${meusTalhoes.length}`, color: 'text-warning' },
        ].map(s => (
          <Card key={s.label} className="border-border/50 shadow-sm bg-surface p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
            <p className="text-xs text-muted mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Mapa */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-surface/50 pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Map size={16} className="text-primary" /> Visualização — Talhões
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <FazendaMap talhoes={meusTalhoes} height="380px" />
        </CardContent>
      </Card>

      {/* Dados Climáticos */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="border-b bg-surface/50 pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <CloudRain size={16} className="text-primary" /> Dados Climáticos por Talhão
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex-1">
              <Label className="text-xs mb-1.5 block">Talhão</Label>
              <Select value={climaTalhaoId} onValueChange={v => { setClimaTalhaoId(v); const c = dadosClimaticos.find(d => d.talhaoId === v); if (c) setClimaEdit({ tempMensal: c.tempMensal, precipMensal: c.precipMensal, evapMensal: c.evapMensal }) }}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {meusTalhoes.filter(t => t.tipo === 'projeto').map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Aplicar Preset Climático</Label>
              <div className="flex gap-2">
                {['preset_cerrado','preset_amazonia','preset_pampa'].map(k => (
                  <Button key={k} variant="outline" size="sm" className="rounded-xl text-xs h-8" onClick={() => aplicarPreset(k)}>
                    {k.replace('preset_','').charAt(0).toUpperCase() + k.replace('preset_','').slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Tabela 3×12 */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-accent/5">
                  <th className="text-left p-2 font-medium">Variável</th>
                  {MESES.map(m => <th key={m} className="p-2 font-medium text-center">{m}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {[
                  { label: 'Temp (°C)', key: 'tempMensal', step: '0.1' },
                  { label: 'Precip (mm)', key: 'precipMensal', step: '1' },
                  { label: 'Evap (mm)', key: 'evapMensal', step: '1' },
                ].map(row => (
                  <tr key={row.key}>
                    <td className="p-2 font-medium text-muted whitespace-nowrap">{row.label}</td>
                    {climaEdit[row.key as keyof typeof climaEdit].map((val: number, i: number) => (
                      <td key={i} className="p-1">
                        <Input
                          type="number"
                          step={row.step}
                          value={val}
                          onChange={e => {
                            const arr = [...climaEdit[row.key as keyof typeof climaEdit]]
                            arr[i] = parseFloat(e.target.value) || 0
                            setClimaEdit(prev => ({ ...prev, [row.key]: arr }))
                          }}
                          className="h-7 w-16 rounded-lg text-xs text-center p-0 px-1"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <Button className="rounded-xl gap-2" onClick={salvarClima}>
              <Save size={14} /> Salvar Dados Climáticos
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
