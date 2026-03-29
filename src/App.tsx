import { lazy, Suspense } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'
import { PublicLayout } from '@/components/layouts/PublicLayout'
import { AuthLayout } from '@/components/layouts/AuthLayout'
import { AuthGuard, GuestGuard } from '@/components/layouts/AuthGuard'
import { Toaster } from '@/components/ui/sonner'

/* ---- Lazy-loaded pages ---- */

// Public
const SimuladorPage = lazy(() => import('@/pages/simulador/SimuladorPage'))
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RecuperarSenhaPage = lazy(() => import('@/pages/auth/RecuperarSenhaPage'))
const CriarContaPage = lazy(() => import('@/pages/auth/CriarContaPage'))

// Cliente
const DashboardPage = lazy(() => import('@/pages/cliente/DashboardPage'))
const MrvPage = lazy(() => import('@/pages/cliente/MrvPage'))
const ResultadosPage = lazy(() => import('@/pages/cliente/ResultadosPage'))
const PerfilPage = lazy(() => import('@/pages/cliente/PerfilPage'))

// Parceiro
const ParceiroDashboard = lazy(() => import('@/pages/parceiro/ParceiroDashboard'))
const NovoLeadPage = lazy(() => import('@/pages/parceiro/NovoLeadPage'))
const LeadsPage = lazy(() => import('@/pages/parceiro/LeadsPage'))
const ComissoesPage = lazy(() => import('@/pages/parceiro/ComissoesPage'))

// Admin
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'))
const AdminClientes = lazy(() => import('@/pages/admin/AdminClientes'))
const AdminLeads = lazy(() => import('@/pages/admin/AdminLeads'))
const AdminParceiros = lazy(() => import('@/pages/admin/AdminParceiros'))
const AdminControlSites = lazy(() => import('@/pages/admin/AdminControlSites'))
const AdminParametros = lazy(() => import('@/pages/admin/AdminParametros'))
const AdminMotor = lazy(() => import('@/pages/admin/AdminMotor'))
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'))

/* ---- Loading fallback ---- */
function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* --- Rotas Públicas --- */}
          <Route element={<PublicLayout><SimuladorPage /></PublicLayout>} path="/simulacao" />
          <Route element={<GuestGuard><PublicLayout><LoginPage /></PublicLayout></GuestGuard>} path="/login" />
          <Route element={<GuestGuard><PublicLayout><RecuperarSenhaPage /></PublicLayout></GuestGuard>} path="/recuperar-senha" />
          <Route element={<GuestGuard><PublicLayout><CriarContaPage /></PublicLayout></GuestGuard>} path="/criar-conta" />

          {/* --- Cliente --- */}
          <Route element={<AuthGuard allowedRoles={['cliente', 'admin']}><AuthLayout><DashboardPage /></AuthLayout></AuthGuard>} path="/dashboard" />
          <Route element={<AuthGuard allowedRoles={['cliente', 'admin']}><AuthLayout><MrvPage /></AuthLayout></AuthGuard>} path="/dashboard/mrv/*" />
          <Route element={<AuthGuard allowedRoles={['cliente', 'admin']}><AuthLayout><ResultadosPage /></AuthLayout></AuthGuard>} path="/dashboard/resultados" />
          <Route element={<AuthGuard allowedRoles={['cliente', 'admin']}><AuthLayout><PerfilPage /></AuthLayout></AuthGuard>} path="/dashboard/perfil" />

          {/* --- Parceiro --- */}
          <Route element={<AuthGuard allowedRoles={['parceiro', 'admin']}><AuthLayout><ParceiroDashboard /></AuthLayout></AuthGuard>} path="/parceiro" />
          <Route element={<AuthGuard allowedRoles={['parceiro', 'admin']}><AuthLayout><NovoLeadPage /></AuthLayout></AuthGuard>} path="/parceiro/leads/novo" />
          <Route element={<AuthGuard allowedRoles={['parceiro', 'admin']}><AuthLayout><LeadsPage /></AuthLayout></AuthGuard>} path="/parceiro/leads" />
          <Route element={<AuthGuard allowedRoles={['parceiro', 'admin']}><AuthLayout><ComissoesPage /></AuthLayout></AuthGuard>} path="/parceiro/comissoes" />

          {/* --- Admin --- */}
          <Route element={<AuthGuard allowedRoles={['admin']}><AuthLayout><AdminDashboard /></AuthLayout></AuthGuard>} path="/admin" />
          <Route element={<AuthGuard allowedRoles={['admin']}><AuthLayout><AdminClientes /></AuthLayout></AuthGuard>} path="/admin/clientes/*" />
          <Route element={<AuthGuard allowedRoles={['admin']}><AuthLayout><AdminLeads /></AuthLayout></AuthGuard>} path="/admin/leads/*" />
          <Route element={<AuthGuard allowedRoles={['admin']}><AuthLayout><AdminParceiros /></AuthLayout></AuthGuard>} path="/admin/parceiros" />
          <Route element={<AuthGuard allowedRoles={['admin']}><AuthLayout><AdminControlSites /></AuthLayout></AuthGuard>} path="/admin/control-sites/*" />
          <Route element={<AuthGuard allowedRoles={['admin']}><AuthLayout><AdminParametros /></AuthLayout></AuthGuard>} path="/admin/parametros" />
          <Route element={<AuthGuard allowedRoles={['admin']}><AuthLayout><AdminUsers /></AuthLayout></AuthGuard>} path="/admin/usuarios" />
          <Route element={<AuthGuard allowedRoles={['admin']}><AuthLayout><AdminMotor /></AuthLayout></AuthGuard>} path="/admin/motor/:fazendaId" />

          {/* Redirect root */}
          <Route path="/" element={<Navigate to="/simulacao" replace />} />
          <Route path="*" element={<Navigate to="/simulacao" replace />} />
        </Routes>
      </Suspense>
      <Toaster />
    </BrowserRouter>
  )
}
