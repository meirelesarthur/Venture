import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'

interface AuthGuardProps {
  children: ReactNode
  allowedRoles?: ('cliente' | 'parceiro' | 'admin')[]
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && user?.role && !allowedRoles.includes(user.role as 'cliente' | 'parceiro' | 'admin')) {
    // Redireciona para o dashboard correto baseado no perfil se tentar acessar área não permitida
    if (user.role === 'admin') return <Navigate to="/admin" replace />
    if (user.role === 'parceiro') return <Navigate to="/parceiro" replace />
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

// Redirect if already logged in
export function GuestGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()

  if (isAuthenticated && user?.role) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />
    if (user.role === 'parceiro') return <Navigate to="/parceiro" replace />
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
