import { useState } from 'react'
import { useDataStore } from '@/store/data'
import { AlertCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdminAlertsBell() {
  const { alertas, resolverAlerta } = useDataStore()
  const [open, setOpen] = useState(false)

  // Apenas alertas não resolvidos contam para o badge, mas mostramos todos no modal se desejar (aqui mostraremos apenas os abertos)
  const pendentes = alertas.filter(a => !a.resolvido)

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative rounded-full hover:bg-warning/10 text-warning"
        onClick={() => setOpen(o => !o)}
        aria-label="Alertas do Sistema"
      >
        <AlertCircle size={18} />
        {pendentes.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 text-[10px] font-bold bg-warning text-warning-foreground rounded-full flex items-center justify-center">
            {pendentes.length > 9 ? '9+' : pendentes.length}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-10 z-50 w-80 bg-surface border border-warning/30 rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-warning/20 bg-warning/5">
              <p className="text-sm font-semibold text-warning">Alertas de Sistema</p>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-border/30">
              {pendentes.length === 0 && (
                <div className="py-8 text-center text-sm text-muted">Nenhum alerta pendente.</div>
              )}
              {pendentes.map(a => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 px-4 py-3 transition-colors bg-warning/5"
                >
                  <AlertCircle size={14} className="text-warning shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-snug text-foreground font-medium">{a.texto}</p>
                    <p className="text-[10px] text-muted mt-1">
                      {new Date(a.criadoEm).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button
                    className="shrink-0 text-muted p-1 hover:text-success transition-colors rounded-md hover:bg-success/10"
                    onClick={() => resolverAlerta(a.id)}
                    title="Resolver Alerta"
                  >
                    <Check size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
