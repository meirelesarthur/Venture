import { Button } from '@/components/ui/button'
import { MapPin, Clock } from 'lucide-react'
import Logo from '@/assets/Logo.png'

interface Props {
  onNext: () => void
}

export function Step0BemVindo({ onNext }: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 min-h-[400px]">
      <div className="flex items-center justify-center mb-6">
        <img src={Logo} alt="Venture Carbon" className="h-10 object-contain" />
      </div>
      
      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <MapPin size={28} className="text-primary" />
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-4 max-w-[280px]">
        Calcule quanto sua fazenda pode receber com Carbono
      </h1>

      <div className="flex items-center gap-1.5 text-sm text-primary font-medium bg-primary/10 px-3 py-1.5 rounded-full mb-8">
        <Clock size={16} /> A análise leva menos de 5 minutos
      </div>

      <Button
        className="w-full text-base font-semibold py-6 rounded-xl hover:scale-[1.02] transition-transform"
        onClick={onNext}
      >
        Começar →
      </Button>

      <p className="text-xs text-muted-foreground mt-6 max-w-[240px]">
        Os valores projetados são apenas estimativas e não são garantidos.
      </p>
    </div>
  )
}
