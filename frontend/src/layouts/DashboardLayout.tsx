import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Bell, ChevronLeft, ChevronRight, LogOut, Menu, Moon, Search, Sun, X } from 'lucide-react'
import { BrandLogo } from '../components/branding/BrandLogo'
import { useAuth } from '../app/AuthContext'
import { navigation } from '../app/navigation'
import { get, post, type Paged, type RecordItem } from '../services/api'

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(localStorage.getItem('collectai-sidebar') === 'true')
  const [mobile, setMobile] = useState(false)
  const [theme, setTheme] = useState(localStorage.getItem('collectai-theme') || 'dark')
  const [notifications, setNotifications] = useState<RecordItem[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [search, setSearch] = useState('')
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('collectai-theme', theme) }, [theme])
  useEffect(() => { const onTheme = (event: Event) => setTheme((event as CustomEvent<string>).detail); window.addEventListener('collectai-theme', onTheme); return () => window.removeEventListener('collectai-theme', onTheme) }, [])
  useEffect(() => { setMobile(false); get<Paged<RecordItem>>('/notifications?size=100').then(data => setNotifications(data.items)).catch(() => {}) }, [location.pathname])
  const activeLink = navigation.flatMap(group => group.links).find(link => link.path === location.pathname) || navigation.flatMap(group => group.links).find(link => location.pathname.startsWith(link.path + '/'))
  const toggle = () => { setCollapsed(!collapsed); localStorage.setItem('collectai-sidebar', String(!collapsed)) }
  const handleSearch = (event: React.FormEvent) => { event.preventDefault(); if (search.trim()) navigate(`/app/clientes?q=${encodeURIComponent(search.trim())}`) }
  const markRead = async (notification: RecordItem) => { await post(`/notifications/${notification.id}/read`); setNotifications(items => items.map(item => item.id === notification.id ? { ...item, read: true } : item)); setShowNotifications(false); navigate(String(notification.path || '/app/notificacoes')) }
  const allowed = (path: string) => !(['/app/usuarios', '/app/auditoria'].includes(path) && !['superadmin', 'admin', 'supervisor'].includes(user?.role || ''))
  return <div className={`shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
    {mobile && <button className="mobile-backdrop" aria-label="Fechar menu" onClick={() => setMobile(false)} />}
    <aside className={`sidebar ${mobile ? 'mobile-open' : ''}`}>
      <div className="sidebar-header"><Link to="/app/dashboard"><BrandLogo compact={collapsed} /></Link><button className="icon-button collapse-button" onClick={toggle} aria-label="Recolher menu">{collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}</button><button className="icon-button mobile-close" onClick={() => setMobile(false)} aria-label="Fechar menu"><X size={20}/></button></div>
      <nav className="sidebar-nav" aria-label="Navegação principal">{navigation.map(group => <div className="nav-group" key={group.group}><div className="nav-group-title">{collapsed ? '·' : group.group}</div>{group.links.filter(link => allowed(link.path)).map(link => <NavLink key={link.path} title={link.label} to={link.path} className={({ isActive }) => `nav-item ${isActive || location.pathname.startsWith(link.path + '/') ? 'active' : ''}`}><link.icon size={18}/><span>{link.label}</span></NavLink>)}</div>)}</nav>
      <div className="sidebar-footer"><div className="avatar">{user?.name.slice(0, 1)}</div><div className="sidebar-user"><strong>{user?.name}</strong><span>{user?.role}</span></div></div>
    </aside>
    <div className="main-column"><header className="topbar"><button className="icon-button menu-button" onClick={() => setMobile(true)} aria-label="Abrir menu"><Menu size={21}/></button><div className="breadcrumb"><span>CollectAI</span><ChevronRight size={14}/><strong>{activeLink?.label || 'Visão geral'}</strong></div><form className="global-search" onSubmit={handleSearch}><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente..." aria-label="Buscar cliente"/><kbd>↵</kbd></form><div className="topbar-actions"><button className="icon-button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Alternar tema">{theme === 'dark' ? <Sun size={19}/> : <Moon size={19}/>}</button><div className="notification-control"><button className="icon-button notification-button" onClick={() => setShowNotifications(!showNotifications)} title="Notificações"><Bell size={19}/>{notifications.some(item => !item.read) && <i/>}</button>{showNotifications && <div className="notification-popover"><div className="popover-title">Notificações <Link to="/app/notificacoes" onClick={() => setShowNotifications(false)}>Ver todas</Link></div>{notifications.slice(0, 5).map(item => <button key={item.id} onClick={() => void markRead(item)} className={item.read ? '' : 'unread'}>{String(item.title)}</button>)}{notifications.length === 0 && <p>Nenhuma notificação</p>}</div>}</div><button className="icon-button" title="Sair" onClick={() => void logout()}><LogOut size={19}/></button></div></header><main className="content">{children}</main><footer className="app-footer">CollectAI v0.1 <span>•</span> by GCL Technology <span>•</span> Ambiente demonstrativo</footer></div>
  </div>
}
