import { useEffect, useState, type FormEvent } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '../../components/shared/States'
import { get, patch, post, type Paged, type RecordItem, type User } from '../../services/api'
import { useAuth } from '../../app/AuthContext'

export function UsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [teams, setTeams] = useState<RecordItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'closed' | 'create' | 'edit'>('closed')
  const [editingId, setEditingId] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('operator')
  const [teamId, setTeamId] = useState('')
  const [password, setPassword] = useState('')
  const [refresh, setRefresh] = useState(0)
  useEffect(() => { setLoading(true); Promise.all([get<User[]>('/users'), get<Paged<RecordItem>>('/teams?size=100')]).then(([u, t]) => { setUsers(u); setTeams(t.items) }).catch(err => setError(err.message)).finally(() => setLoading(false)) }, [refresh])
  const newUser = () => { setEditingId(''); setName(''); setEmail(''); setRole('operator'); setTeamId(''); setPassword(''); setMode('create') }
  const editUser = (item: User) => { setEditingId(item.id); setName(item.name); setEmail(item.email); setRole(item.role); setTeamId(String(item.team_id || '')); setMode('edit') }
  const save = async (event: FormEvent) => {
    event.preventDefault(); setError('')
    try {
      if (mode === 'edit') await patch(`/users/${editingId}`, { name, role, team_id: teamId || null })
      else await post('/users', { name, email, role, password, team_id: teamId || null })
      setMode('closed'); setRefresh(v => v+1)
    } catch (err) { setError((err as Error).message) }
  }
  const toggle = async (id: string) => { if (!window.confirm('Alterar status deste usuário?')) return; try { await post(`/users/${id}/toggle`); setRefresh(v => v+1) } catch (err) { setError((err as Error).message) } }
  return <>
    <PageHeader eyebrow="GESTÃO / ACESSO" title="Usuários" description="Contas e perfis limitados à sua empresa." actions={<><button className="secondary-button" onClick={() => setRefresh(v => v+1)}><RefreshCw size={16}/> Atualizar</button>{['superadmin', 'admin'].includes(user?.role || '') && <button className="primary-button" onClick={newUser}><Plus size={16}/> Novo usuário</button>}</>}/>
    {error && <ErrorState message={error}/>}
    {mode !== 'closed' && <form className="panel" onSubmit={save}><h2>{mode === 'create' ? 'Novo usuário' : 'Editar usuário'}</h2><div className="form-grid"><label>Nome<input required minLength={2} value={name} onChange={e => setName(e.target.value)}/></label><label>E-mail<input required type="email" disabled={mode === 'edit'} value={email} onChange={e => setEmail(e.target.value)}/></label><label>Perfil<select value={role} onChange={e => setRole(e.target.value)}>{user?.role === 'superadmin' && <option value="superadmin">Superadministrador</option>}<option value="admin">Administrador</option><option value="supervisor">Supervisor</option><option value="operator">Operador</option><option value="analyst">Analista</option></select></label><label>Equipe<select value={teamId} onChange={e => setTeamId(e.target.value)}><option value="">Sem equipe</option>{teams.map(team => <option key={team.id} value={team.id}>{String(team.name)}</option>)}</select></label>{mode === 'create' && <label>Senha inicial<input required minLength={8} type="password" value={password} onChange={e => setPassword(e.target.value)}/></label>}</div><div className="form-actions"><button type="button" className="secondary-button" onClick={() => setMode('closed')}>Cancelar</button><button className="primary-button">Salvar</button></div></form>}
    {loading ? <LoadingState/> : <div className="panel table-panel">{users.length ? <div className="table-scroll"><table><thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Equipe</th><th>Status</th><th></th></tr></thead><tbody>{users.map(item => <tr key={item.id}><td>{item.name}</td><td>{item.email}</td><td>{item.role}</td><td>{String(teams.find(team => team.id === item.team_id)?.name || '—')}</td><td>{item.active ? 'Ativo' : 'Inativo'}</td><td>{['superadmin', 'admin'].includes(user?.role || '') && (item.role !== 'superadmin' || user?.role === 'superadmin') && <div className="inline-actions"><button className="text-button" onClick={() => editUser(item)}>Editar</button>{item.id !== user?.id && <button className="text-button" onClick={() => void toggle(item.id)}>{item.active ? 'Inativar' : 'Ativar'}</button>}</div>}</td></tr>)}</tbody></table></div> : <EmptyState/>}</div>}
  </>
}
