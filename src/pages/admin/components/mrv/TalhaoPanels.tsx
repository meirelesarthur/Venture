import { useState } from 'react'
import { useDataStore } from '@/store/data'
import type { ColetaSolo, Talhao } from '@/store/data'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  CheckCircle2, XCircle, CloudRain, ChevronDown, ChevronRight,
  Plus, Trash2, Info, FlaskConical, Save, Pencil,
} from 'lucide-react'
import FazendaMap from '@/components/maps/FazendaMap'
import { MESES, TEXTURAS, TOPOGRAFIAS, PRESETS } from '@/constants/climaticos'

// ── helpers ───────────────────────────────────────────────────────────────────

const parseProfundidade = (s: string): number => {
  const m = s.match(/(\d+)\s*(?:cm)?$/)
  return m ? parseInt(m[1]) : 30
}

const calcSocStock = (soc: number, bd: number, prof: string): number =>
  (soc / 100) * bd * parseProfundidade(prof) * 10

// ── DadosGeraisPanel ──────────────────────────────────────────────────────────

export function DadosGeraisPanel({ talhao, fazendaId }: { talhao: Talhao; fazendaId: string }) {
  const { updateTalhao, dadosClimaticos, saveDadoClimatico, talhoes } = useDataStore()
  const todosTalhoes = talhoes.filter(t => t.fazendaId === fazendaId)

  const [form, setForm] = useState({
    nome: talhao.nome,
    areaHa: talhao.areaHa,
    tipo: talhao.tipo,
    socPercent: String(talhao.socPercent ?? ''),
    bdGCm3: String(talhao.bdGCm3 ?? ''),
    argilaPercent: String(talhao.argilaPercent ?? ''),
    profundidadeCm: talhao.profundidadeCm,
    dadosValidados: talhao.dadosValidados,
    texturaFao: talhao.texturaFao ?? '',
    topografia: talhao.topografia ?? 'plano',
  })

  const handleSave = () => {
    updateTalhao(talhao.id, {
      nome: form.nome,
      areaHa: Number(form.areaHa),
      tipo: form.tipo,
      socPercent: form.socPercent !== '' ? Number(form.socPercent) : undefined,
      bdGCm3: form.bdGCm3 !== '' ? Number(form.bdGCm3) : undefined,
      argilaPercent: form.argilaPercent !== '' ? Number(form.argilaPercent) : undefined,
      profundidadeCm: Number(form.profundidadeCm),
      dadosValidados: form.dadosValidados,
      texturaFao: form.texturaFao || undefined,
      topografia: form.topografia || undefined,
    }, 'Dados gerais atualizados pelo admin')
    toast.success('Salvo com sucesso')
  }

  const [climaOpen, setClimaOpen] = useState(false)
  const climaExistente = dadosClimaticos.find(d => d.talhaoId === talhao.id)
  const [climaEdit, setClimaEdit] = useState(
    climaExistente
      ? { tempMensal: [...climaExistente.tempMensal], precipMensal: [...climaExistente.precipMensal], evapMensal: [...climaExistente.evapMensal] }
      : { tempMensal: Array(12).fill(25), precipMensal: Array(12).fill(100), evapMensal: Array(12).fill(90) }
  )

  const salvarClima = () => {
    saveDadoClimatico({ talhaoId: talhao.id, ...climaEdit, fonte: 'manual' })
    toast.success('Dados climáticos salvos!')
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="dg-nome">Nome</Label>
          <Input id="dg-nome" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dg-area">Área (ha)</Label>
          <Input id="dg-area" type="number" step="0.1" value={form.areaHa} onChange={e => setForm(p => ({ ...p, areaHa: Number(e.target.value) }))} className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dg-tipo">Tipo</Label>
          <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v as Talhao['tipo'] }))}>
            <SelectTrigger id="dg-tipo" className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="projeto">Projeto</SelectItem>
              <SelectItem value="control_site">Control Site</SelectItem>
              <SelectItem value="excluido">Excluído</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dg-topografia">Topografia</Label>
          <Select value={form.topografia} onValueChange={v => setForm(p => ({ ...p, topografia: v }))}>
            <SelectTrigger id="dg-topografia" className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TOPOGRAFIAS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dg-soc">SOC (%)</Label>
          <Input id="dg-soc" type="number" step="0.1" value={form.socPercent} onChange={e => setForm(p => ({ ...p, socPercent: e.target.value }))} className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dg-bd">BD (g/cm³)</Label>
          <Input id="dg-bd" type="number" step="0.01" value={form.bdGCm3} onChange={e => setForm(p => ({ ...p, bdGCm3: e.target.value }))} className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dg-argila">Argila (%)</Label>
          <Input id="dg-argila" type="number" step="0.1" value={form.argilaPercent} onChange={e => setForm(p => ({ ...p, argilaPercent: e.target.value }))} className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dg-prof">Profundidade (cm)</Label>
          <Input id="dg-prof" type="number" value={form.profundidadeCm} onChange={e => setForm(p => ({ ...p, profundidadeCm: Number(e.target.value) }))} className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dg-textura">Textura FAO</Label>
          <Select value={form.texturaFao} onValueChange={v => setForm(p => ({ ...p, texturaFao: v }))}>
            <SelectTrigger id="dg-textura" className="rounded-xl"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
            <SelectContent>
              {TEXTURAS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 flex flex-col justify-end">
          <Label>Dados Validados</Label>
          <button
            type="button"
            onClick={() => setForm(p => ({ ...p, dadosValidados: !p.dadosValidados }))}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all w-fit',
              form.dadosValidados
                ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
                : 'bg-gray-50 text-gray-500 border-gray-300 hover:bg-gray-100'
            )}
          >
            {form.dadosValidados ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
            {form.dadosValidados ? 'Validado' : 'Não validado'}
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white">
          <Save size={14} /> Salvar Dados Gerais
        </Button>
      </div>

      {/* Clima — colapsável */}
      <div className="border border-border/50 rounded-xl overflow-hidden">
        <button
          onClick={() => setClimaOpen(o => !o)}
          className="w-full flex items-center gap-2 px-4 py-3 bg-surface/20 hover:bg-accent/5 text-left transition-colors"
        >
          {climaOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <CloudRain size={14} className="text-primary" />
          <span className="text-sm font-semibold">Dados Climáticos</span>
          {climaExistente && (
            <Badge variant="outline" className="text-[10px] ml-auto shadow-none">Configurado</Badge>
          )}
        </button>
        {climaOpen && (
          <div className="p-4 space-y-3 border-t border-border/30">
            <div className="flex gap-2 flex-wrap">
              {['preset_cerrado', 'preset_amazonia', 'preset_pampa'].map(k => (
                <Button key={k} variant="outline" size="sm" className="text-xs h-7 rounded-lg"
                  onClick={() => setClimaEdit({ ...PRESETS[k] })}>
                  {k.replace('preset_', '')}
                </Button>
              ))}
            </div>
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-accent/5">
                    <th className="text-left p-2 font-medium">Variável</th>
                    {MESES.map(m => <th key={m} className="p-1.5 text-center font-medium">{m}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {[
                    { label: 'Temp (°C)', key: 'tempMensal', step: '0.1' },
                    { label: 'Precip (mm)', key: 'precipMensal', step: '1' },
                    { label: 'Evap (mm)', key: 'evapMensal', step: '1' },
                  ].map(row => (
                    <tr key={row.key}>
                      <td className="p-2 font-medium whitespace-nowrap">{row.label}</td>
                      {(climaEdit[row.key as keyof typeof climaEdit] as number[]).map((val, i) => (
                        <td key={i} className="p-0.5">
                          <Input type="number" step={row.step} value={val}
                            onChange={e => {
                              const arr = [...(climaEdit[row.key as keyof typeof climaEdit] as number[])]
                              arr[i] = parseFloat(e.target.value) || 0
                              setClimaEdit(prev => ({ ...prev, [row.key]: arr }))
                            }}
                            className="w-12 h-7 text-xs" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={salvarClima} className="gap-1.5 text-xs h-8 rounded-xl">
                <Save size={12} /> Salvar Clima
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Mapa */}
      <div className="border border-border/50 rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 bg-surface/20 text-sm font-semibold border-b border-border/30">
          Visualização
        </div>
        <FazendaMap talhoes={todosTalhoes} height="200px" highlightTalhaoId={talhao.id} />
      </div>
    </div>
  )
}

// ── ColetaSoloModal ───────────────────────────────────────────────────────────

interface ColetaFormState {
  pontosColetados: number
  profundidadeColeta: string
  socPercent: string
  bdGCm3: string
  lat: string
  lng: string
}

const EMPTY_FORM: ColetaFormState = {
  pontosColetados: 1,
  profundidadeColeta: '0-30 cm',
  socPercent: '',
  bdGCm3: '',
  lat: '',
  lng: '',
}

function coletaToForm(c: ColetaSolo): ColetaFormState {
  return {
    pontosColetados: c.pontosColetados,
    profundidadeColeta: c.profundidadeColeta,
    socPercent: String(c.socPercent),
    bdGCm3: String(c.bdGCm3),
    lat: c.lat != null ? String(c.lat) : '',
    lng: c.lng != null ? String(c.lng) : '',
  }
}

interface ColetaModalProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  talhao: Talhao
  fazendaId: string
  adminNome: string
  anoAgricola: number
  editingColeta: ColetaSolo | null
  onSaved: () => void
}

function ColetaModal({ open, onOpenChange, talhao, fazendaId, adminNome, anoAgricola, editingColeta, onSaved }: ColetaModalProps) {
  const { addColetaSolo, updateColetaSolo, updateTalhao } = useDataStore()
  const [form, setForm] = useState<ColetaFormState>(editingColeta ? coletaToForm(editingColeta) : EMPTY_FORM)

  const set = (f: Partial<ColetaFormState>) => setForm(p => ({ ...p, ...f }))

  const handleOpen = (v: boolean) => {
    if (v) setForm(editingColeta ? coletaToForm(editingColeta) : EMPTY_FORM)
    onOpenChange(v)
  }

  const handleSave = () => {
    const soc = parseFloat(form.socPercent)
    const bd  = parseFloat(form.bdGCm3)
    if (!form.pontosColetados || isNaN(soc) || isNaN(bd)) {
      toast.error('Preencha SOC e BD antes de salvar.')
      return
    }
    const base = {
      pontosColetados: Number(form.pontosColetados),
      profundidadeColeta: form.profundidadeColeta,
      socPercent: soc,
      bdGCm3: bd,
      lat: form.lat !== '' ? parseFloat(form.lat) : undefined,
      lng: form.lng !== '' ? parseFloat(form.lng) : undefined,
    }
    if (editingColeta) {
      updateColetaSolo(editingColeta.id, base)
      updateTalhao(talhao.id, { socPercent: soc, bdGCm3: bd, pontosColetados: Number(form.pontosColetados) }, 'Coleta laboratorial atualizada')
      toast.success('Coleta atualizada!')
    } else {
      addColetaSolo({
        fazendaId, talhaoId: talhao.id, talhaoNome: talhao.nome,
        safra: anoAgricola,
        registradoEm: new Date().toISOString(), registradoPor: adminNome,
        ...base,
      })
      updateTalhao(talhao.id, { socPercent: soc, bdGCm3: bd, pontosColetados: Number(form.pontosColetados), dadosValidados: true },
        `Coleta laboratorial — ${form.profundidadeColeta}`)
      toast.success('Coleta registrada e propagada ao talhão!')
    }
    onSaved()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingColeta ? 'Editar Coleta' : 'Nova Coleta de Solo'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="space-y-1.5">
            <Label>Pontos Coletados</Label>
            <Input type="number" min={1} value={form.pontosColetados}
              onChange={e => set({ pontosColetados: Number(e.target.value) })}
              className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Profundidade</Label>
            <Input value={form.profundidadeColeta}
              onChange={e => set({ profundidadeColeta: e.target.value })}
              placeholder="0-30 cm" className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>SOC (%)</Label>
            <Input type="number" step="0.01" value={form.socPercent}
              onChange={e => set({ socPercent: e.target.value })}
              placeholder="2.4" className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>BD (g/cm³)</Label>
            <Input type="number" step="0.001" value={form.bdGCm3}
              onChange={e => set({ bdGCm3: e.target.value })}
              placeholder="1.28" className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Latitude</Label>
            <Input type="number" step="0.000001" value={form.lat}
              onChange={e => set({ lat: e.target.value })}
              placeholder="-14.235" className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Longitude</Label>
            <Input type="number" step="0.000001" value={form.lng}
              onChange={e => set({ lng: e.target.value })}
              placeholder="-51.925" className="rounded-xl" />
          </div>

          {/* Prévia do cálculo */}
          {form.socPercent && form.bdGCm3 && (
            <div className="col-span-2 bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs space-y-0.5">
              <p className="font-semibold text-primary mb-1">Cálculo por linha</p>
              <div className="flex justify-between">
                <span className="text-muted">SOC stock (tC/ha)</span>
                <span className="font-mono font-semibold">
                  {calcSocStock(parseFloat(form.socPercent) || 0, parseFloat(form.bdGCm3) || 0, form.profundidadeColeta).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">CO₂e (tCO₂e/ha)</span>
                <span className="font-mono font-semibold">
                  {(calcSocStock(parseFloat(form.socPercent) || 0, parseFloat(form.bdGCm3) || 0, form.profundidadeColeta) * 3.667).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="rounded-xl gap-1.5 bg-teal-600 hover:bg-teal-700 text-white" onClick={handleSave}>
            <Save size={13} /> Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── ColetaSoloPanel ───────────────────────────────────────────────────────────

export function ColetaSoloPanel({ talhao, fazendaId, anoAgricola }: { talhao: Talhao; fazendaId: string; anoAgricola: number }) {
  const { coletasSolo, deleteColetaSolo, usuarios, resultadosMotor } = useDataStore()
  const adminNome = usuarios.find(u => u.role === 'Super Admin')?.nome ?? 'Admin'

  const minhasColetas = coletasSolo.filter(c => c.talhaoId === talhao.id)
  const motorResult   = resultadosMotor.find(r => r.talhaoId === talhao.id && r.anoAgricola === anoAgricola)

  const [modalOpen, setModalOpen]     = useState(false)
  const [editingColeta, setEditingColeta] = useState<ColetaSolo | null>(null)

  const openAdd  = () => { setEditingColeta(null); setModalOpen(true) }
  const openEdit = (c: ColetaSolo) => { setEditingColeta(c); setModalOpen(true) }

  // ── Cálculo agregado ──
  const avgSocStock = minhasColetas.length > 0
    ? minhasColetas.reduce((s, c) => s + calcSocStock(c.socPercent, c.bdGCm3, c.profundidadeColeta), 0) / minhasColetas.length
    : null

  return (
    <div className="space-y-4">

      {/* ── 1º nó: Cálculo Total ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-center">
          <p className="text-[10px] text-muted uppercase tracking-wide mb-0.5">SOC (%) atual</p>
          <p className="text-lg font-bold text-foreground">{talhao.socPercent?.toFixed(2) ?? '—'}</p>
          <p className="text-[10px] text-muted">%</p>
        </div>
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-center">
          <p className="text-[10px] text-muted uppercase tracking-wide mb-0.5">SOC stock (lab)</p>
          <p className="text-lg font-bold text-foreground">{avgSocStock != null ? avgSocStock.toFixed(2) : '—'}</p>
          <p className="text-[10px] text-muted">tC/ha</p>
        </div>
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-center">
          <p className="text-[10px] text-muted uppercase tracking-wide mb-0.5">SOC projeto (motor)</p>
          <p className="text-lg font-bold text-foreground">{motorResult?.socProjetoTcHa?.toFixed(2) ?? '—'}</p>
          <p className="text-[10px] text-muted">tC/ha</p>
        </div>
        <div className="bg-success/5 border border-success/20 rounded-xl p-3 text-center">
          <p className="text-[10px] text-success uppercase tracking-wide mb-0.5">VCUs emitidos</p>
          <p className="text-lg font-bold text-success">{motorResult?.vcusEmitidosTotal?.toFixed(1) ?? '—'}</p>
          <p className="text-[10px] text-muted">tCO₂e</p>
        </div>
      </div>

      {/* ── Tabela de coletas ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">Dados laboratoriais para o motor RothC (critério 8 VM0042).</p>
        <Button size="sm" className="gap-1.5 text-xs rounded-xl h-8" onClick={openAdd}>
          <Plus size={12} /> Adicionar Linha
        </Button>
      </div>

      <div className="border border-border/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-accent/5">
              <tr>
                <th className="text-left p-2.5 font-medium">Pts.</th>
                <th className="text-left p-2.5 font-medium">Profundidade</th>
                <th className="text-left p-2.5 font-medium">SOC (%)</th>
                <th className="text-left p-2.5 font-medium">BD (g/cm³)</th>
                <th className="text-left p-2.5 font-medium">Lat</th>
                <th className="text-left p-2.5 font-medium">Lng</th>
                <th className="text-left p-2.5 font-medium">Cálculo (tC/ha)</th>
                <th className="text-left p-2.5 font-medium">Registrado por</th>
                <th className="p-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {minhasColetas.map(c => (
                <tr key={c.id} className="hover:bg-accent/5">
                  <td className="p-2.5">
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] shadow-none">
                      {c.pontosColetados} pts
                    </Badge>
                  </td>
                  <td className="p-2.5 font-mono">{c.profundidadeColeta}</td>
                  <td className="p-2.5 font-semibold">{c.socPercent.toFixed(2)}</td>
                  <td className="p-2.5 font-semibold">{c.bdGCm3.toFixed(3)}</td>
                  <td className="p-2.5 text-muted font-mono">{c.lat != null ? c.lat.toFixed(5) : '—'}</td>
                  <td className="p-2.5 text-muted font-mono">{c.lng != null ? c.lng.toFixed(5) : '—'}</td>
                  <td className="p-2.5 font-semibold text-primary">
                    {calcSocStock(c.socPercent, c.bdGCm3, c.profundidadeColeta).toFixed(2)}
                  </td>
                  <td className="p-2.5 text-muted">
                    {c.registradoPor}
                    <br />
                    <span className="text-[10px]">{new Date(c.registradoEm).toLocaleDateString('pt-BR')}</span>
                  </td>
                  <td className="p-2.5">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-6 px-1.5 text-muted hover:text-foreground"
                        onClick={() => openEdit(c)}>
                        <Pencil size={11} />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-danger hover:text-danger h-6 px-1.5"
                        onClick={() => deleteColetaSolo(c.id)}>
                        <Trash2 size={11} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {minhasColetas.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted">
                    <FlaskConical size={22} className="mx-auto mb-2 opacity-30" />
                    Nenhum dado laboratorial registrado. Clique em "+ Adicionar Linha".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-3 py-2 border-t border-border/30 bg-primary/3 flex items-start gap-2">
          <Info size={12} className="text-primary mt-0.5 shrink-0" />
          <p className="text-[10px] text-muted leading-relaxed">
            Valores propagados automaticamente para o talhão e disponibilizados para o motor RothC-26.3 (VT0014 Eq.6–7).
          </p>
        </div>
      </div>

      <ColetaModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        talhao={talhao}
        fazendaId={fazendaId}
        adminNome={adminNome}
        anoAgricola={anoAgricola}
        editingColeta={editingColeta}
        onSaved={() => setEditingColeta(null)}
      />
    </div>
  )
}

// ── TalhaoDetail ──────────────────────────────────────────────────────────────

export function TalhaoDetail({ talhao, fazendaId, anoAgricola }: { talhao: Talhao; fazendaId: string; anoAgricola: number }) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-5">
        <ColetaSoloPanel talhao={talhao} fazendaId={fazendaId} anoAgricola={anoAgricola} />
      </div>
    </div>
  )
}
