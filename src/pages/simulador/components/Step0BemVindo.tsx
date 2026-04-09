import { Button } from '@/components/ui/button'
import { Leaf, MapPin } from 'lucide-react'

interface Props {
  onNext: () => void
}

export function Step0BemVindo({ onNext }: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 min-h-[400px]">
      <div className="flex items-center gap-2 text-primary font-heading font-bold text-xl mb-8">
        <Leaf size={24} className="text-primary" />
        Venture Carbon
      </div>
      
      <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <MapPin size={32} className="text-primary" />
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-10 max-w-[280px]">
        Calcule o potencial de ganhos da sua fazenda
      </h1>

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
