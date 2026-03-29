import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { SimuladorData } from '../schema'
import { ArrowRight } from 'lucide-react'

export function Step1Lead({ onNext }: { onNext: () => void }) {
  const { register, formState: { errors } } = useFormContext<SimuladorData>()

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="lead.nome">Nome Completo</Label>
          <Input id="lead.nome" placeholder="Seu nome" {...register('lead.nome')} />
          {errors.lead?.nome && <p className="text-sm text-destructive">{errors.lead.nome.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lead.email">E-mail</Label>
          <Input id="lead.email" type="email" placeholder="seuemail@exemplo.com" {...register('lead.email')} />
          {errors.lead?.email && <p className="text-sm text-destructive">{errors.lead.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lead.telefone">Telefone / WhatsApp</Label>
          <Input id="lead.telefone" placeholder="(00) 00000-0000" {...register('lead.telefone')} />
          {errors.lead?.telefone && <p className="text-sm text-destructive">{errors.lead.telefone.message}</p>}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="button" onClick={onNext} className="gap-2">
          Próximo <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  )
}
