import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type UserRole = 'lead' | 'cliente' | 'parceiro' | 'admin' | null

interface User {
  id: string
  name: string
  email: string
  role: UserRole
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false, // Start false since persist will rehydrate immediately or leave it empty initially
      setUser: (user) =>
        set({ user, isAuthenticated: !!user, isLoading: false }),
      logout: () =>
        set({ user: null, isAuthenticated: false, isLoading: false }),
    }),
    {
      name: 'venture-carbon-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)
