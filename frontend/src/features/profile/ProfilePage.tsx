import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/shared/PageHeader'
import { useAuth } from '../../app/AuthContext'
import { patch, post } from '../../services/api'

export function ProfilePage() {
  const { user, refresh, logout } = useAuth(); const navigate = useNavigate(); const [name, setName] = useState(user?.name || ''); const [current, setCurrent] = useState(''); const [next, setNext] = useState(''); const [message, setMessage] = useState(''); const [error, setError] = useState('')
  const saveName = async (event: FormEvent) => { event.preventDefault(); setError(''); try { await patch('/profile', { name }); await refresh(); setMessage('Nome atualizado.') } catch (err) { setError((err as Error).message) } }
  const savePassword = async (event: FormEvent) => { event.preventDefault(); setError(''); try { await post('/profile/password', { current_password: current, new_password: next }); setCurrent(''); setNext(''); setMessage('Senha atualizada.') } catch (err) { setError((err as Error).message) } }
  return <><PageHeader eyebrow="SISTEMA / CONTA" title="Meu perfil" description="Gerencie seus dados e sua sessão."/>{message && <div className="success-banner">{message}</div>}{error && <div className="error-banner">{error}</div>}<div className="dashboard-grid"><form className="panel" onSubmit={saveName}><h2>Dados da conta</h2><p>{user?.email} · {user?.role}</p><label>Nome<input required minLength={2} value={name} onChange={e => setName(e.target.value)}/></label><button className="primary-button">Salvar nome</button></form><form className="panel" onSubmit={savePassword}><h2>Alterar senha</h2><label>Senha atual<input required type="password" value={current} onChange={e => setCurrent(e.target.value)}/></label><label>Nova senha<input required type="password" minLength={8} value={next} onChange={e => setNext(e.target.value)}/></label><button className="primary-button">Atualizar senha</button></form></div><button className="secondary-button" onClick={() => void logout().then(() => navigate('/login'))}>Encerrar sessão</button></>
}
