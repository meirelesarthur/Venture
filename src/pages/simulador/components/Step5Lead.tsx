import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import type { SimuladorData } from '../schema'
import { ArrowLeft, ShieldCheck, LockOpen } from 'lucide-react'

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

export function Step5Lead({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const { register, setValue, watch, formState: { errors } } = useFormContext<SimuladorData>()
  const [lgpd, setLgpd] = useState(false)
  const telefone = watch('lead.telefone') ?? ''

  const handlePhone = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('lead.telefone', maskPhone(e.target.value), { shouldValidate: true })
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">Desbloquear Relatório</h2>
        <p className="text-sm text-muted-foreground mt-1">Sua estimativa está pronta. Informe seus dados visando liberar os resultados detalhados.</p>
      </div>

      <div className="space-y-4 mb-6">
        <div className="space-y-1">
          <Label htmlFor="lead.nome">Nome Completo *</Label>
          <Input id="lead.nome" placeholder="Seu nome completo" className="h-11 rounded-xl" {...register('lead.nome')} />
          {errors.lead?.nome && <p className="text-xs text-destructive">{errors.lead.nome.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="lead.email">E-mail *</Label>
          <Input id="lead.email" type="email" placeholder="seuemail@exemplo.com" className="h-11 rounded-xl" {...register('lead.email')} />
          {errors.lead?.email && <p className="text-xs text-destructive">{errors.lead.email.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="lead.telefone">Telefone / WhatsApp *</Label>
          <Input
            id="lead.telefone"
            placeholder="(00) 00000-0000"
            className="h-11 rounded-xl"
            value={telefone}
            onChange={handlePhone}
            inputMode="tel"
          />
          {errors.lead?.telefone && <p className="text-xs text-destructive">{errors.lead.telefone.message}</p>}
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
        </label>
      </div>

      <div className="flex gap-3 mt-auto pt-6">
        <Button type="button" variant="outline" onClick={onPrev} className="rounded-xl h-12 w-20 flex-shrink-0">
          <ArrowLeft size={16} />
        </Button>
        <Button type="button" onClick={onNext} className="rounded-xl h-12 flex-1 font-semibold whitespace-nowrap" disabled={!lgpd}>
          <LockOpen size={16} className="mr-2" /> Desbloquear Resultados
        </Button>
      </div>
    </div>
  )
}
