import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Logo from '@/assets/Logo.png'

interface PublicLayoutProps {
  children: ReactNode
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header público */}
      <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md shadow-soft">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img src={Logo} alt="Venture Carbon" className="h-10 w-auto object-contain" />
            <span className="text-xl font-bold text-foreground tracking-tight">
              Venture Carbon
            </span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              to="/simulacao"
              className="text-sm font-medium text-muted-foreground transition-all hover:text-primary btn-micro"
            >
              Simulador
            </Link>
            <Link
              to="/login"
              className="text-sm font-medium text-muted-foreground transition-all hover:text-primary btn-micro"
            >
              Entrar
            </Link>
          </nav>
        </div>
      </header>

      {/* Conteúdo público */}
      <main>{children}</main>
    </div>
  )
}
