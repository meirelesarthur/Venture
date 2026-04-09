import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { PublicLayout } from '@/components/layouts/PublicLayout'
import { AuthLayout } from '@/components/layouts/AuthLayout'
import { AuthGuard, GuestGuard } from '@/components/layouts/AuthGuard'
import { Toaster } from '@/components/ui/sonner'

/* ---- Lazy-loaded pages ---- */

// Public
const SimuladorPage       = lazy(() => import('@/pages/simulador/SimuladorPage'))
const LoginPage           = lazy(() => import('@/pages/auth/LoginPage'))
const RecuperarSenhaPage  = lazy(() => import('@/pages/auth/RecuperarSenhaPage'))
const CriarContaPage      = lazy(() => import('@/pages/auth/CriarContaPage'))

// Cliente
const DashboardPage       = lazy(() => import('@/pages/cliente/DashboardPage'))
const MrvPage             = lazy(() => import('@/pages/cliente/MrvPage'))
const ResultadosPage      = lazy(() => import('@/pages/cliente/ResultadosPage'))
const PerfilPage          = lazy(() => import('@/pages/cliente/PerfilPage'))

// Parceiro
const ParceiroDashboard   = lazy(() => import('@/pages/parceiro/ParceiroDashboard'))
const NovoLeadPage        = lazy(() => import('@/pages/parceiro/NovoLeadPage'))
const LeadsPage           = lazy(() => import('@/pages/parceiro/LeadsPage'))
const ComissoesPage       = lazy(() => import('@/pages/parceiro/ComissoesPage'))
const RankingPage         = lazy(() => import('@/pages/parceiro/RankingPage'))

// Admin
const AdminDashboard      = lazy(() => import('@/pages/admin/AdminDashboard'))
const AdminClientes       = lazy(() => import('@/pages/admin/AdminClientes'))
const AdminClienteDetalhe = lazy(() => import('@/pages/admin/AdminClienteDetalhe'))
const AdminLeads          = lazy(() => import('@/pages/admin/AdminLeads'))
const AdminParceiros      = lazy(() => import('@/pages/admin/AdminParceiros'))
const AdminControlSites   = lazy(() => import('@/pages/admin/AdminControlSites'))
const AdminParametros     = lazy(() => import('@/pages/admin/AdminParametros'))
const AdminMotor          = lazy(() => import('@/pages/admin/AdminMotor'))
const AdminUsers          = lazy(() => import('@/pages/admin/AdminUsers'))
const AdminFazendas       = lazy(() => import('@/pages/admin/AdminFazendas'))
const AdminFazendaDetalhe = lazy(() => import('@/pages/admin/AdminFazendaDetalhe'))

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}

const A = ({ roles, children }: { roles: ('cliente'|'parceiro'|'admin')[]; children: React.ReactNode }) => (
  <AuthGuard allowedRoles={roles}><AuthLayout>{children}</AuthLayout></AuthGuard>
)

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ── Públicas ────────────────────────────────────────────── */}
          <Route path="/simulacao" element={<PublicLayout><SimuladorPage /></PublicLayout>} />
          <Route path="/login"           element={<GuestGuard><PublicLayout><LoginPage /></PublicLayout></GuestGuard>} />
          <Route path="/recuperar-senha" element={<GuestGuard><PublicLayout><RecuperarSenhaPage /></PublicLayout></GuestGuard>} />
          <Route path="/criar-conta"     element={<GuestGuard><PublicLayout><CriarContaPage /></PublicLayout></GuestGuard>} />

          {/* ── Cliente ─────────────────────────────────────────────── */}
          <Route path="/dashboard"           element={<A roles={['cliente','admin']}><DashboardPage /></A>} />
          <Route path="/dashboard/mrv/*"     element={<A roles={['cliente','admin']}><MrvPage /></A>} />
          <Route path="/dashboard/resultados" element={<A roles={['cliente','admin']}><ResultadosPage /></A>} />
          <Route path="/dashboard/perfil"    element={<A roles={['cliente','admin']}><PerfilPage /></A>} />

          {/* ── Parceiro ────────────────────────────────────────────── */}
          <Route path="/parceiro"            element={<A roles={['parceiro','admin']}><ParceiroDashboard /></A>} />
          <Route path="/parceiro/leads/novo" element={<A roles={['parceiro','admin']}><NovoLeadPage /></A>} />
          <Route path="/parceiro/leads"      element={<A roles={['parceiro','admin']}><LeadsPage /></A>} />
          <Route path="/parceiro/comissoes"  element={<A roles={['parceiro','admin']}><ComissoesPage /></A>} />
          <Route path="/parceiro/ranking"    element={<A roles={['parceiro','admin']}><RankingPage /></A>} />

          {/* ── Admin ───────────────────────────────────────────────── */}
          <Route path="/admin"                              element={<A roles={['admin']}><AdminDashboard /></A>} />
          <Route path="/admin/clientes"                     element={<A roles={['admin']}><AdminClientes /></A>} />
          <Route path="/admin/clientes/:id"                 element={<A roles={['admin']}><AdminClienteDetalhe /></A>} />
          <Route path="/admin/leads/*"                      element={<A roles={['admin']}><AdminLeads /></A>} />
          <Route path="/admin/parceiros"                    element={<A roles={['admin']}><AdminParceiros /></A>} />
          <Route path="/admin/control-sites/*"              element={<A roles={['admin']}><AdminControlSites /></A>} />
          <Route path="/admin/parametros"                   element={<A roles={['admin']}><AdminParametros /></A>} />
          <Route path="/admin/usuarios"                     element={<A roles={['admin']}><AdminUsers /></A>} />
          <Route path="/admin/motor/:fazendaId?"            element={<A roles={['admin']}><AdminMotor /></A>} />
          <Route path="/admin/fazendas"                     element={<A roles={['admin']}><AdminFazendas /></A>} />
          <Route path="/admin/fazendas/:fazendaId"          element={<A roles={['admin']}><AdminFazendaDetalhe /></A>} />

          {/* Redirect root */}
          <Route path="/" element={<Navigate to="/simulacao" replace />} />
          <Route path="*" element={<Navigate to="/simulacao" replace />} />
        </Routes>
      </Suspense>
      <Toaster />
    </BrowserRouter>
  )
}
