import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, XCircle, UserCheck } from 'lucide-react'
import type { LeadStatus } from '@/store/data'

const CFG: Record<LeadStatus, { label: string; cls: string; Icon: React.ElementType | null }> = {
  novo:       { label: 'Novo',       cls: 'bg-muted/20 text-muted-foreground border-border/50', Icon: null },
  em_analise: { label: 'Em Análise', cls: 'bg-warning/10 text-warning border-warning/20',      Icon: Clock },
  aprovado:   { label: 'Aprovado',   cls: 'bg-primary/10 text-primary border-primary/20',      Icon: CheckCircle2 },
  contratado: { label: 'Contratado', cls: 'bg-success/10 text-success border-success/20',      Icon: CheckCircle2 },
  efetivado:  { label: 'Cliente',    cls: 'bg-success/10 text-success border-success/20',      Icon: UserCheck },
  recusado:   { label: 'Recusado',   cls: 'bg-danger/10 text-danger border-danger/20',         Icon: XCircle },
}

interface LeadStatusBadgeProps {
  status: LeadStatus
  motivo?: string
  className?: string
}

export function LeadStatusBadge({ status, motivo, className }: LeadStatusBadgeProps) {
  const { label, cls, Icon } = CFG[status] ?? CFG.novo
  return (
    <Badge variant="outline" className={`shadow-none flex items-center gap-1 ${cls} ${className ?? ''}`}>
      {Icon && <Icon size={11} />}
      {label}
      {motivo && <span className="ml-0.5 opacity-70" title={motivo}>ⓘ</span>}
    </Badge>
  )
}
