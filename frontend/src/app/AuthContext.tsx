import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { get, post, type User } from '../services/api'

type Auth = { user: User | null; loading: boolean; login: (email: string, password: string, remember: boolean) => Promise<void>; logout: () => Promise<void>; refresh: () => Promise<void> }
const Context = createContext<Auth | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const refresh = async () => { try { setUser(await get<User>('/auth/me')) } catch { setUser(null) } finally { setLoading(false) } }
  useEffect(() => { void refresh() }, [])
  const login = async (email: string, password: string, remember: boolean) => { setUser(await post<User>('/auth/login', { email, password, remember })) }
  const logout = async () => { await post('/auth/logout'); setUser(null) }
  return <Context.Provider value={{ user, loading, login, logout, refresh }}>{children}</Context.Provider>
}

export function useAuth() { const value = useContext(Context); if (!value) throw new Error('AuthProvider ausente'); return value }
