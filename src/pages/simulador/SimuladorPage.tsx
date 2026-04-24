import { useState } from 'react'
import FarmImage from '@/assets/farm.jpeg'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { simuladorSchema, type SimuladorData } from './schema'
import { useDataStore } from '@/store/data'

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

export default function SimuladorPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [mapCenter, setMapCenter] = useState<[number, number]>([-15.7801, -47.9292])
  const [mapZoom, setMapZoom] = useState(4)
  const [mapGeoJson, setMapGeoJson] = useState<any>(null)
  const [isMapEditMode, setIsMapEditMode] = useState(false)

  const addLead = useDataStore(state => state.addLead)

  const methods = useForm<SimuladorData>({
    // @ts-ignore
    resolver: zodResolver(simuladorSchema),
    defaultValues: {
      localizacao: { fazenda: '', estado: '', municipio: '' },
      lead: { nome: '', email: '', telefone: '' },
      horizonte: '10',
      culturas: [],
      praticas: [],
    },
    mode: 'onChange',
  })

  const nextStep = async () => {
    let fieldsToValidate: string[] = []

    if (currentStep === 1) fieldsToValidate = ['localizacao.fazenda', 'localizacao.estado', 'localizacao.municipio']
    if (currentStep === 2) fieldsToValidate = ['area.hectares']
    if (currentStep === 4) fieldsToValidate = ['horizonte']
    if (currentStep === 5) fieldsToValidate = ['lead.nome', 'lead.email', 'lead.telefone']

    if (fieldsToValidate.length > 0) {
      const isValid = await methods.trigger(fieldsToValidate as any)
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
    }

    setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS))
  }

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0))

  const handleLocationSelect = (coord: [number, number]) => {
    setMapCenter(coord)
    setMapZoom(7)
  }

  const handleGeoJsonSelect = (geojson: any) => {
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
            geojson={mapGeoJson}
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
