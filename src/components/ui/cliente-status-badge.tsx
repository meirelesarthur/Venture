import { Badge } from '@/components/ui/badge'

const MAP: Record<string, string> = {
  'Auditoria Aprovada': 'bg-success/10 text-success border-success/20',
  'Em Validação':       'bg-primary/10 text-primary border-primary/20',
  'Em submissão':       'bg-warning/10 text-warning border-warning/20',
  'Aberto':             'bg-muted/20 text-muted-foreground border-border/50',
  'N/A':                'bg-muted/20 text-muted-foreground border-border/50',
}

interface ClienteStatusBadgeProps {
  status: string
  className?: string
}

export function ClienteStatusBadge({ status, className }: ClienteStatusBadgeProps) {
  const cls = MAP[status] ?? 'bg-muted/20 text-muted-foreground'
  return (
    <Badge variant="outline" className={`shadow-none text-xs ${cls} ${className ?? ''}`}>
      {status}
    </Badge>
  )
}
