import type { UseFormRegister, UseFormWatch, UseFormSetValue, FieldErrors } from 'react-hook-form'
import type { HistoricoManejoAnual } from '@/store/data'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'

// ─── Schema + type (re-exported for use in parent) ───────────────────────────

export const controlSiteSchema = z.object({
  nome: z.string().min(3, 'Nome obrigatório'),
  gestor_nome: z.string().optional(),
  gestor_tipo: z.enum(['proponente', 'parceiro', 'externo']).optional(),
  status_cs: z.enum(['Ativo', 'Em_implantacao', 'Inativo']).default('Ativo'),
  centroide_lat: z.coerce.number().optional(),
  centroide_lng: z.coerce.number().optional(),
  area_ha: z.coerce.number().positive().optional(),
  zona_climatica_ipcc: z.string().optional(),
  ecorregiao_wwf: z.string().optional(),
  classe_textural_fao: z.string().optional(),
  grupo_solo_wrb: z.string().optional(),
  classe_declividade: z.string().optional(),
  aspecto_cardinal: z.string().optional(),
  precip_media_anual_mm: z.coerce.number().optional(),
  fonte_precip: z.string().optional(),
  dist_estacao_meteo_km: z.coerce.number().optional(),
  soc_medio_pct: z.coerce.number().optional(),
  soc_ic_lower: z.coerce.number().optional(),
  soc_ic_upper: z.coerce.number().optional(),
  n_amostras_soc: z.coerce.number().int().optional(),
  data_primeira_coleta: z.string().optional(),
})

export type FormData = z.infer<typeof controlSiteSchema>

// ─── Shared prop type ────────────────────────────────────────────────────────

export type StepFormProps = {
  register: UseFormRegister<FormData>
  watch: UseFormWatch<FormData>
  setValue: UseFormSetValue<FormData>
  errors: FieldErrors<FormData>
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

export function SectionCard({ title, stepNum, hint, children }: {
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

export function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/10 text-xs text-muted">
      <strong className="text-foreground">Nota metodológica:</strong> {children}
    </div>
  )
}

export function Field({ label, hint, required, children }: {
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

// ─── Step panels ──────────────────────────────────────────────────────────────

export function Step1Panel({ register, watch, setValue, errors }: StepFormProps) {
  return (
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
          <Select value={watch('gestor_tipo') ?? ''} onValueChange={v => setValue('gestor_tipo', v as 'proponente' | 'parceiro' | 'externo')}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione…" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="proponente">Proponente</SelectItem>
              <SelectItem value="parceiro">Parceiro</SelectItem>
              <SelectItem value="externo">Externo</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Status operacional">
          <Select value={watch('status_cs') ?? 'Ativo'} onValueChange={v => setValue('status_cs', v as 'Ativo' | 'Em_implantacao' | 'Inativo')}>
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
  )
}

export function Step2Panel({ register }: Pick<StepFormProps, 'register'>) {
  return (
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
        <strong className="text-foreground">Critério C1:</strong> A distância Haversine entre este centroide e o centroide de cada fazenda vinculada deve ser ≤ 250 km.
      </div>
    </SectionCard>
  )
}

export function Step3Panel({ register, watch, setValue }: Omit<StepFormProps, 'errors'>) {
  return (
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
  )
}

export function Step4Panel({ register }: Pick<StepFormProps, 'register'>) {
  return (
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
  )
}

export function Step5Panel({ register }: Pick<StepFormProps, 'register'>) {
  return (
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
  )
}

interface Step6Props {
  historicoManejo: HistoricoManejoAnual[]
  setHistoricoManejo: React.Dispatch<React.SetStateAction<HistoricoManejoAnual[]>>
  novaLinhaManejo: () => HistoricoManejoAnual
}

export function Step6Panel({ historicoManejo, setHistoricoManejo, novaLinhaManejo }: Step6Props) {
  return (
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
                    copy[idx] = { ...copy[idx], preparo_solo: v as 'plantio_direto' | 'convencional' | 'conservacao' }
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
                    copy[idx] = { ...copy[idx], grupo_funcional: v as 'gramineas' | 'leguminosas' | 'broadleaf_nao_leguminosa' }
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
  )
}

interface Step7Props {
  fazendas: { id: string; nome: string; municipio: string; estado: string }[]
  fazendasVinculadas: string[]
  toggleFazenda: (fazId: string) => void
}

export function Step7Panel({ fazendas, fazendasVinculadas, toggleFazenda }: Step7Props) {
  return (
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
  )
}
