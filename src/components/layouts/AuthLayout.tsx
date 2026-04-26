import { type ReactNode, useState, useMemo, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import NotificacoesBell from '@/components/ui/NotificacoesBell'
import AdminAlertsBell from '@/components/ui/AdminAlertsBell'
import {
  LayoutDashboard,
  Map,
  FileBarChart,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
  Cpu,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
    { label: 'Fazendas', href: '/admin/fazendas', icon: <Map size={18} /> },
    { label: 'Motor de Cálculos', href: '/admin/motor', icon: <Cpu size={18} /> },
    { label: 'Clientes', href: '/admin/clientes', icon: <Users size={18} /> },
    { label: 'Leads', href: '/admin/leads', icon: <ChevronRight size={18} /> },
    { label: 'Parceiros', href: '/admin/parceiros', icon: <Users size={18} /> },
    { label: 'Control Sites', href: '/admin/control-sites', icon: <Map size={18} /> },
    { label: 'Parâmetros', href: '/admin/parametros', icon: <Settings size={18} /> },
    { label: 'Acessos', href: '/admin/usuarios', icon: <Shield size={18} /> },
  ],
}

export function AuthLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const touchStartX = useRef(0)
  const navigate = useNavigate()
  const location = useLocation()

  const role = user?.role ?? 'cliente'
  const items = navByRole[role] ?? []

  const activeItem = useMemo(() => {
    return items.reduce((best, item) => {
      const isMatch =
        location.pathname === item.href ||
        location.pathname.startsWith(item.href + '/')
      
      if (isMatch) {
        if (!best || item.href.length > best.href.length) {
          return item
        }
      }
      return best
    }, null as NavItem | null)
  }, [items, location.pathname])

  return (
    <div className="flex bg-background h-screen overflow-hidden">
      {/* ── Sidebar (Admin / Parceiro only) ─────────────────────────── */}
      {role !== 'cliente' && (
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-surface shadow-soft transition-all duration-300 transform lg:static lg:translate-x-0 m-4 rounded-3xl overflow-visible ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } ${collapsed ? 'lg:w-[84px] w-64' : 'w-64'}`}
        >
          <div className={`flex items-center p-4 pb-2 transition-all duration-300 ${collapsed ? 'flex-col gap-4' : 'justify-between'}`}>
            {!collapsed && (
              <div className="flex items-center animate-in fade-in duration-500 pl-2">
                <img src={Logo} alt="Venture Carbon" className="h-7 w-auto object-contain" />
              </div>
            )}
            
            <div className={`flex items-center gap-1 ml-auto ${collapsed ? 'flex-col pb-2 border-b border-border/30 mb-2' : ''}`}>
              {role === 'admin' && <AdminAlertsBell />}
              
              <Button variant="ghost" size="icon" className="hidden lg:flex rounded-xl text-muted-foreground hover:bg-accent/10 hover:text-accent ml-1" onClick={() => setCollapsed(!collapsed)}>
                {collapsed ? <ChevronRight size={18}/> : <ChevronLeft size={18} />}
              </Button>
              <Button variant="ghost" size="icon" className="lg:hidden rounded-xl" onClick={() => setSidebarOpen(false)}>
                <X size={18} />
              </Button>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto space-y-2 p-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {items.map((item) => {
              const isActive = activeItem?.href === item.href
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 rounded-xl py-3 text-sm font-medium transition-all duration-200 btn-micro hover:bg-accent/5 hover:text-accent ${
                    isActive ? 'bg-accent/10 text-accent font-semibold' : 'text-muted-foreground'
                  } ${collapsed ? 'lg:justify-center px-4 lg:px-0' : 'px-4'}`}
                >
                  <div className="flex-shrink-0">{item.icon}</div>
                  <span className={`truncate ${collapsed ? 'lg:hidden' : 'block'}`}>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-border/30">
            <div className={`mb-4 flex items-center gap-3 rounded-xl bg-background/30 p-3 transition-all ${collapsed ? 'lg:p-2 lg:justify-center' : ''}`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm flex-shrink-0">
                {user?.name?.charAt(0) ?? 'U'}
              </div>
              <div className={`flex-1 truncate ${collapsed ? 'hidden' : 'block'}`}>
                <p className="truncate text-sm font-semibold text-foreground">{user?.name ?? 'Usuário'}</p>
                <p className="truncate text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{role}</p>
              </div>

              <div className={`${collapsed ? 'mt-2' : ''}`}>
                <NotificacoesBell />
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              title={collapsed ? "Sair" : undefined}
              className={`w-full gap-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-xl btn-micro ${collapsed ? 'lg:px-0 lg:justify-center' : 'justify-start'}`}
              onClick={() => { logout(); navigate('/login') }}
            >
              <div className="flex-shrink-0"><LogOut size={16} /></div>
              <span className={`truncate ${collapsed ? 'lg:hidden' : 'block'}`}>Sair</span>
            </Button>
          </div>
        </aside>
      )}

      {/* Mobile overlay */}
      {sidebarOpen && role !== 'cliente' && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main area ───────────────────────────────────────────────── */}
      <div
        className="flex flex-1 flex-col overflow-hidden"
        onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
        onTouchEnd={e => {
          const dx = e.changedTouches[0].clientX - touchStartX.current
          if (dx > 60 && !sidebarOpen) setSidebarOpen(true)
          if (dx < -60 && sidebarOpen) setSidebarOpen(false)
        }}
      >
        {/* Topbar only for Cliente */}
        {role === 'cliente' ? (
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 bg-surface pl-6 pr-4 sm:pr-8 shadow-md border-x border-b border-border/40 mx-4 sm:mx-8 lg:mx-10 rounded-b-3xl transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <img src={Logo} alt="Venture Carbon" className="h-10 w-auto object-contain" />
              </div>
            </div>

            <nav className="hidden md:flex flex-1 items-center justify-center gap-2 mx-4">
              {items.map((item) => {
                const isActive = activeItem?.href === item.href
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      isActive ? 'bg-primary/5 text-primary' : 'text-muted-foreground hover:bg-accent/5 hover:text-foreground'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="flex items-center gap-3">
              <NotificacoesBell />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-sm hover:ring-2 hover:ring-primary/20 transition-all focus:outline-none">
                    {user?.name?.charAt(0) ?? 'U'}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/dashboard/perfil')}>
                    <Users className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={() => { logout(); navigate('/login') }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
        ) : (
          /* Mobile Toggle for Admin/Parceiro */
          <div className="lg:hidden flex items-center p-4 bg-background/50 border-b border-border/30">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl border border-border/30 bg-surface shadow-sm"
            >
              <Menu size={20} />
            </Button>
            <div className="ml-4 flex items-center gap-3">
               <img src={Logo} alt="Venture Carbon" className="h-8 w-auto object-contain" />
               <span className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">{role}</span>
            </div>
          </div>
        )}

        <main className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 ${role !== 'cliente' ? 'pt-2 lg:pt-10' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  )
}
