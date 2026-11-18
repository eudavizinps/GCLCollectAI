import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './ContextoAutenticacao'
import { DashboardLayout } from '../estrutura/EstruturaPainel'
import { resources } from '../features/cadastros/configuracaoCadastros'
import { LoadingState } from '../components/shared/EstadosPagina'
import { canAccessPath, homePath } from './permissoes'

const LoginPage = lazy(() =>
  import('../features/autenticacao/TelaLogin').then((m) => ({ default: m.LoginPage })),
)
const RecoverPage = lazy(() =>
  import('../features/autenticacao/TelaLogin').then((m) => ({ default: m.RecoverPage })),
)
const DashboardPage = lazy(() =>
  import('../features/painel/TelaPainel').then((m) => ({ default: m.DashboardPage })),
)
const RecordPage = lazy(() =>
  import('../features/cadastros/TelaCadastros').then((m) => ({ default: m.RecordPage })),
)
const QueuePage = lazy(() =>
  import('../features/cobrancas/TelaFilaCobranca').then((m) => ({ default: m.QueuePage })),
)
const FinancePage = lazy(() =>
  import('../features/financeiro/TelaFinanceiro').then((m) => ({ default: m.FinancePage })),
)
const AIPage = lazy(() => import('../features/agentes_ia/TelaAgentesIA').then((m) => ({ default: m.AIPage })))
const ReportsPage = lazy(() =>
  import('../features/relatorios/TelaRelatorios').then((m) => ({ default: m.ReportsPage })),
)
const AnalyticsPage = lazy(() =>
  import('../features/indicadores/TelaIndicadores').then((m) => ({ default: m.AnalyticsPage })),
)
const UsersPage = lazy(() =>
  import('../features/usuarios/TelaUsuarios').then((m) => ({ default: m.UsersPage })),
)
const SettingsPage = lazy(() =>
  import('../features/configuracoes/TelaConfiguracoes').then((m) => ({ default: m.SettingsPage })),
)
const ProfilePage = lazy(() =>
  import('../features/perfil/TelaPerfil').then((m) => ({ default: m.ProfilePage })),
)
const NotificationsPage = lazy(() =>
  import('../features/notificacoes/TelaNotificacoes').then((m) => ({
    default: m.NotificationsPage,
  })),
)

function AppContent() {
  const path = useLocation().pathname
  const { user } = useAuth()
  if (!canAccessPath(user?.role || '', path))
    return <Navigate to={homePath(user?.role || '')} replace />
  if (path.startsWith('/app/dashboard')) return <DashboardPage />
  if (path.startsWith('/app/cobrancas/fila')) return <QueuePage />
  if (path.startsWith('/app/negociacoes')) return <FinancePage section="negotiations" />
  if (path.startsWith('/app/acordos')) return <FinancePage section="agreements" />
  if (path.startsWith('/app/pagamentos')) return <FinancePage section="payments" />
  if (path.startsWith('/app/ia')) return <AIPage />
  if (path.startsWith('/app/relatorios')) return <ReportsPage />
  if (path.startsWith('/app/analytics')) return <AnalyticsPage />
  if (path.startsWith('/app/usuarios')) return <UsersPage />
  if (path.startsWith('/app/configuracoes')) return <SettingsPage />
  if (path.startsWith('/app/perfil')) return <ProfilePage />
  if (path.startsWith('/app/notificacoes')) return <NotificationsPage />
  const resource = Object.values(resources).find(
    (item) => path === item.path || path.startsWith(item.path + '/'),
  )
  if (resource) return <RecordPage config={resource} />
  return <Navigate to={homePath(user?.role || '')} replace />
}

export function App() {
  const { user, loading } = useAuth()
  if (loading)
    return (
      <div className="boot-screen">
        <div className="spinner" />
        Carregando CollectAI...
      </div>
    )
  return (
    <Suspense fallback={<LoadingState />}>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to={homePath(user.role)} replace /> : <LoginPage />}
        />
        <Route path="/recuperar-senha" element={<RecoverPage />} />
        <Route
          path="/app/*"
          element={
            user ? (
              <DashboardLayout>
                <AppContent />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to={user ? homePath(user.role) : '/login'} replace />} />
      </Routes>
    </Suspense>
  )
}
