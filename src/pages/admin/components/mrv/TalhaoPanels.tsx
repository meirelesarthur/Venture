import { useState } from 'react'
import { useDataStore } from '@/store/data'
import type { Talhao } from '@/store/data'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  CheckCircle2, XCircle, Leaf, Tractor, FlaskConical,
  Save, Trash2, Info, CloudRain, ChevronDown, ChevronRight, Plus,
} from 'lucide-react'
import LavouraForm from '@/pages/cliente/mrv/LavouraForm'
import PecuariaForm from '@/pages/cliente/mrv/PecuariaForm'
import FazendaMap from '@/components/maps/FazendaMap'
import { MESES, TEXTURAS, TOPOGRAFIAS, PRESETS } from '@/constants/climaticos'

const SAFRA_ATUAL = new Date().getFullYear()

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
            <div className="overflow-x-auto">
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

// ── ManejoPanel ───────────────────────────────────────────────────────────────

type ManejoSubType = 'lavoura' | 'pecuaria'

export function ManejoPanel({ talhaoId, fazendaId, anoAgricola }: { talhaoId: string; fazendaId: string; anoAgricola: number }) {
  const [sub, setSub] = useState<ManejoSubType>('lavoura')

  const MANEJO_TABS = [
    { id: 'lavoura' as const, label: 'Lavoura', Icon: Leaf },
    { id: 'pecuaria' as const, label: 'Pecuária', Icon: Tractor },
  ]

  return (
    <div className="space-y-4">
      <div className="flex border-b border-border/50" role="tablist">
        {MANEJO_TABS.map(t => (
          <button key={t.id} role="tab" aria-selected={sub === t.id} onClick={() => setSub(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px',
              sub === t.id
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}>
            <t.Icon size={13} />{t.label}
          </button>
        ))}
      </div>
      {sub === 'lavoura' && (
        <LavouraForm talhaoIds={[talhaoId]} fazendaId={fazendaId} anoAgricola={anoAgricola} locked={false} />
      )}
      {sub === 'pecuaria' && (
        <PecuariaForm talhaoIds={[talhaoId]} fazendaId={fazendaId} anoAgricola={anoAgricola} locked={false} />
      )}
    </div>
  )
}

// ── ColetaSoloPanel ───────────────────────────────────────────────────────────

type LinhaLocal = {
  _id: string; fazendaId: string; talhaoId: string; talhaoNome: string
  safra: number; pontosColetados: number; profundidadeColeta: string
  socPercent: number; bdGCm3: number
}

export function ColetaSoloPanel({ talhao, fazendaId }: { talhao: Talhao; fazendaId: string }) {
  const { coletasSolo, addColetaSolo, deleteColetaSolo, updateTalhao, usuarios } = useDataStore()
  const adminNome = usuarios.find(u => u.role === 'Super Admin')?.nome ?? 'Admin'
  const minhasColetas = coletasSolo.filter(c => c.talhaoId === talhao.id)

  const novaLinha = (): LinhaLocal => ({
    _id: crypto.randomUUID(), fazendaId, talhaoId: talhao.id, talhaoNome: talhao.nome,
    safra: SAFRA_ATUAL, pontosColetados: 1, profundidadeColeta: '0-30 cm', socPercent: 0, bdGCm3: 0,
  })

  const [linhasLocais, setLinhasLocais] = useState<LinhaLocal[]>([])

  const atualizarLinhaLocal = (sid: string, field: string, value: string | number) =>
    setLinhasLocais(prev => prev.map(l => l._id !== sid ? l : { ...l, [field]: value }))

  const salvarLinhaLocal = (sid: string) => {
    const linha = linhasLocais.find(l => l._id === sid)
    if (!linha) return
    if (!linha.pontosColetados || !linha.socPercent || !linha.bdGCm3) {
      toast.error('Preencha todos os campos antes de salvar.')
      return
    }
    addColetaSolo({
      fazendaId: linha.fazendaId, talhaoId: linha.talhaoId, talhaoNome: linha.talhaoNome,
      safra: linha.safra, pontosColetados: Number(linha.pontosColetados),
      profundidadeColeta: linha.profundidadeColeta, socPercent: Number(linha.socPercent),
      bdGCm3: Number(linha.bdGCm3), registradoEm: new Date().toISOString(), registradoPor: adminNome,
    })
    updateTalhao(linha.talhaoId, {
      socPercent: Number(linha.socPercent), bdGCm3: Number(linha.bdGCm3),
      pontosColetados: Number(linha.pontosColetados), dadosValidados: true,
    }, `Coleta laboratorial — ${linha.profundidadeColeta}`)
    setLinhasLocais(prev => prev.filter(l => l._id !== sid))
    toast.success('Coleta registrada e propagada ao talhão!')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">Dados laboratoriais para o motor RothC (critério 8 VM0042).</p>
        <Button size="sm" className="gap-1.5 text-xs rounded-xl h-8" onClick={() => setLinhasLocais(p => [...p, novaLinha()])}>
          <Plus size={12} /> Adicionar Linha
        </Button>
      </div>

      <div className="border border-border/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-accent/5">
              <tr>
                <th className="text-left p-2.5 font-medium">Safra</th>
                <th className="text-left p-2.5 font-medium">Pts. Coletados</th>
                <th className="text-left p-2.5 font-medium">Profundidade</th>
                <th className="text-left p-2.5 font-medium">SOC (%)</th>
                <th className="text-left p-2.5 font-medium">BD (g/cm³)</th>
                <th className="text-left p-2.5 font-medium">Registrado por</th>
                <th className="p-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {minhasColetas.map(c => (
                <tr key={c.id} className="hover:bg-accent/5">
                  <td className="p-2.5">{c.safra}/{c.safra + 1}</td>
                  <td className="p-2.5">
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] shadow-none">
                      {c.pontosColetados} pts
                    </Badge>
                  </td>
                  <td className="p-2.5 font-mono">{c.profundidadeColeta}</td>
                  <td className="p-2.5 font-semibold">{c.socPercent.toFixed(2)}</td>
                  <td className="p-2.5 font-semibold">{c.bdGCm3.toFixed(3)}</td>
                  <td className="p-2.5 text-muted">
                    {c.registradoPor}
                    <br />
                    <span className="text-[10px]">{new Date(c.registradoEm).toLocaleDateString('pt-BR')}</span>
                  </td>
                  <td className="p-2.5">
                    <Button size="sm" variant="ghost" className="text-danger hover:text-danger h-6 px-1.5"
                      onClick={() => deleteColetaSolo(c.id)}>
                      <Trash2 size={11} />
                    </Button>
                  </td>
                </tr>
              ))}

              {linhasLocais.map(l => (
                <tr key={l._id} className="bg-warning/5 border-l-2 border-warning/40">
                  <td className="p-1">
                    <Input type="number" value={l.safra} min={2020} max={2035}
                      onChange={e => atualizarLinhaLocal(l._id, 'safra', Number(e.target.value))}
                      className="w-16 h-7 text-xs" />
                  </td>
                  <td className="p-1">
                    <Input type="number" min={1} value={l.pontosColetados}
                      onChange={e => atualizarLinhaLocal(l._id, 'pontosColetados', Number(e.target.value))}
                      className="w-14 h-7 text-xs" />
                  </td>
                  <td className="p-1">
                    <Input value={l.profundidadeColeta}
                      onChange={e => atualizarLinhaLocal(l._id, 'profundidadeColeta', e.target.value)}
                      className="w-20 h-7 text-xs" placeholder="0-30 cm" />
                  </td>
                  <td className="p-1">
                    <Input type="number" step="0.01" value={l.socPercent || ''}
                      onChange={e => atualizarLinhaLocal(l._id, 'socPercent', Number(e.target.value))}
                      className="w-16 h-7 text-xs" />
                  </td>
                  <td className="p-1">
                    <Input type="number" step="0.001" value={l.bdGCm3 || ''}
                      onChange={e => atualizarLinhaLocal(l._id, 'bdGCm3', Number(e.target.value))}
                      className="w-16 h-7 text-xs" />
                  </td>
                  <td className="p-1 text-muted text-[11px]">{adminNome}</td>
                  <td className="p-1">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="text-danger h-7 px-1.5"
                        onClick={() => setLinhasLocais(p => p.filter(x => x._id !== l._id))}>
                        <Trash2 size={11} />
                      </Button>
                      <Button size="sm" className="h-7 text-xs gap-1"
                        onClick={() => salvarLinhaLocal(l._id)}>
                        <Save size={10} /> Salvar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {minhasColetas.length === 0 && linhasLocais.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted">
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
    </div>
  )
}

// ── TalhaoDetail ──────────────────────────────────────────────────────────────

type DetailTab = 'dados' | 'manejo' | 'solo'

const DETAIL_TABS: { id: DetailTab; label: string }[] = [
  { id: 'dados', label: 'Dados Gerais' },
  { id: 'manejo', label: 'Manejo' },
  { id: 'solo', label: 'Coleta de Solo' },
]

export function TalhaoDetail({ talhao, fazendaId, anoAgricola }: { talhao: Talhao; fazendaId: string; anoAgricola: number }) {
  const [sub, setSub] = useState<DetailTab>('dados')

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex border-b border-border/50 px-4 bg-surface/10 shrink-0" role="tablist">
        {DETAIL_TABS.map(t => (
          <button key={t.id} role="tab" aria-selected={sub === t.id} onClick={() => setSub(t.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px',
              sub === t.id
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {sub === 'dados' && <DadosGeraisPanel talhao={talhao} fazendaId={fazendaId} />}
        {sub === 'manejo' && <ManejoPanel talhaoId={talhao.id} fazendaId={fazendaId} anoAgricola={anoAgricola} />}
        {sub === 'solo' && <ColetaSoloPanel talhao={talhao} fazendaId={fazendaId} />}
      </div>
    </div>
  )
}
