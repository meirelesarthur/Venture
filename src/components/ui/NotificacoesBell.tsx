import { useState } from 'react'
import { useDataStore } from '@/store/data'
import { useAuthStore } from '@/store/auth'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Notificacao } from '@/store/data'

export default function NotificacoesBell() {
  const { notificacoes, marcarLida, marcarTodasLidas } = useDataStore()
  const { user } = useAuthStore()
  const [open, setOpen] = useState(false)

  const role = (user?.role ?? 'admin') as Notificacao['para']
  const minhas = notificacoes.filter(n => n.para === role)
  const naoLidas = minhas.filter(n => !n.lida).length

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative rounded-full"
        onClick={() => setOpen(o => !o)}
        aria-label="Notificações"
      >
        <Bell size={18} />
        {naoLidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 text-[10px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 bottom-0 z-50 w-80 bg-surface border border-border/50 rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-surface/80">
              <p className="text-sm font-semibold">Notificações</p>
              {naoLidas > 0 && (
                <button
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                  onClick={() => marcarTodasLidas(role)}
                >
                  <CheckCheck size={12} /> Marcar todas lidas
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-border/30">
              {minhas.length === 0 && (
                <div className="py-8 text-center text-sm text-muted">Nenhuma notificação.</div>
              )}
              {minhas.slice(0, 10).map(n => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer hover:bg-accent/5 ${!n.lida ? 'bg-primary/5' : ''}`}
                  onClick={() => marcarLida(n.id)}
                >
                  <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${!n.lida ? 'bg-primary' : 'bg-transparent'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-snug ${!n.lida ? 'text-foreground font-medium' : 'text-muted'}`}>{n.texto}</p>
                    <p className="text-[10px] text-muted mt-1">
                      {new Date(n.criadaEm).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {!n.lida && (
                    <button className="shrink-0" onClick={e => { e.stopPropagation(); marcarLida(n.id) }}>
                      <Check size={13} className="text-primary" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
