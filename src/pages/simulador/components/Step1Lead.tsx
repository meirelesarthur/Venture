import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import type { SimuladorData } from '../schema'
import { ArrowRight, ShieldCheck } from 'lucide-react'

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})/, '($1) ')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }
  return digits
    .replace(/^(\d{2})/, '($1) ')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

export function Step1Lead({ onNext }: { onNext: () => void }) {
  const { register, setValue, watch, formState: { errors } } = useFormContext<SimuladorData>()
  const [lgpd, setLgpd] = useState(false)
  const telefone = watch('lead.telefone') ?? ''

  const handlePhone = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('lead.telefone', maskPhone(e.target.value), { shouldValidate: true })
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="lead.nome">Nome Completo *</Label>
          <Input id="lead.nome" placeholder="Seu nome completo" {...register('lead.nome')} />
          {errors.lead?.nome && <p className="text-sm text-destructive">{errors.lead.nome.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lead.email">E-mail *</Label>
          <Input id="lead.email" type="email" placeholder="seuemail@exemplo.com" {...register('lead.email')} />
          {errors.lead?.email && <p className="text-sm text-destructive">{errors.lead.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lead.telefone">Telefone / WhatsApp *</Label>
          <Input
            id="lead.telefone"
            placeholder="(00) 00000-0000"
            value={telefone}
            onChange={handlePhone}
            inputMode="tel"
          />
          {errors.lead?.telefone && <p className="text-sm text-destructive">{errors.lead.telefone.message}</p>}
        </div>
      </div>

      {/* LGPD consent */}
      <div className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${lgpd ? 'border-primary/30 bg-primary/5' : 'border-border/60 bg-muted/5'}`}>
        <Checkbox
          id="lgpd"
          checked={lgpd}
          onCheckedChange={(v) => setLgpd(!!v)}
          className="mt-0.5 flex-shrink-0"
        />
        <label htmlFor="lgpd" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
          <ShieldCheck size={13} className="inline mr-1 text-primary" />
          Concordo com o tratamento dos meus dados pessoais pela Venture Carbon para fins de simulação e contato comercial, conforme a{' '}
          <span className="text-primary font-medium">Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018)</span>.
          Meus dados não serão compartilhados com terceiros sem meu consentimento.
        </label>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="button" onClick={onNext} className="gap-2" disabled={!lgpd}>
          Começar Simulação <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  )
}
