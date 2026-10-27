import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { resources } from '../features/records/config'
import { LoadingState } from '../components/shared/States'

const LoginPage = lazy(() => import('../features/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const RecoverPage = lazy(() => import('../features/auth/LoginPage').then(m => ({ default: m.RecoverPage })))
const DashboardPage = lazy(() => import('../features/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const RecordPage = lazy(() => import('../features/records/RecordPage').then(m => ({ default: m.RecordPage })))
const QueuePage = lazy(() => import('../features/collections/QueuePage').then(m => ({ default: m.QueuePage })))
const FinancePage = lazy(() => import('../features/finance/FinancePage').then(m => ({ default: m.FinancePage })))
const AIPage = lazy(() => import('../features/ai/AIPage').then(m => ({ default: m.AIPage })))
const ReportsPage = lazy(() => import('../features/management/ReportsPage').then(m => ({ default: m.ReportsPage })))
const AnalyticsPage = lazy(() => import('../features/management/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })))
const UsersPage = lazy(() => import('../features/management/UsersPage').then(m => ({ default: m.UsersPage })))
const SettingsPage = lazy(() => import('../features/settings/SettingsPage').then(m => ({ default: m.SettingsPage })))
const ProfilePage = lazy(() => import('../features/profile/ProfilePage').then(m => ({ default: m.ProfilePage })))
const NotificationsPage = lazy(() => import('../features/notifications/NotificationsPage').then(m => ({ default: m.NotificationsPage })))

function AppContent() {
  const path = useLocation().pathname
  if (path.startsWith('/app/cobrancas/fila')) return <QueuePage/>
  if (path.startsWith('/app/negociacoes')) return <FinancePage section="negotiations"/>
  if (path.startsWith('/app/acordos')) return <FinancePage section="agreements"/>
  if (path.startsWith('/app/pagamentos')) return <FinancePage section="payments"/>
  if (path.startsWith('/app/ia')) return <AIPage/>
  if (path.startsWith('/app/relatorios')) return <ReportsPage/>
  if (path.startsWith('/app/analytics')) return <AnalyticsPage/>
  if (path.startsWith('/app/usuarios')) return <UsersPage/>
  if (path.startsWith('/app/configuracoes')) return <SettingsPage/>
  if (path.startsWith('/app/perfil')) return <ProfilePage/>
  if (path.startsWith('/app/notificacoes')) return <NotificationsPage/>
  const resource = Object.values(resources).find(item => path === item.path || path.startsWith(item.path + '/'))
  if (resource) return <RecordPage config={resource}/>
  return <DashboardPage/>
}

export function App() {
  const { user, loading } = useAuth()
  if (loading) return <div className="boot-screen"><div className="spinner"/>Carregando CollectAI...</div>
  return <Suspense fallback={<LoadingState/>}><Routes>
    <Route path="/login" element={user ? <Navigate to="/app/dashboard" replace/> : <LoginPage/>}/>
    <Route path="/recuperar-senha" element={<RecoverPage/>}/>
    <Route path="/app/*" element={user ? <DashboardLayout><AppContent/></DashboardLayout> : <Navigate to="/login" replace/>}/>
    <Route path="*" element={<Navigate to={user ? '/app/dashboard' : '/login'} replace/>}/>
  </Routes></Suspense>
}
