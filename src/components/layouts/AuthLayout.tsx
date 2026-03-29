import { type ReactNode, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
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
} from 'lucide-react'

interface AuthLayoutProps {
  children: ReactNode
}

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
  ],
  admin: [
    { label: 'Painel', href: '/admin', icon: <LayoutDashboard size={18} /> },
    { label: 'Clientes', href: '/admin/clientes', icon: <Users size={18} /> },
    { label: 'Leads', href: '/admin/leads', icon: <ChevronRight size={18} /> },
    { label: 'Parceiros', href: '/admin/parceiros', icon: <Users size={18} /> },
    { label: 'Control Sites', href: '/admin/control-sites', icon: <Map size={18} /> },
    { label: 'Acessos', href: '/admin/usuarios', icon: <Shield size={18} /> },
    { label: 'Parâmetros', href: '/admin/parametros', icon: <Settings size={18} /> },
  ],
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const role = user?.role ?? 'cliente'
  const items = navByRole[role] ?? []

  return (
    <div className="flex bg-background h-screen overflow-hidden">
      {/* Sidebar Desktop (Hidden for Client) */}
      {role !== 'cliente' && (
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-surface shadow-soft transition-transform duration-300 lg:static lg:translate-x-0 m-4 rounded-3xl ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <div className="h-8 w-8 rounded-lg bg-primary" />
          <span className="text-lg font-semibold text-foreground">
            Venture Carbon
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-2 p-4">
          {items.map((item) => {
            const isActive = window.location.pathname === item.href || (item.href !== '/dashboard' && window.location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 btn-micro hover:bg-accent/5 hover:text-accent ${isActive ? 'bg-accent/10 text-accent font-semibold' : 'text-muted-foreground'}`}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </nav>

        <Separator />

        {/* User / Logout */}
        <div className="p-4">
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-background/50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">
              {user?.name?.charAt(0) ?? 'U'}
            </div>
            <div className="flex-1 truncate">
              <p className="truncate text-sm font-semibold text-foreground">
                {user?.name ?? 'Usuário'}
              </p>
              <p className="truncate text-xs text-muted-foreground">{user?.email ?? ''}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-xl btn-micro"
            onClick={logout}
          >
            <LogOut size={16} />
            Sair
          </Button>
        </div>
      </aside>
      )}

      {/* Overlay mobile */}
      {sidebarOpen && role !== 'cliente' && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header - Global Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 bg-surface px-4 shadow-sm sm:px-8 border-b border-border/50">
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
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary hidden sm:block" />
              <span className="text-lg font-bold text-foreground">
                Venture Carbon
              </span>
            </div>
          </div>

          {/* Client Top Navigation */}
          {role === 'cliente' && (
            <nav className="hidden md:flex flex-1 items-center justify-center gap-2 mx-4">
              {items.map((item) => {
                const isActive = window.location.pathname === item.href || (item.href !== '/dashboard' && window.location.pathname.startsWith(item.href));
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
          )}

          {/* User Options */}
          <div className="flex items-center gap-3">
            {role === 'cliente' && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-full btn-micro"
                onClick={logout}
              >
                Sair
              </Button>
            )}
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-sm">
              {user?.name?.charAt(0) ?? 'U'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-10 lg:pl-4">{children}</main>
      </div>
    </div>
  )
}
