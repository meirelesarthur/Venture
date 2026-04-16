/**
 * AdminControlSiteForm — Página de cadastro/edição em tela cheia
 * Rota: /admin/control-sites/novo  |  /admin/control-sites/:id/editar
 */
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'sonner'
import {
  ArrowLeft, CheckCircle2, ChevronRight, Save, MapPin, Cloud,
  FlaskConical, Leaf, Link2, User, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useDataStore } from '@/store/data'
import type { HistoricoManejoAnual } from '@/store/data'

// ─── Schema Zod ───────────────────────────────────────────────────────────────

const schema = z.object({
  // Passo 1 — Identificação
  nome: z.string().min(3, 'Nome obrigatório'),
  gestor_nome: z.string().optional(),
  gestor_tipo: z.enum(['proponente', 'parceiro', 'externo']).optional(),
  status_cs: z.enum(['Ativo', 'Em_implantacao', 'Inativo']).default('Ativo'),
  // Passo 2 — Localização
  centroide_lat: z.coerce.number().optional(),
  centroide_lng: z.coerce.number().optional(),
  area_ha: z.coerce.number().positive().optional(),
  // Passo 3 — Atributos Geofísicos
  zona_climatica_ipcc: z.string().optional(),
  ecorregiao_wwf: z.string().optional(),
  classe_textural_fao: z.string().optional(),
  grupo_solo_wrb: z.string().optional(),
  classe_declividade: z.string().optional(),
  aspecto_cardinal: z.string().optional(),
  // Passo 4 — Clima
  precip_media_anual_mm: z.coerce.number().optional(),
  fonte_precip: z.string().optional(),
  dist_estacao_meteo_km: z.coerce.number().optional(),
  // Passo 5 — SOC (Critério 8)
  soc_medio_pct: z.coerce.number().optional(),
  soc_ic_lower: z.coerce.number().optional(),
  soc_ic_upper: z.coerce.number().optional(),
  n_amostras_soc: z.coerce.number().int().optional(),
  data_primeira_coleta: z.string().optional(),
})

type FormData = z.infer<typeof schema>

// ─── Passo config ─────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Identificação', icon: User },
  { id: 2, label: 'Localização', icon: MapPin },
  { id: 3, label: 'Geofísico', icon: FlaskConical },
  { id: 4, label: 'Clima', icon: Cloud },
  { id: 5, label: 'SOC', icon: FlaskConical },
  { id: 6, label: 'Manejo', icon: Leaf },
  { id: 7, label: 'Vínculos', icon: Link2 },
]

// ─── Componente auxiliar de campo ─────────────────────────────────────────────

function Field({ label, hint, required, children }: {
  label: string; hint?: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label} {required && <span className="text-danger">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AdminControlSiteForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id && id !== 'novo')

  const { controlSites, addControlSite, updateControlSite, fazendas } = useDataStore()

  const existing = isEdit ? controlSites.find(cs => cs.id === id) : undefined
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  // Passo 6 — Histórico de manejo (tabela local)
  const [historicoManejo, setHistoricoManejo] = useState<HistoricoManejoAnual[]>(
    existing?.historico_manejo ?? []
  )

  // Passo 7 — Fazendas vinculadas
  const [fazendasVinculadas, setFazendasVinculadas] = useState<string[]>(
    existing?.fazendasVinculadasIds ?? []
  )

  const {
    register, handleSubmit, watch, setValue, formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: existing ? {
      nome: existing.nome,
      gestor_nome: existing.gestor_nome,
      gestor_tipo: existing.gestor_tipo,
      status_cs: existing.status_cs ?? 'Ativo',
      centroide_lat: existing.centroide_lat,
      centroide_lng: existing.centroide_lng,
      area_ha: existing.area_ha ?? existing.area,
      zona_climatica_ipcc: existing.zona_climatica_ipcc,
      ecorregiao_wwf: existing.ecorregiao_wwf,
      classe_textural_fao: existing.classe_textural_fao ?? existing.texturaFao,
      grupo_solo_wrb: existing.grupo_solo_wrb,
      classe_declividade: existing.classe_declividade,
      aspecto_cardinal: existing.aspecto_cardinal,
      precip_media_anual_mm: existing.precip_media_anual_mm,
      fonte_precip: existing.fonte_precip,
      dist_estacao_meteo_km: existing.dist_estacao_meteo_km,
      soc_medio_pct: existing.soc_medio_pct,
      soc_ic_lower: existing.soc_ic_lower,
      soc_ic_upper: existing.soc_ic_upper,
      n_amostras_soc: existing.n_amostras_soc,
      data_primeira_coleta: existing.data_primeira_coleta,
    } : { status_cs: 'Ativo' },
  })

  // Linha em branco padrão para manejo
  const novaLinhaManejo = (): HistoricoManejoAnual => ({
    ano: new Date().getFullYear() - 1,
    preparo_solo: 'convencional',
    tipo_cultura: '',
    grupo_funcional: 'gramineas',
    remocao_residuos: false,
    esterco: false,
    composto: false,
    irrigacao: false,
  })

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    const payload = {
      ...data,
      historico_manejo: historicoManejo,
      fazendasVinculadasIds: fazendasVinculadas,
    }
    if (isEdit && existing) {
      updateControlSite(existing.id, payload)
      toast.success('Control Site atualizado com sucesso!')
    } else {
      addControlSite({ id: uuidv4(), ...payload })
      toast.success('Control Site cadastrado com sucesso!')
    }
    setSaving(false)
    navigate('/admin/control-sites')
  }

  const toggleFazenda = (fazId: string) => {
    setFazendasVinculadas(prev =>
      prev.includes(fazId) ? prev.filter(f => f !== fazId) : [...prev, fazId]
    )
  }

  const totalSteps = STEPS.length

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header — padrão do sistema */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isEdit ? (existing?.nome ?? 'Editar Site') : 'Novo Control Site'}
            </h1>
            <p className="text-sm text-muted">VM0042 v2.2 · Passo {step}/{totalSteps}</p>
          </div>
        </div>
        <Button onClick={handleSubmit(onSubmit)} className="gap-2 rounded-xl" disabled={saving}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {isEdit ? 'Salvar alterações' : 'Cadastrar site'}
        </Button>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr] gap-8">
        {/* ── Stepper lateral ─────────────────────────────────────────────────── */}
        <nav className="hidden lg:flex flex-col gap-1 sticky top-24 self-start">
          {STEPS.map(s => {
            const done = step > s.id
            const active = step === s.id
            return (
              <button
                key={s.id}
                onClick={() => setStep(s.id)}
                className={`
                  flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm transition-all
                  ${active ? 'bg-primary text-primary-foreground font-semibold shadow-sm' :
                    done ? 'text-success hover:bg-success/10' : 'text-muted hover:bg-accent/10'}
                `}
              >
                {done
                  ? <CheckCircle2 size={16} className="shrink-0" />
                  : <s.icon size={16} className="shrink-0 opacity-70" />
                }
                {s.label}
              </button>
            )
          })}
        </nav>

        {/* ── Conteúdo do passo ────────────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* PASSO 1 — Identificação */}
          {step === 1 && (
            <SectionCard title="Identificação do Site" stepNum={1}>
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <Field label="Nome do Control Site" required>
                    <Input {...register('nome')} placeholder="Ex: CS Cerrado – Minas Gerais" className="rounded-xl" />
                    {errors.nome && <p className="text-danger text-xs mt-1">{errors.nome.message}</p>}
                  </Field>
                </div>
                <Field label="Responsável / Gestor" hint="Nome da pessoa ou organização gestora">
                  <Input {...register('gestor_nome')} placeholder="Nome do responsável" className="rounded-xl" />
                </Field>
                <Field label="Tipo de Gestor">
                  <Select value={watch('gestor_tipo') ?? ''} onValueChange={v => setValue('gestor_tipo', v as any)}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="proponente">Proponente</SelectItem>
                      <SelectItem value="parceiro">Parceiro</SelectItem>
                      <SelectItem value="externo">Externo</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Status operacional">
                  <Select value={watch('status_cs') ?? 'Ativo'} onValueChange={v => setValue('status_cs', v as any)}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Em_implantacao">Em implantação</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </SectionCard>
          )}

          {/* PASSO 2 — Localização */}
          {step === 2 && (
            <SectionCard title="Localização Geográfica" stepNum={2}
              hint="Coordenadas do centroide do control site. Utilizadas no cálculo Haversine (Critério 1 ≤ 250 km).">
              <div className="grid sm:grid-cols-3 gap-5">
                <Field label="Latitude (decimal)" required>
                  <Input {...register('centroide_lat')} type="number" step="0.000001" placeholder="-15.7801" className="rounded-xl" />
                </Field>
                <Field label="Longitude (decimal)" required>
                  <Input {...register('centroide_lng')} type="number" step="0.000001" placeholder="-47.9292" className="rounded-xl" />
                </Field>
                <Field label="Área total (ha)">
                  <Input {...register('area_ha')} type="number" step="0.01" placeholder="0.00" className="rounded-xl" />
                </Field>
              </div>
              <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/10 text-xs text-muted">
                <strong className="text-foreground">Critério C1:</strong> A distância Haversine entre este centroide e o centroide de cada fazenda vinculada deve ser ≤ 250 km. Acima disto o matching falhará automaticamente.
              </div>
            </SectionCard>
          )}

          {/* PASSO 3 — Atributos Geofísicos */}
          {step === 3 && (
            <SectionCard title="Atributos Geofísicos" stepNum={3}
              hint="Critérios C2–C6: zona IPCC, ecorregião WWF, textura FAO, grupo solo WRB, declividade e aspecto cardinal.">
              <div className="grid sm:grid-cols-2 gap-5">
                <Field label="Zona Climática IPCC (C2)">
                  <Select value={watch('zona_climatica_ipcc') ?? ''} onValueChange={v => setValue('zona_climatica_ipcc', v)}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione…" /></SelectTrigger>
                    <SelectContent>
                      {['Tropical Moist', 'Tropical Dry', 'Warm Temperate Moist', 'Warm Temperate Dry',
                        'Cool Temperate Moist', 'Cool Temperate Dry', 'Boreal Moist', 'Boreal Dry'].map(z => (
                        <SelectItem key={z} value={z}>{z}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Ecorregião WWF (C3)">
                  <Input {...register('ecorregiao_wwf')} placeholder="Ex: Cerrado" className="rounded-xl" />
                </Field>
                <Field label="Textura Solo FAO 0–30 cm (C4)">
                  <Select value={watch('classe_textural_fao') ?? ''} onValueChange={v => setValue('classe_textural_fao', v)}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione…" /></SelectTrigger>
                    <SelectContent>
                      {['Sandy', 'Loamy', 'Clayey', 'Silty', 'Sandy Loam', 'Clay Loam', 'Silt Loam'].map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Grupo Solo WRB (C5)">
                  <Input {...register('grupo_solo_wrb')} placeholder="Ex: Ferralsols" className="rounded-xl" />
                </Field>
                <Field label="Classe de Declividade (C6)" hint="Determina se aspecto cardinal também é exigido">
                  <Select value={watch('classe_declividade') ?? ''} onValueChange={v => setValue('classe_declividade', v)}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nearly_level">Quase plano (0–1°)</SelectItem>
                      <SelectItem value="gently_sloping">Suave ondulado (1–3°)</SelectItem>
                      <SelectItem value="strongly_sloping">Ondulado (3–8°)</SelectItem>
                      <SelectItem value="moderately_steep">Forte ondulado (8–16°)</SelectItem>
                      <SelectItem value="steep">Montanhoso (16–30°)</SelectItem>
                      <SelectItem value="very_steep">{'Escarpado (>30°)'}</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Aspecto Cardinal (C6 — se declividade ≥ 30%)" hint="Obrigatório quando declividade ≥ moderately_steep">
                  <Select value={watch('aspecto_cardinal') ?? ''} onValueChange={v => setValue('aspecto_cardinal', v)}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione…" /></SelectTrigger>
                    <SelectContent>
                      {['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'].map(a => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </SectionCard>
          )}

          {/* PASSO 4 — Clima */}
          {step === 4 && (
            <SectionCard title="Dados Climáticos" stepNum={4}
              hint="Critério C7: precipitação média anual. A diferença entre CS e fazenda deve ser ≤ 100 mm.">
              <div className="grid sm:grid-cols-3 gap-5">
                <Field label="Precipitação média anual (mm/ano)" required hint="Utilizada no Critério C7">
                  <Input {...register('precip_media_anual_mm')} type="number" step="0.1" placeholder="1200" className="rounded-xl" />
                </Field>
                <Field label="Fonte dos dados" hint="Ex: INMET, ERA5-Land, NASA POWER">
                  <Input {...register('fonte_precip')} placeholder="INMET" className="rounded-xl" />
                </Field>
                <Field label="Distância à estação meteo (km)">
                  <Input {...register('dist_estacao_meteo_km')} type="number" step="0.1" placeholder="12.5" className="rounded-xl" />
                </Field>
              </div>
              <InfoBox>
                Hierarquia de fontes climáticas (VM0042 §5): (1) Estação INMET ≤ 50 km · (2) ERA5-Land (~9 km) · (3) NASA POWER (~55 km).
              </InfoBox>
            </SectionCard>
          )}

          {/* PASSO 5 — SOC */}
          {step === 5 && (
            <SectionCard title="SOC — Critério 8 (Teste-t Welch)" stepNum={5}
              hint="Dados laboratoriais para o teste-t bilateral α=0.10. Mínimo 3 pontos de coleta (VM0042 §6.4).">
              <div className="grid sm:grid-cols-2 gap-5">
                <Field label="SOC médio (%)" required>
                  <Input {...register('soc_medio_pct')} type="number" step="0.001" placeholder="2.450" className="rounded-xl" />
                </Field>
                <Field label="Nº de amostras (n)" required hint="Mínimo 3 para IC 90% confiável">
                  <Input {...register('n_amostras_soc')} type="number" step="1" placeholder="5" className="rounded-xl" />
                </Field>
                <Field label="IC 90% inferior" hint="Limite inferior do intervalo de confiança de 90%">
                  <Input {...register('soc_ic_lower')} type="number" step="0.001" placeholder="2.100" className="rounded-xl" />
                </Field>
                <Field label="IC 90% superior">
                  <Input {...register('soc_ic_upper')} type="number" step="0.001" placeholder="2.800" className="rounded-xl" />
                </Field>
                <Field label="Data da primeira coleta">
                  <Input {...register('data_primeira_coleta')} type="date" className="rounded-xl" />
                </Field>
              </div>
              <InfoBox>
                O motor deriva o SD a partir do IC 90%: SD = (upper − lower) / (2 × t_crit) × √n.
                O teste-t bilateral de Welch compara SOC do CS com SOC da fazenda. p-valor {'>'} 0.10 = PASS.
              </InfoBox>
            </SectionCard>
          )}

          {/* PASSO 6 — Histórico de Manejo */}
          {step === 6 && (
            <SectionCard title="Histórico de Manejo — Critério 9 (VMD0053)" stepNum={6}
              hint="5 anos de histórico com mesmas práticas que serão comparadas com o histórico da fazenda.">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-accent/5">
                    <tr>
                      <th className="text-left p-2 text-xs">Ano</th>
                      <th className="text-left p-2 text-xs">Preparo</th>
                      <th className="text-left p-2 text-xs">Grupo Funcional</th>
                      <th className="text-left p-2 text-xs">Cultura</th>
                      <th className="text-left p-2 text-xs">Resíduos</th>
                      <th className="text-left p-2 text-xs">Esterco</th>
                      <th className="text-left p-2 text-xs">Composto</th>
                      <th className="text-left p-2 text-xs">Irrigação</th>
                      <th className="p-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {historicoManejo.map((h, idx) => (
                      <tr key={idx} className="hover:bg-accent/5">
                        <td className="p-1.5">
                          <Input type="number" value={h.ano} onChange={e => {
                            const copy = [...historicoManejo]
                            copy[idx] = { ...copy[idx], ano: Number(e.target.value) }
                            setHistoricoManejo(copy)
                          }} className="w-20 rounded-lg h-7 text-xs" />
                        </td>
                        <td className="p-1.5">
                          <Select value={h.preparo_solo} onValueChange={v => {
                            const copy = [...historicoManejo]
                            copy[idx] = { ...copy[idx], preparo_solo: v as any }
                            setHistoricoManejo(copy)
                          }}>
                            <SelectTrigger className="rounded-lg h-7 text-xs w-36"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="plantio_direto">Plantio direto</SelectItem>
                              <SelectItem value="convencional">Convencional</SelectItem>
                              <SelectItem value="conservacao">Conservação</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-1.5">
                          <Select value={h.grupo_funcional} onValueChange={v => {
                            const copy = [...historicoManejo]
                            copy[idx] = { ...copy[idx], grupo_funcional: v as any }
                            setHistoricoManejo(copy)
                          }}>
                            <SelectTrigger className="rounded-lg h-7 text-xs w-40"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gramineas">Gramíneas</SelectItem>
                              <SelectItem value="leguminosas">Leguminosas</SelectItem>
                              <SelectItem value="broadleaf_nao_leguminosa">Broadleaf não-leguminosa</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-1.5">
                          <Input value={h.tipo_cultura} onChange={e => {
                            const copy = [...historicoManejo]
                            copy[idx] = { ...copy[idx], tipo_cultura: e.target.value }
                            setHistoricoManejo(copy)
                          }} placeholder="soja, milho…" className="w-28 rounded-lg h-7 text-xs" />
                        </td>
                        {(['remocao_residuos', 'esterco', 'composto', 'irrigacao'] as const).map(field => (
                          <td key={field} className="p-1.5 text-center">
                            <input type="checkbox" checked={h[field] as boolean} className="accent-primary"
                              onChange={e => {
                                const copy = [...historicoManejo]
                                copy[idx] = { ...copy[idx], [field]: e.target.checked }
                                setHistoricoManejo(copy)
                              }} />
                          </td>
                        ))}
                        <td className="p-1.5">
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-danger hover:bg-danger/10 rounded-lg"
                            onClick={() => setHistoricoManejo(prev => prev.filter((_, i) => i !== idx))}>
                            ✕
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Button variant="outline" size="sm" className="mt-3 rounded-xl gap-2"
                  onClick={() => setHistoricoManejo(prev => [...prev, novaLinhaManejo()])}>
                  + Adicionar ano
                </Button>
              </div>
              <InfoBox>
                Comparação feita para os 5 anos mais recentes em comum com a fazenda. Os campos de preparo de solo, grupo funcional, remoção de resíduos, esterco, composto e irrigação devem coincidir 100% em todos os anos para PASS.
              </InfoBox>
            </SectionCard>
          )}

          {/* PASSO 7 — Vinculação */}
          {step === 7 && (
            <SectionCard title="Vinculação a Fazendas" stepNum={7}
              hint="Selecione as fazendas que serão atendidas por este control site. O matching automático validará os 9 critérios.">
              <div className="grid sm:grid-cols-2 gap-3">
                {fazendas.map(faz => {
                  const sel = fazendasVinculadas.includes(faz.id)
                  return (
                    <button key={faz.id} type="button" onClick={() => toggleFazenda(faz.id)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${sel ? 'border-primary/40 bg-primary/5' : 'border-border/50 hover:bg-accent/10'}`}>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${sel ? 'bg-primary border-primary' : 'bg-surface border-border'}`}>
                        {sel && <CheckCircle2 size={10} className="text-white" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{faz.nome}</p>
                        <p className="text-xs text-muted">{faz.municipio}/{faz.estado}</p>
                      </div>
                    </button>
                  )
                })}
                {fazendas.length === 0 && <p className="text-sm text-muted col-span-2">Nenhuma fazenda cadastrada.</p>}
              </div>
            </SectionCard>
          )}

          {/* Navegação entre passos */}
          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" className="gap-2 rounded-xl" disabled={step === 1} onClick={() => setStep(s => s - 1)}>
              <ArrowLeft size={14} /> Anterior
            </Button>
            <div className="flex gap-1.5">
              {STEPS.map(s => (
                <button key={s.id} onClick={() => setStep(s.id)}
                  className={`h-2 rounded-full transition-all ${step === s.id ? 'w-6 bg-primary' : step > s.id ? 'w-2 bg-success' : 'w-2 bg-border'}`} />
              ))}
            </div>
            {step < totalSteps
              ? <Button className="gap-2 rounded-xl" onClick={() => setStep(s => s + 1)}>
                  Próximo <ChevronRight size={14} />
                </Button>
              : <Button onClick={handleSubmit(onSubmit)} className="gap-2 rounded-xl" disabled={saving}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {isEdit ? 'Salvar' : 'Cadastrar'}
                </Button>
            }
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Helpers de layout ────────────────────────────────────────────────────────

function SectionCard({ title, stepNum, hint, children }: {
  title: string; stepNum: number; hint?: string; children: React.ReactNode
}) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-4 border-b bg-surface/50">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">{stepNum}</span>
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            {hint && <p className="text-xs text-muted mt-0.5">{hint}</p>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">{children}</CardContent>
    </Card>
  )
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/10 text-xs text-muted">
      <strong className="text-foreground">Nota metodológica:</strong> {children}
    </div>
  )
}
