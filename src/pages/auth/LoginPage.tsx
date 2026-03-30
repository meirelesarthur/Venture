import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { Shield, Users, Leaf, ChevronRight, FlaskConical } from 'lucide-react'
import Logo from '@/assets/Logo.png'

const PROFILES = [
  {
    role: 'admin' as const,
    label: 'Admin Venture Carbon',
    description: 'Acesso total: validação de dados, motor de cálculos, gestão de parceiros e parâmetros globais.',
    icon: Shield,
    color: 'primary',
    user: { id: 'admin-1', name: 'Ana Souza', email: 'ana@venturecarbon.com.br' },
    redirect: '/admin',
    gradient: 'from-primary/10 to-primary/5',
    border: 'border-primary/30 hover:border-primary/70',
    iconBg: 'bg-primary/10 text-primary',
    badge: 'bg-primary/10 text-primary',
  },
  {
    role: 'parceiro' as const,
    label: 'Parceiro Originador',
    description: 'Indicar produtores, acompanhar status dos leads e visualizar extrato de comissões.',
    icon: Users,
    color: 'success',
    user: { id: 'parceiro-1', name: 'Carlos Ribeiro', email: 'carlos@agroconsult.com' },
    redirect: '/parceiro',
    gradient: 'from-success/10 to-success/5',
    border: 'border-success/30 hover:border-success/70',
    iconBg: 'bg-success/10 text-success',
    badge: 'bg-success/10 text-success',
  },
  {
    role: 'cliente' as const,
    label: 'Produtor / Cliente',
    description: 'Dashboard da propriedade, submissão de dados MRV, visualização de créditos gerados.',
    icon: Leaf,
    color: 'warning',
    user: { id: 'cliente-1', name: 'João da Silva', email: 'joao@fazendaboavista.com.br' },
    redirect: '/dashboard',
    gradient: 'from-warning/10 to-warning/5',
    border: 'border-warning/30 hover:border-warning/70',
    iconBg: 'bg-warning/10 text-warning',
    badge: 'bg-warning/10 text-warning',
  },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore((state) => state.setUser)
  const [loading, setLoading] = useState<string | null>(null)

  const handleLogin = (profile: typeof PROFILES[0]) => {
    setLoading(profile.role)
    setTimeout(() => {
      setUser({ ...profile.user, role: profile.role })
      navigate(profile.redirect)
    }, 500)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center mb-6">
          <img src={Logo} alt="Venture Carbon" className="h-10 w-auto object-contain" />
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning/10 border border-warning/20 mb-6">
          <FlaskConical size={14} className="text-warning" />
          <span className="text-xs font-semibold text-warning tracking-wide uppercase">Ambiente de Desenvolvimento</span>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-2">Selecione um perfil</h1>
        <p className="text-muted max-w-sm mx-auto text-sm">
          Escolha com qual perfil deseja explorar a plataforma. Nenhuma autenticação real é necessária neste momento.
        </p>
      </div>

      {/* Profile Cards */}
      <div className="w-full max-w-3xl grid sm:grid-cols-3 gap-4">
        {PROFILES.map((profile) => {
          const Icon = profile.icon
          const isLoading = loading === profile.role

          return (
            <button
              key={profile.role}
              onClick={() => handleLogin(profile)}
              disabled={loading !== null}
              className={`
                relative group text-left w-full rounded-2xl border bg-gradient-to-b ${profile.gradient} ${profile.border}
                p-6 transition-all duration-200 cursor-pointer
                hover:shadow-lg hover:-translate-y-0.5
                disabled:opacity-60 disabled:cursor-not-allowed
                focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
              `}
            >
              {/* Icon */}
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${profile.iconBg} mb-4 transition-transform group-hover:scale-110`}>
                <Icon size={22} />
              </div>

              {/* Label */}
              <div className="mb-1 flex items-center gap-2">
                <span className="font-semibold text-foreground">{profile.label}</span>
              </div>

              {/* Description */}
              <p className="text-xs text-muted leading-relaxed mb-4">{profile.description}</p>

              {/* User info */}
              <div className={`flex items-center gap-2 text-xs font-medium rounded-lg px-2.5 py-1.5 w-fit ${profile.badge}`}>
                <div className="h-4 w-4 rounded-full bg-current opacity-30" />
                {profile.user.name}
              </div>

              {/* Arrow / Loading */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {isLoading ? (
                  <div className="h-5 w-5 rounded-full border-2 border-current border-t-transparent animate-spin opacity-50" />
                ) : (
                  <ChevronRight size={18} className="text-muted opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <p className="mt-10 text-xs text-muted text-center max-w-sm">
        A autenticação real (JWT + roles) será ativada antes do deploy em produção. 
        Todos os dados exibidos são mocks para validação de interface.
      </p>
    </div>
  )
}
