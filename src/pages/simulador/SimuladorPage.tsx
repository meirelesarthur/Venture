import { useState, useMemo, useEffect } from 'react'
import FarmImage from '@/assets/farm.jpeg'
import { FormProvider, useForm, useFormContext } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { simuladorSchema, type SimuladorData, type CulturaSimulador } from './schema'
import type { FieldPath } from 'react-hook-form'
import { useDataStore } from '@/store/data'
import { TrendingUp } from 'lucide-react'
import { PRATICA_PARAM, CULTURA_BONUS, BUFFER_POOL, SOC_FATOR_FALLBACK, PRATICA_SECUNDARIA_MULT, CULTURA_BONUS_MULT, FC_MINIMO, CUSTO_OP_BRL_HA, PREMIO_VALUATION, PTAX_FALLBACK } from '@/constants/simulador'
import type { FeatureCollection } from 'geojson'

const SESSION_KEY = 'simulador_draft'

function TickerEstimativa() {
  const { watch } = useFormContext<SimuladorData>()
  const { parametros } = useDataStore()
  const area = watch('area.hectares')
  const praticas = watch('praticas') ?? []
  const culturas = watch('culturas') ?? []
  const horizonte = parseInt(watch('horizonte') || '10', 10)

  const estimativa = useMemo(() => {
    if (!area || area <= 0) return null
    const getParam = (k: string) => parametros.find(p => p.chave === k)?.valor ?? 0
    const ptax  = getParam('ptax_fallback') || PTAX_FALLBACK
    const preco = getParam('preco_base_usd') || 20
    const preco_brl = preco * ptax

    const vals = praticas.map(p => getParam(PRATICA_PARAM[p] || '') || SOC_FATOR_FALLBACK).sort((a, b) => b - a)
    let fC = vals.length > 0 ? vals[0] + PRATICA_SECUNDARIA_MULT * vals.slice(1).reduce((s, v) => s + v, 0) : 0
    const bonusCulturas = culturas.reduce((acc: number, c: CulturaSimulador) => acc + (CULTURA_BONUS[c.tipo_preparo || 'convencional'] || 0), 0)
    fC = fC + bonusCulturas * CULTURA_BONUS_MULT

    const tco2e = area * Math.max(fC, FC_MINIMO)
    const rec_carbono = tco2e * preco_brl * (1 - BUFFER_POOL)
    const lucro = rec_carbono + rec_carbono * PREMIO_VALUATION - area * CUSTO_OP_BRL_HA
    return Math.round(lucro * horizonte)
  }, [area, praticas, culturas, horizonte, parametros])

  if (!estimativa || estimativa <= 0) return null

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-success/10 border-b border-success/20 text-success text-xs font-semibold">
      <TrendingUp size={13} />
      <span>Estimativa atual: <strong>{estimativa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</strong> em {horizonte} anos</span>
    </div>
  )
}

import { SimuladorMap } from './components/SimuladorMap'
import { Step0BemVindo } from './components/Step0BemVindo'
import { Step1Localizacao } from './components/Step1Localizacao'
import { Step2Area } from './components/Step2Area'
import { Step3Cultura } from './components/Step3Cultura'
import { Step4Praticas } from './components/Step4Praticas'
import { Step5Lead } from './components/Step5Lead'
import { Step6Resultado } from './components/Step6Resultado'

// Fluxo: 0-BemVindo | 1-Localização | 2-Área (KML/mapa) | 3-Culturas | 4-Práticas | 5-Lead | 6-Resultado
const TOTAL_STEPS = 6

function getSessionDraft() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null') } catch { return null }
}

export default function SimuladorPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [mapCenter, setMapCenter] = useState<[number, number]>([-15.7801, -47.9292])
  const [mapZoom, setMapZoom] = useState(4)
  const [mapGeoJson, setMapGeoJson] = useState<FeatureCollection | null>(null)
  const [isMapEditMode, setIsMapEditMode] = useState(false)

  const addLead = useDataStore(state => state.addLead)

  const draft = getSessionDraft()
  const methods = useForm<SimuladorData>({
    resolver: zodResolver(simuladorSchema) as any,
    defaultValues: draft ?? {
      localizacao: { fazenda: '', estado: '', municipio: '' },
      lead: { nome: '', email: '', telefone: '' },
      horizonte: '10',
      culturas: [],
      praticas: [],
    },
    mode: 'onChange',
  })

  useEffect(() => {
    const sub = methods.watch(values => {
      try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(values)) } catch {}
    })
    return () => sub.unsubscribe()
  }, [methods])

  const nextStep = async () => {
    let fieldsToValidate: string[] = []

    if (currentStep === 1) fieldsToValidate = ['localizacao.fazenda', 'localizacao.estado', 'localizacao.municipio']
    if (currentStep === 2) fieldsToValidate = ['area.hectares']
    if (currentStep === 4) fieldsToValidate = ['horizonte']
    if (currentStep === 5) fieldsToValidate = ['lead.nome', 'lead.email', 'lead.telefone']

    if (fieldsToValidate.length > 0) {
      const isValid = await methods.trigger(fieldsToValidate as FieldPath<SimuladorData>[])
      if (!isValid) return
    }

    if (currentStep === 5) {
      const values = methods.getValues()
      const refParam = new URLSearchParams(window.location.search).get('ref')
      addLead({
        parceiroId: refParam || undefined,
        nome: values.lead.nome,
        email: values.lead.email,
        fazenda: values.localizacao?.fazenda || `Propriedade de ${values.lead.nome.split(' ')[0]}`,
        area: values.area.hectares,
        status: 'em_analise',
      })
      try { sessionStorage.removeItem(SESSION_KEY) } catch {}
    }

    setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS))
  }

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0))

  const handleLocationSelect = (coord: [number, number]) => {
    setMapCenter(coord)
    setMapZoom(7)
  }

  const handleGeoJsonSelect = (geojson: FeatureCollection) => {
    setMapGeoJson(geojson)
  }

  const handleMapMove = (center: [number, number], zoom: number) => {
    setMapCenter(center)
    setMapZoom(zoom)
  }

  const showMap = currentStep >= 1
  const isSidebarLayout = currentStep >= 2

  return (
    <div className="h-screen w-full relative overflow-hidden bg-black">
      {/* Background */}
      {!showMap && (
        <div
          className="absolute inset-0 z-0 bg-cover bg-center transition-opacity duration-1000"
          style={{ backgroundImage: `url(${FarmImage})`, opacity: 0.6 }}
        />
      )}
      {showMap && (
        <div className="absolute inset-0 z-0 animate-in fade-in duration-1000">
          <SimuladorMap
            center={mapCenter}
            zoom={mapZoom}
            geojson={mapGeoJson ?? undefined}
            onMove={handleMapMove}
          />
        </div>
      )}

      {/* Progress bar - visible from step 1+ */}
      {currentStep > 0 && currentStep < TOTAL_STEPS && (
        <div className="absolute top-0 left-0 right-0 z-20 h-1 bg-black/20">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      )}

      {/* Form Panel */}
      <FormProvider {...methods}>
        <div
          className={`absolute transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] bg-background z-10 shadow-2xl overflow-hidden max-h-[calc(100vh-2rem)] flex flex-col
            ${isMapEditMode ? '-translate-x-[120%]' : ''}
            ${isSidebarLayout
              ? 'left-0 sm:left-4 top-0 sm:top-4 bottom-0 sm:bottom-auto w-full sm:w-[400px] h-full sm:h-auto sm:rounded-2xl'
              : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md rounded-2xl'
            }
          `}
        >
          {currentStep >= 2 && currentStep < 6 && <TickerEstimativa />}
          <div className="flex-1 overflow-auto custom-scrollbar flex flex-col pt-0 pb-0">
            {currentStep === 0 && <Step0BemVindo onNext={nextStep} />}
            {currentStep === 1 && <Step1Localizacao onNext={nextStep} onLocationSelect={handleLocationSelect} />}
            {currentStep === 2 && (
              <Step2Area
                onNext={nextStep}
                onPrev={prevStep}
                onMapEditToggle={active => setIsMapEditMode(active)}
                onLocationSelect={handleLocationSelect}
                onGeoJsonSelect={handleGeoJsonSelect}
              />
            )}
            {currentStep === 3 && <Step3Cultura onNext={nextStep} onPrev={prevStep} />}
            {currentStep === 4 && <Step4Praticas onNext={nextStep} onPrev={prevStep} />}
            {currentStep === 5 && <Step5Lead onNext={nextStep} onPrev={prevStep} />}
            {currentStep === 6 && <Step6Resultado onPrev={prevStep} />}
          </div>
        </div>
      </FormProvider>
    </div>
  )
}
