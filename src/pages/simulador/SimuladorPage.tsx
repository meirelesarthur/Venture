import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { simuladorSchema, type SimuladorData } from './schema'
import { useDataStore } from '@/store/data'

import { Step1Lead } from './components/Step1Lead'
import { Step2Area } from './components/Step2Area'
import { Step3Cultura } from './components/Step3Cultura'
import { Step4Praticas } from './components/Step4Praticas'
import { Step5Resultado } from './components/Step5Resultado'

const STEPS = [
  { id: 1, title: 'Seus Dados', description: 'Informações de contato' },
  { id: 2, title: 'Área', description: 'Tamanho da propriedade' },
  { id: 3, title: 'Manejo', description: 'Culturas atuais' },
  { id: 4, title: 'Práticas', description: 'Adoção regenerativa' },
  { id: 5, title: 'Resultado', description: 'Estimativa de Créditos' },
]

export default function SimuladorPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const addLead = useDataStore(state => state.addLead)

  const methods = useForm<SimuladorData>({
    // @ts-ignore
    resolver: zodResolver(simuladorSchema),
    defaultValues: {
      lead: { nome: '', email: '', telefone: '' },
      horizonte: '10',
    },
    mode: 'onChange',
  })

  const nextStep = async () => {
    let fieldsToValidate: string[] = []
    
    // Validate current step fields before proceeding
    if (currentStep === 1) fieldsToValidate = ['lead.nome', 'lead.email', 'lead.telefone']
    if (currentStep === 2) fieldsToValidate = ['area.hectares']
    if (currentStep === 3) fieldsToValidate = ['culturas']
    if (currentStep === 4) fieldsToValidate = ['praticas', 'horizonte']

    const isValid = await methods.trigger(fieldsToValidate as any)
    if (isValid) {
      if (currentStep === 4) {
        const values = methods.getValues()
        const refParam = new URLSearchParams(window.location.search).get('ref')
        addLead({
          parceiroId: refParam || undefined,
          nome: values.lead.nome,
          email: values.lead.email,
          fazenda: `Propriedade de ${values.lead.nome.split(' ')[0]}`,
          area: values.area.hectares,
          status: 'em_analise'
        })
      }
      setCurrentStep((prev) => Math.min(prev + 1, 5))
      window.scrollTo(0, 0)
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
    window.scrollTo(0, 0)
  }

  const progress = (currentStep / STEPS.length) * 100

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-4">
        <h1 className="text-3xl font-bold text-foreground">
          Simulador de Créditos de Carbono
        </h1>
        <p className="text-muted text-lg">
          Descubra o potencial de receita da sua fazenda através de práticas agrícolas regenerativas.
        </p>
        
        {/* Progress Tracker */}
        <div className="pt-4">
          <div className="flex justify-between text-sm font-medium text-muted mb-2 hidden sm:flex">
            {STEPS.map((step) => (
              <span
                key={step.id}
                className={currentStep >= step.id ? 'text-primary transition-colors' : ''}
              >
                {step.id}. {step.title}
              </span>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <Card className="shadow-lg border-border/50">
        <CardHeader className="bg-surface/50 border-b pb-6">
          <CardTitle className="text-xl text-primary">
            Passo {currentStep}: {STEPS[currentStep - 1].title}
          </CardTitle>
          <CardDescription>
            {STEPS[currentStep - 1].description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(() => nextStep())}>
              {currentStep === 1 && <Step1Lead onNext={nextStep} />}
              {currentStep === 2 && <Step2Area onNext={nextStep} onPrev={prevStep} />}
              {currentStep === 3 && <Step3Cultura onNext={nextStep} onPrev={prevStep} />}
              {currentStep === 4 && <Step4Praticas onNext={nextStep} onPrev={prevStep} />}
              {currentStep === 5 && <Step5Resultado onPrev={prevStep} />}
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  )
}
