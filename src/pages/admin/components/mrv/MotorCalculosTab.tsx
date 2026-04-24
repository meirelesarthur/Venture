import { useDataStore } from '@/store/data'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Send } from 'lucide-react'
import { AdminMotorTab } from '../AdminMotorTab'

interface Props {
  fazendaId: string
  anoAgricola: number
}

export function MotorCalculosTab({ fazendaId, anoAgricola }: Props) {
  const { talhoes, manejo, submitManejo } = useDataStore()
  const projetoTalhoes = talhoes.filter(t => t.fazendaId === fazendaId && t.tipo === 'projeto')

  const handleForcaValidacao = () => {
    let count = 0
    projetoTalhoes.forEach(t => {
      const m = manejo.find(
        x => x.talhaoId === t.id && x.anoAgricola === anoAgricola && x.cenario === 'projeto'
      )
      if (m && m.status !== 'aprovado') {
        submitManejo(m.id)
        count++
      }
    })
    if (count > 0) toast.success(`${count} talhão(ões) validado(s)!`)
    else toast.error('Nenhum dado de manejo pendente para validar.')
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleForcaValidacao}
          className="gap-2 rounded-xl border-teal-600 text-teal-600 hover:bg-teal-600 hover:text-white transition-colors"
        >
          <Send size={14} />
          Forçar Validação
        </Button>
      </div>
      <AdminMotorTab fazendaId={fazendaId} anoAgricola={anoAgricola} />
    </div>
  )
}
