import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDataStore } from '@/store/data'
import { Plus, CheckCircle2, XCircle, Leaf, Pencil, Save, Map, CloudRain, FlaskConical, Trash2, Info } from 'lucide-react'
import { toast } from 'sonner'
import FazendaMap from '@/components/maps/FazendaMap'
import { MESES, TEXTURAS, TOPOGRAFIAS, PRESETS } from '@/constants/climaticos'

const SAFRA_ATUAL = new Date().getFullYear()

// ─── Linha em branco para coleta nova ─────────────────────────────────────────
function linhaVazia(fazendaId: string, talhaoId: string, talhaoNome: string) {
  return {
    _id: crypto.randomUUID(),     // id local antes de salvar
    fazendaId,
    talhaoId,
    talhaoNome,
    safra: SAFRA_ATUAL,
    pontosColetados: 1,
    profundidadeColeta: '0-30 cm',
    socPercent: 0,
    bdGCm3: 0,
    saved: false,
  }
}

export function AdminTalhoesTab({ fazendaId }: { fazendaId: string }) {
  const {
    talhoes, addTalhao, updateTalhao,
    dadosClimaticos, saveDadoClimatico,
    coletasSolo, addColetaSolo, deleteColetaSolo,
    usuarios,
  } = useDataStore()
  const meusTalhoes = talhoes.filter(t => t.fazendaId === fazendaId)

  // ── Adicionar Talhão ────────────────────────────────────────────────────────
  const [showAdd, setShowAdd] = useState(false)
  const [nt, setNt] = useState({
    nome:'', areaHa:0, tipo:'projeto' as 'projeto'|'control_site'|'excluido',
    socPercent:0, bdGCm3:0, argilaPercent:0, profundidadeCm:30, pontosColetados:0,
    grupoSoloFao:'', texturaFao:'', topografia:'plano'
  })

  const handleAdd = () => {
    if (!nt.nome || !nt.areaHa) { toast.error('Preencha nome e área.'); return }
    addTalhao({ ...nt, fazendaId, dadosValidados: false })
    toast.success('Talhão adicionado!')
    setShowAdd(false)
    setNt({ nome:'', areaHa:0, tipo:'projeto', socPercent:0, bdGCm3:0, argilaPercent:0, profundidadeCm:30, pontosColetados:0, grupoSoloFao:'', texturaFao:'', topografia:'plano' })
  }

  // ── Edição inline de solo ──────────────────────────────────────────────────
  const [editId, setEditId] = useState<string | null>(null)
  type EditSoloState = {
    socPercent: number | string; bdGCm3: number | string; argilaPercent: number | string
    profundidadeCm: number; pontosColetados: number
    grupoSoloFao: string; texturaFao: string; topografia: string
  }
  const [editSolo, setEditSolo] = useState<Partial<EditSoloState>>({})

  const startEdit = (t: typeof meusTalhoes[0]) => {
    setEditId(t.id)
    setEditSolo({
      socPercent: t.socPercent ?? '', bdGCm3: t.bdGCm3 ?? '',
      argilaPercent: t.argilaPercent ?? '', profundidadeCm: t.profundidadeCm,
      pontosColetados: t.pontosColetados ?? 0,
      grupoSoloFao: t.grupoSoloFao ?? '', texturaFao: t.texturaFao ?? '', topografia: t.topografia ?? 'plano'
    })
  }

  const saveEdit = (id: string) => {
    updateTalhao(id, {
      ...editSolo,
      socPercent: Number(editSolo.socPercent),
      bdGCm3: Number(editSolo.bdGCm3),
      argilaPercent: Number(editSolo.argilaPercent),
      profundidadeCm: Number(editSolo.profundidadeCm),
      pontosColetados: Number(editSolo.pontosColetados),
      dadosValidados: true,
    }, 'Edição inline de dados de solo')
    toast.success('Dados de solo salvos!')
    setEditId(null)
  }

  // ── Clima ──────────────────────────────────────────────────────────────────
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

  // ── Coleta de Solo (tabela laboratorial) ─────────────────────────────────
  const adminNome = usuarios.find(u => u.role === 'Super Admin')?.nome ?? 'Admin'
  const minhasColetas = coletasSolo.filter(c => c.fazendaId === fazendaId)

  // Linhas locais (ainda não salvas no store)
  const [linhasLocais, setLinhasLocais] = useState<ReturnType<typeof linhaVazia>[]>([])

  const adicionarLinhaColeta = () => {
    const primeiro = meusTalhoes.find(t => t.tipo === 'projeto')
    if (!primeiro) { toast.error('Nenhum talhão de projeto disponível.'); return }
    setLinhasLocais(prev => [...prev, linhaVazia(fazendaId, primeiro.id, primeiro.nome)])
  }

  const atualizarLinhaLocal = (sid: string, field: string, value: string | number) => {
    setLinhasLocais(prev => prev.map(l => {
      if (l._id !== sid) return l
      // Se trocou o talhão, atualiza o nome também
      if (field === 'talhaoId') {
        const t = meusTalhoes.find(t => t.id === value)
        return { ...l, talhaoId: String(value), talhaoNome: t?.nome ?? '' }
      }
      return { ...l, [field]: value }
    }))
  }

  const salvarLinhaLocal = (sid: string) => {
    const linha = linhasLocais.find(l => l._id === sid)
    if (!linha) return
    if (!linha.pontosColetados || !linha.socPercent || !linha.bdGCm3) {
      toast.error('Preencha todos os campos antes de salvar.')
      return
    }
    // Salva no store
    addColetaSolo({
      fazendaId: linha.fazendaId,
      talhaoId: linha.talhaoId,
      talhaoNome: linha.talhaoNome,
      safra: linha.safra,
      pontosColetados: Number(linha.pontosColetados),
      profundidadeColeta: linha.profundidadeColeta,
      socPercent: Number(linha.socPercent),
      bdGCm3: Number(linha.bdGCm3),
      registradoEm: new Date().toISOString(),
      registradoPor: adminNome,
    })
    // Propaga para o talhão (alimenta motor RothC)
    updateTalhao(linha.talhaoId, {
      socPercent: Number(linha.socPercent),
      bdGCm3: Number(linha.bdGCm3),
      pontosColetados: Number(linha.pontosColetados),
      dadosValidados: true,
    }, `Coleta laboratorial — ${linha.profundidadeColeta} — ${Number(linha.pontosColetados)} pts`)
    // Remove da lista local
    setLinhasLocais(prev => prev.filter(l => l._id !== sid))
    toast.success('Coleta registrada e propagada ao talhão!')
  }

  const excluirLinhaLocal = (sid: string) => setLinhasLocais(prev => prev.filter(l => l._id !== sid))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <div>
             <h2 className="text-xl font-bold">Gestor de Talhões — Avançado</h2>
             <p className="text-muted text-sm">Controle de área, solo FAO e topografia</p>
         </div>
         <Button className="gap-2 rounded-xl" onClick={() => setShowAdd(!showAdd)}>
           <Plus size={16} /> Novo Talhão
         </Button>
      </div>

      {showAdd && (
        <Card className="border-success/20 bg-success/5">
          <CardHeader className="pb-3"><CardTitle className="text-base">Adicionar Talhão</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
               <div className="space-y-1.5"><Label>Nome *</Label><Input value={nt.nome} onChange={e => setNt(p => ({...p, nome:e.target.value}))} className="rounded-xl" /></div>
               <div className="space-y-1.5"><Label>Área (ha) *</Label><Input type="number" value={nt.areaHa || ''} onChange={e => setNt(p => ({...p, areaHa:Number(e.target.value)}))} className="rounded-xl" /></div>
               <div className="space-y-1.5">
                <Label>Função</Label>
                <Select value={nt.tipo} onValueChange={v => setNt(p => ({...p, tipo: v as 'projeto' | 'control_site' | 'excluido'}))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="projeto">Projeto</SelectItem><SelectItem value="control_site">Control Site</SelectItem></SelectContent>
                </Select>
               </div>
               <div className="space-y-1.5"><Label>SOC (%)</Label><Input type="number" step="0.1" value={nt.socPercent || ''} onChange={e => setNt(p => ({...p, socPercent:Number(e.target.value)}))} className="rounded-xl" /></div>
               <div className="space-y-1.5"><Label>BD (g/cm³)</Label><Input type="number" step="0.01" value={nt.bdGCm3 || ''} onChange={e => setNt(p => ({...p, bdGCm3:Number(e.target.value)}))} className="rounded-xl" /></div>
               <div className="space-y-1.5"><Label>Pts. Coletados</Label><Input type="number" min={0} value={nt.pontosColetados || ''} onChange={e => setNt(p => ({...p, pontosColetados:Number(e.target.value)}))} className="rounded-xl" /></div>
               <div className="space-y-1.5"><Label>Argila (%)</Label><Input type="number" value={nt.argilaPercent || ''} onChange={e => setNt(p => ({...p, argilaPercent:Number(e.target.value)}))} className="rounded-xl" /></div>
               <div className="space-y-1.5">
                <Label>Textura FAO</Label>
                <Select value={nt.texturaFao} onValueChange={v => setNt(p => ({...p, texturaFao:v}))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{TEXTURAS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
               </div>
               <div className="space-y-1.5">
                <Label>Topografia</Label>
                <Select value={nt.topografia} onValueChange={v => setNt(p => ({...p, topografia:v}))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{TOPOGRAFIAS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
               </div>
            </div>
            <div className="flex gap-3 justify-end"><Button variant="outline" className="rounded-xl" onClick={() => setShowAdd(false)}>Cancelar</Button><Button className="rounded-xl" onClick={handleAdd}>Adicionar</Button></div>
          </CardContent>
        </Card>
      )}

      {/* ── Tabela de Talhões ──────────────────────────────────────────────── */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="border-b bg-surface/50 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Leaf size={18} /> Talhões ({meusTalhoes.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-accent/5">
                <tr>
                  <th className="text-left p-3">Nome</th>
                  <th className="text-left p-3">Área</th>
                  <th className="text-left p-3">Tipo</th>
                  <th className="text-left p-3">SOC %</th>
                  <th className="text-left p-3">BD (g/cm³)</th>
                  <th className="text-left p-3 text-primary">Pts. Coletados</th>
                  <th className="text-left p-3">Argila %</th>
                  <th className="text-left p-3">Prof.</th>
                  <th className="text-center p-3">Validado</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {meusTalhoes.map(t => (
                  <tr key={t.id} className="hover:bg-accent/5">
                    <td className="p-3 font-medium">{t.nome}</td>
                    <td className="p-3 text-muted">{t.areaHa} ha</td>
                    <td className="p-3"><Badge variant="outline" className="text-xs shadow-none">{t.tipo}</Badge></td>
                    {editId === t.id ? (
                      <>
                        <td className="p-1.5"><Input type="number" step="0.1" value={editSolo.socPercent} onChange={e => setEditSolo(p=>({...p,socPercent:e.target.value}))} className="w-20 h-8" /></td>
                        <td className="p-1.5"><Input type="number" step="0.01" value={editSolo.bdGCm3} onChange={e => setEditSolo(p=>({...p,bdGCm3:e.target.value}))} className="w-20 h-8" /></td>
                        <td className="p-1.5"><Input type="number" min={0} value={editSolo.pontosColetados} onChange={e => setEditSolo(p=>({...p,pontosColetados:e.target.value}))} className="w-20 h-8" /></td>
                        <td className="p-1.5"><Input type="number" value={editSolo.argilaPercent} onChange={e => setEditSolo(p=>({...p,argilaPercent:e.target.value}))} className="w-20 h-8" /></td>
                        <td className="p-1.5"><Input type="number" value={editSolo.profundidadeCm} onChange={e => setEditSolo(p=>({...p,profundidadeCm:e.target.value}))} className="w-20 h-8" /></td>
                      </>
                    ) : (
                      <>
                        <td className="p-3 text-muted">{t.socPercent ?? '—'}</td>
                        <td className="p-3 text-muted">{t.bdGCm3 ?? '—'}</td>
                        <td className="p-3">
                          {t.pontosColetados
                            ? <Badge className="bg-primary/10 text-primary border-primary/20 text-xs shadow-none">{t.pontosColetados} pts</Badge>
                            : <span className="text-muted text-xs">—</span>}
                        </td>
                        <td className="p-3 text-muted">{t.argilaPercent ?? '—'}</td>
                        <td className="p-3 text-muted">{t.profundidadeCm} cm</td>
                      </>
                    )}
                    <td className="p-3 text-center">{t.dadosValidados ? <CheckCircle2 size={16} className="text-success mx-auto" /> : <XCircle size={16} className="text-muted mx-auto" />}</td>
                    <td className="p-3 text-right">
                      {editId === t.id ? (
                        <div className="flex gap-1 justify-end"><Button size="sm" variant="ghost" onClick={() => setEditId(null)}>✕</Button><Button size="sm" onClick={() => saveEdit(t.id)}><Save size={11} className="mr-1"/> Salvar</Button></div>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => startEdit(t)}><Pencil size={12} className="mr-1"/> Editar</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Coleta de Solo por Talhão ─────────────────────────────────────── */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="border-b bg-surface/50 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <FlaskConical size={16} className="text-primary" />
                Coleta de Solo por Talhão
              </CardTitle>
              <p className="text-xs text-muted mt-1">
                Dados laboratoriais inseridos manualmente pelo admin. Alimentam o{' '}
                <span className="text-primary font-medium">critério 8 do motor de matching (teste-t SOC)</span>{' '}
                e as equações{' '}
                <span className="font-mono text-primary">VT0014 Eq.6–7</span>.
              </p>
            </div>
            <Button size="sm" className="gap-2 rounded-xl" onClick={adicionarLinhaColeta}>
              <Plus size={14} /> Adicionar Linha
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-accent/5">
                <tr>
                  <th className="text-left p-3">Talhão</th>
                  <th className="text-left p-3">Safra</th>
                  <th className="text-left p-3">Pts. Coletados</th>
                  <th className="text-left p-3">Profundidade</th>
                  <th className="text-left p-3">SOC (%)</th>
                  <th className="text-left p-3">BD (g/cm³)</th>
                  <th className="text-left p-3">Registrado por</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">

                {/* Linhas já salvas no store */}
                {minhasColetas.map(c => (
                  <tr key={c.id} className="hover:bg-accent/5 bg-success/2">
                    <td className="p-3 font-medium">{c.talhaoNome}</td>
                    <td className="p-3 text-muted">{c.safra}/{c.safra+1}</td>
                    <td className="p-3">
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-xs shadow-none">{c.pontosColetados} pts</Badge>
                    </td>
                    <td className="p-3 font-mono text-xs text-muted">{c.profundidadeColeta}</td>
                    <td className="p-3 font-semibold text-foreground">{c.socPercent.toFixed(2)}</td>
                    <td className="p-3 font-semibold text-foreground">{c.bdGCm3.toFixed(3)}</td>
                    <td className="p-3 text-muted text-xs">
                      {c.registradoPor}<br/>
                      <span className="text-[10px]">{new Date(c.registradoEm).toLocaleDateString('pt-BR')}</span>
                    </td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant="ghost" className="text-danger hover:text-danger" onClick={() => deleteColetaSolo(c.id)}>
                        <Trash2 size={13} />
                      </Button>
                    </td>
                  </tr>
                ))}

                {/* Linhas locais ainda não salvas */}
                {linhasLocais.map(l => (
                  <tr key={l._id} className="bg-warning/3 border-l-2 border-warning/40">
                    <td className="p-1.5">
                      <Select value={l.talhaoId} onValueChange={v => atualizarLinhaLocal(l._id, 'talhaoId', v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {meusTalhoes.filter(t => t.tipo === 'projeto').map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-1.5">
                      <Input type="number" value={l.safra} min={2020} max={2035}
                        onChange={e => atualizarLinhaLocal(l._id, 'safra', Number(e.target.value))}
                        className="w-20 h-8 text-xs" />
                    </td>
                    <td className="p-1.5">
                      <Input type="number" min={1} value={l.pontosColetados}
                        onChange={e => atualizarLinhaLocal(l._id, 'pontosColetados', Number(e.target.value))}
                        className="w-20 h-8 text-xs" />
                    </td>
                    <td className="p-1.5">
                      <Input value={l.profundidadeColeta}
                        onChange={e => atualizarLinhaLocal(l._id, 'profundidadeColeta', e.target.value)}
                        className="w-24 h-8 text-xs" placeholder="0-30 cm" />
                    </td>
                    <td className="p-1.5">
                      <Input type="number" step="0.01" value={l.socPercent || ''}
                        onChange={e => atualizarLinhaLocal(l._id, 'socPercent', Number(e.target.value))}
                        className="w-20 h-8 text-xs" />
                    </td>
                    <td className="p-1.5">
                      <Input type="number" step="0.001" value={l.bdGCm3 || ''}
                        onChange={e => atualizarLinhaLocal(l._id, 'bdGCm3', Number(e.target.value))}
                        className="w-20 h-8 text-xs" />
                    </td>
                    <td className="p-1.5 text-xs text-muted">{adminNome}</td>
                    <td className="p-1.5">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" className="text-danger hover:text-danger h-8 px-2" onClick={() => excluirLinhaLocal(l._id)}>
                          <Trash2 size={12} />
                        </Button>
                        <Button size="sm" className="h-8 gap-1 text-xs" onClick={() => salvarLinhaLocal(l._id)}>
                          <Save size={11} /> Salvar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Estado vazio */}
                {minhasColetas.length === 0 && linhasLocais.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted text-sm">
                      <FlaskConical size={24} className="mx-auto mb-2 opacity-30" />
                      Nenhum dado laboratorial registrado. Clique em "+ Adicionar Linha" para iniciar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Nota metodológica */}
          <div className="px-4 py-3 border-t border-border/30 bg-primary/3 flex items-start gap-2">
            <Info size={13} className="text-primary mt-0.5 shrink-0" />
            <p className="text-[11px] text-muted leading-relaxed">
              <span className="font-semibold text-foreground">Referência metodológica:</span>{' '}
              O número de pontos coletados (n) é utilizado no teste-t de Student para verificar se a diferença de SOC entre talhão de projeto e control site é estatisticamente significativa (critério 8 VM0042).
              As médias e desvios padrão de SOC% e BD alimentam as equações{' '}
              <span className="font-mono">VT0014 Eq.6</span> (SOC stock) e{' '}
              <span className="font-mono">VT0014 Eq.7</span> (incerteza combinada).
              Ao salvar uma linha, os valores são propagados automaticamente para o talhão e ficam disponíveis para o motor RothC-26.3.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Mapa ──────────────────────────────────────────────────────────── */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-surface/50 pb-4"><CardTitle className="text-base flex items-center gap-2"><Map size={16} className="text-primary" /> Visualização</CardTitle></CardHeader>
        <CardContent className="p-0"><FazendaMap talhoes={meusTalhoes} height="380px" /></CardContent>
      </Card>

      {/* ── Clima ─────────────────────────────────────────────────────────── */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="border-b bg-surface/50 pb-4"><CardTitle className="text-base flex items-center gap-2"><CloudRain size={16} className="text-primary" /> Clima</CardTitle></CardHeader>
        <CardContent className="pt-5 space-y-4">
           <div className="flex gap-3 items-end">
             <div className="flex-1"><Label>Talhão</Label><Select value={climaTalhaoId} onValueChange={v => { setClimaTalhaoId(v); const c = dadosClimaticos.find(d => d.talhaoId === v); if (c) setClimaEdit({ tempMensal: c.tempMensal, precipMensal: c.precipMensal, evapMensal: c.evapMensal }) }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{meusTalhoes.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent></Select></div>
             <div><Label className="mb-1.5 block text-xs">Presets</Label><div className="flex gap-2">{['preset_cerrado','preset_amazonia','preset_pampa'].map(k => <Button key={k} variant="outline" size="sm" onClick={() => aplicarPreset(k)}>{k.replace('preset_','')}</Button>)}</div></div>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-xs">
               <thead><tr className="bg-accent/5"><th className="text-left p-2">Mês</th>{MESES.map(m => <th key={m} className="p-2 text-center">{m}</th>)}</tr></thead>
               <tbody className="divide-y divide-border/30">
                 {[ { label: 'Temp', key: 'tempMensal', step: '0.1' }, { label: 'Precip', key: 'precipMensal', step: '1' }, { label: 'Evap', key: 'evapMensal', step: '1' } ].map(row => (
                   <tr key={row.key}><td className="p-2 font-medium">{row.label}</td>
                     {climaEdit[row.key as keyof typeof climaEdit].map((val: number, i: number) => <td key={i} className="p-1"><Input type="number" step={row.step} value={val} onChange={e => { const arr = [...climaEdit[row.key as keyof typeof climaEdit]]; arr[i] = parseFloat(e.target.value)||0; setClimaEdit(prev => ({...prev, [row.key]: arr})) }} className="w-12 h-7" /></td>)}
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
           <div className="flex justify-end"><Button onClick={salvarClima}><Save size={14} className="mr-2"/> Salvar Clima</Button></div>
        </CardContent>
      </Card>
    </div>
  )
}
