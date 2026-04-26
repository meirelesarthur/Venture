import { Badge } from '@/components/ui/badge'
import { Clock, Lock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MrvStatus } from '@/store/data'

const CFG: Record<Exclude<MrvStatus, 'rascunho'>, { label: string; cls: string; Icon: React.ElementType }> = {
  pendente: { label: 'Em Validação', cls: 'bg-warning/10 text-warning border-warning/20',  Icon: Clock },
  aprovado: { label: 'Aprovado',     cls: 'bg-success/10 text-success border-success/20',  Icon: Lock },
  correcao: { label: 'Correção',     cls: 'bg-danger/10 text-danger border-danger/20',     Icon: AlertCircle },
}

interface MrvStatusBadgeProps {
  status: MrvStatus
  showIcon?: boolean
  className?: string
}

export function MrvStatusBadge({ status, showIcon = true, className }: MrvStatusBadgeProps) {
  if (status === 'rascunho') return null
  const { label, cls, Icon } = CFG[status]
  return (
    <Badge
      variant="outline"
      className={cn('flex items-center gap-1 text-xs shadow-none', cls, className)}
    >
      {showIcon && <Icon size={11} />}
      {label}
    </Badge>
  )
}
