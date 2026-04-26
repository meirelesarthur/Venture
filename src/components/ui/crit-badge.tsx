import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle } from 'lucide-react'

interface CritBadgeProps {
  pass: boolean | 'pendente'
}

export function CritBadge({ pass }: CritBadgeProps) {
  if (pass === 'pendente')
    return <Badge className="bg-warning/10 text-warning border-warning/20 text-[10px] shadow-none">Pendente</Badge>
  if (pass)
    return <Badge className="bg-success/10 text-success border-success/20 text-[10px] shadow-none"><CheckCircle2 size={10} className="mr-0.5" />PASS</Badge>
  return <Badge className="bg-danger/10 text-danger border-danger/20 text-[10px] shadow-none"><XCircle size={10} className="mr-0.5" />FAIL</Badge>
}
