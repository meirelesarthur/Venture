import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'sonner'
import { ArrowLeft, ChevronRight, Save, MapPin, Cloud, FlaskConical, Leaf, Link2, User, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDataStore } from '@/store/data'
import type { HistoricoManejoAnual } from '@/store/data'
import {
  controlSiteSchema, type FormData,
  Step1Panel, Step2Panel, Step3Panel, Step4Panel, Step5Panel, Step6Panel, Step7Panel,
} from './components/control-site/ControlSiteSteps'

const STEPS = [
  { id: 1, label: 'Identificação', icon: User },
  { id: 2, label: 'Localização',   icon: MapPin },
  { id: 3, label: 'Geofísico',     icon: FlaskConical },
  { id: 4, label: 'Clima',         icon: Cloud },
  { id: 5, label: 'SOC',           icon: FlaskConical },
  { id: 6, label: 'Manejo',        icon: Leaf },
  { id: 7, label: 'Vínculos',      icon: Link2 },
]

export default function AdminControlSiteForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id && id !== 'novo')

  const { controlSites, addControlSite, updateControlSite, fazendas } = useDataStore()

  const existing = isEdit ? controlSites.find(cs => cs.id === id) : undefined
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  const [historicoManejo, setHistoricoManejo] = useState<HistoricoManejoAnual[]>(
    existing?.historico_manejo ?? []
  )
  const [fazendasVinculadas, setFazendasVinculadas] = useState<string[]>(
    existing?.fazendasVinculadasIds ?? []
  )

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(controlSiteSchema),
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
    const payload = { ...data, historico_manejo: historicoManejo, fazendasVinculadasIds: fazendasVinculadas }
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

  const toggleFazenda = (fazId: string) =>
    setFazendasVinculadas(prev => prev.includes(fazId) ? prev.filter(f => f !== fazId) : [...prev, fazId])

  const stepProps = { register, watch, setValue, errors }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isEdit ? (existing?.nome ?? 'Editar Site') : 'Novo Control Site'}
            </h1>
            <p className="text-sm text-muted">VM0042 v2.2 · Passo {step}/{STEPS.length}</p>
          </div>
        </div>
        <Button onClick={handleSubmit(onSubmit)} className="gap-2 rounded-xl" disabled={saving}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {isEdit ? 'Salvar alterações' : 'Cadastrar site'}
        </Button>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr] gap-8">
        {/* Stepper lateral */}
        <nav className="hidden lg:flex flex-col gap-1 sticky top-24 self-start">
          {STEPS.map(s => {
            const done = step > s.id
            const active = step === s.id
            return (
              <button key={s.id} onClick={() => setStep(s.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm transition-all ${
                  active ? 'bg-primary text-primary-foreground font-semibold shadow-sm' :
                  done ? 'text-success hover:bg-success/10' : 'text-muted hover:bg-accent/10'}`}>
                {done ? <CheckCircle2 size={16} className="shrink-0" /> : <s.icon size={16} className="shrink-0 opacity-70" />}
                {s.label}
              </button>
            )
          })}
        </nav>

        {/* Conteúdo do passo */}
        <div className="space-y-6">
          {step === 1 && <Step1Panel {...stepProps} />}
          {step === 2 && <Step2Panel register={register} />}
          {step === 3 && <Step3Panel register={register} watch={watch} setValue={setValue} />}
          {step === 4 && <Step4Panel register={register} />}
          {step === 5 && <Step5Panel register={register} />}
          {step === 6 && <Step6Panel historicoManejo={historicoManejo} setHistoricoManejo={setHistoricoManejo} novaLinhaManejo={novaLinhaManejo} />}
          {step === 7 && <Step7Panel fazendas={fazendas} fazendasVinculadas={fazendasVinculadas} toggleFazenda={toggleFazenda} />}

          {/* Navegação */}
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
            {step < STEPS.length
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
