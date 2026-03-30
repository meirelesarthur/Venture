import { type ReactNode, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import NotificacoesBell from '@/components/ui/NotificacoesBell'
import {
  LayoutDashboard,
  Map,
  FileBarChart,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Shield,
  ChevronDown,
  FlaskConical,
} from 'lucide-react'
import Logo from '@/assets/Logo.png'

interface NavItem {
  label: string
  href: string
  icon: ReactNode
}

const navByRole: Record<string, NavItem[]> = {
  cliente: [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'Finanças', href: '/dashboard/resultados', icon: <FileBarChart size={18} /> },
  ],
  parceiro: [
    { label: 'Dashboard', href: '/parceiro', icon: <LayoutDashboard size={18} /> },
    { label: 'Novo Lead', href: '/parceiro/leads/novo', icon: <Users size={18} /> },
    { label: 'Meus Leads', href: '/parceiro/leads', icon: <ChevronRight size={18} /> },
    { label: 'Comissões', href: '/parceiro/comissoes', icon: <FileBarChart size={18} /> },
    { label: 'Ranking', href: '/parceiro/ranking', icon: <Shield size={18} /> },
  ],
  admin: [
    { label: 'Painel', href: '/admin', icon: <LayoutDashboard size={18} /> },
    { label: 'Clientes', href: '/admin/clientes', icon: <Users size={18} /> },
    { label: 'Leads', href: '/admin/leads', icon: <ChevronRight size={18} /> },
    { label: 'Parceiros', href: '/admin/parceiros', icon: <Users size={18} /> },
    { label: 'Fazendas', href: '/admin/fazendas', icon: <Map size={18} /> },
    { label: 'Validação MRV', href: '/admin/validacao', icon: <ChevronRight size={18} /> },
    { label: 'Control Sites', href: '/admin/control-sites', icon: <Map size={18} /> },
    { label: 'Parâmetros', href: '/admin/parametros', icon: <Settings size={18} /> },
    { label: 'Acessos', href: '/admin/usuarios', icon: <Shield size={18} /> },
  ],
}

const DEV_PROFILES = [
  {
    role: 'admin' as const,
    name: 'Ana Souza',
    email: 'ana@venturecarbon.com.br',
    id: 'admin-1',
    redirect: '/admin',
    label: 'Admin',
    color: 'text-primary',
    dot: 'bg-primary',
  },
  {
    role: 'parceiro' as const,
    name: 'Carlos Ribeiro',
    email: 'carlos@agroconsult.com',
    id: 'parceiro-1',
    redirect: '/parceiro',
    label: 'Parceiro',
    color: 'text-success',
    dot: 'bg-success',
  },
  {
    role: 'cliente' as const,
    name: 'João da Silva',
    email: 'joao@fazendaboavista.com.br',
    id: 'cliente-1',
    redirect: '/dashboard',
    label: 'Cliente',
    color: 'text-warning',
    dot: 'bg-warning',
  },
]

export function AuthLayout({ children }: { children: ReactNode }) {
  const { user, logout, setUser } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const navigate = useNavigate()

  const role = user?.role ?? 'cliente'
  const items = navByRole[role] ?? []
  const currentProfile = DEV_PROFILES.find((p) => p.role === role)

  const switchProfile = (profile: (typeof DEV_PROFILES)[0]) => {
    setUser({ id: profile.id, name: profile.name, email: profile.email, role: profile.role })
    setSwitcherOpen(false)
    navigate(profile.redirect)
  }

  return (
    <div className="flex bg-background h-screen overflow-hidden">
      {/* ── Sidebar (Admin / Parceiro only) ─────────────────────────── */}
      {role !== 'cliente' && (
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-surface shadow-soft transition-transform duration-300 lg:static lg:translate-x-0 m-4 rounded-3xl ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 border-b px-6">
            <img src={Logo} alt="Venture Carbon" className="h-8 w-auto object-contain" />
            <span className="text-lg font-semibold text-foreground tracking-tight">Venture Carbon</span>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-2 p-4">
            {items.map((item) => {
              const isActive =
                window.location.pathname === item.href ||
                (item.href !== '/dashboard' && window.location.pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 btn-micro hover:bg-accent/5 hover:text-accent ${
                    isActive ? 'bg-accent/10 text-accent font-semibold' : 'text-muted-foreground'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <Separator />

          {/* User info + Logout */}
          <div className="p-4">
            <div className="mb-4 flex items-center gap-3 rounded-xl bg-background/50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">
                {user?.name?.charAt(0) ?? 'U'}
              </div>
              <div className="flex-1 truncate">
                <p className="truncate text-sm font-semibold text-foreground">{user?.name ?? 'Usuário'}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email ?? ''}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-xl btn-micro"
              onClick={() => { logout(); navigate('/login') }}
            >
              <LogOut size={16} />
              Sair
            </Button>
          </div>
        </aside>
      )}

      {/* Mobile overlay */}
      {sidebarOpen && role !== 'cliente' && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main area ───────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 bg-surface px-4 sm:px-8 shadow-md border border-border/40 mx-4 mt-3 rounded-bl-2xl rounded-br-2xl">
          <div className="flex items-center gap-4">
            {role !== 'cliente' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
            )}
            <div className="flex items-center gap-3">
              <img src={Logo} alt="Venture Carbon" className="h-8 w-auto object-contain" />
              <span className="text-lg font-bold text-foreground tracking-tight">Venture Carbon</span>
            </div>
          </div>

          {/* Top nav (Cliente only) */}
          {role === 'cliente' && (
            <nav className="hidden md:flex flex-1 items-center justify-center gap-2 mx-4">
              {items.map((item) => {
                const isActive =
                  window.location.pathname === item.href ||
                  (item.href !== '/dashboard' && window.location.pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/5 text-primary'
                        : 'text-muted-foreground hover:bg-accent/5 hover:text-foreground'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          )}

          {/* Right: Notificações + DEV switcher + avatar */}
          <div className="flex items-center gap-3">
            {/* Notificações */}
            <NotificacoesBell />
            {/* DEV profile switcher */}
            <div className="relative">
              <button
                onClick={() => setSwitcherOpen(!switcherOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning/10 border border-warning/20 text-xs font-semibold text-warning hover:bg-warning/20 transition-colors"
              >
                <FlaskConical size={13} />
                <span className="hidden sm:inline">{currentProfile?.label ?? role}</span>
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-200 ${switcherOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {switcherOpen && (
                <>
                  {/* Backdrop */}
                  <div className="fixed inset-0 z-40" onClick={() => setSwitcherOpen(false)} />
                  {/* Dropdown */}
                  <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-xl bg-surface border border-border/50 shadow-lg overflow-hidden">
                    <div className="px-3 py-2.5 border-b border-border/50">
                      <p className="text-xs font-semibold text-muted uppercase tracking-wider">Trocar perfil (DEV)</p>
                    </div>
                    {DEV_PROFILES.map((profile) => (
                      <button
                        key={profile.role}
                        onClick={() => switchProfile(profile)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-accent/5 transition-colors ${
                          profile.role === role ? 'bg-accent/10' : ''
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full flex-shrink-0 ${profile.dot}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${profile.color}`}>{profile.label}</p>
                          <p className="text-xs text-muted truncate">{profile.name}</p>
                        </div>
                        {profile.role === role && (
                          <span className="text-xs text-muted flex-shrink-0">ativo</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Sair (cliente only — admin/parceiro have it in sidebar) */}
            {role === 'cliente' && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-full btn-micro"
                onClick={() => { logout(); navigate('/login') }}
              >
                Sair
              </Button>
            )}

            {/* Avatar */}
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-sm flex-shrink-0">
              {user?.name?.charAt(0) ?? 'U'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-10 lg:pl-4">{children}</main>
      </div>
    </div>
  )
}
