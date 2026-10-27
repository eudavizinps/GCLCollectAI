import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCheck } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '../../components/shared/States'
import { get, post, type Paged, type RecordItem } from '../../services/api'

export function NotificationsPage() {
  const navigate = useNavigate(); const [items, setItems] = useState<RecordItem[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const load = () => { get<Paged<RecordItem>>('/notifications?size=100').then(data => setItems(data.items)).catch(err => setError(err.message)).finally(() => setLoading(false)) }
  useEffect(load, [])
  const read = async (item: RecordItem) => { try { await post(`/notifications/${item.id}/read`); navigate(String(item.path || '/app/dashboard')) } catch (err) { setError((err as Error).message) } }
  const all = async () => { try { await post('/notifications/read-all'); load() } catch (err) { setError((err as Error).message) } }
  return <><PageHeader eyebrow="VISÃO GERAL / ALERTAS" title="Notificações" description="Acompanhe aprovações, acordos e pagamentos." actions={<button className="secondary-button" onClick={() => void all()}><CheckCheck size={17}/> Marcar todas como lidas</button>}/>{error && <ErrorState message={error}/>} {loading ? <LoadingState/> : <div className="panel">{items.length ? items.map(item => <button key={item.id} className={`notification-row ${!item.read ? 'unread' : ''}`} onClick={() => void read(item)}><span className="notification-dot"/><span><strong>{String(item.title)}</strong><small>{new Date(String(item.at)).toLocaleString('pt-BR')}</small></span></button>) : <EmptyState/>}</div>}</>
}
