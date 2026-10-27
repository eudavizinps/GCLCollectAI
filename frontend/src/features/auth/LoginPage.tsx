import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { BrandLogo } from '../../components/branding/BrandLogo'
import { useAuth } from '../../app/AuthContext'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin1@demo.collectai.local')
  const [password, setPassword] = useState('Demo@12345')
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submit = async (event: FormEvent) => { event.preventDefault(); setBusy(true); setError(''); try { await login(email, password, remember); navigate('/app/dashboard') } catch (err) { setError((err as Error).message) } finally { setBusy(false) } }
  return <div className="login-page"><section className="login-art"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="login-brand"><BrandLogo large/><div className="login-rule"/><p>Gestão inteligente.<br/><em>Recuperação eficiente.</em></p><span>Inteligência, precisão e controle para cada etapa da cobrança.</span></div><div className="login-art-footer">GCL TECHNOLOGY <span>✦</span> PLATAFORMA DE INTELIGÊNCIA</div></section><section className="login-panel"><div className="login-card"><div className="eyebrow">ACESSO À PLATAFORMA <span>01 / 02</span></div><h1>Bem-vindo<br/>de volta<span>.</span></h1><p>Entre na sua conta para acessar o CollectAI.</p><form onSubmit={submit}><label>E-mail corporativo<div className="input-icon"><Mail size={18}/><input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@empresa.com"/></div></label><label>Senha<div className="input-icon"><LockKeyhole size={18}/><input type={show ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Sua senha"/><button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}>{show ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></label><div className="login-options"><label><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}/> Manter sessão</label><Link to="/recuperar-senha">Esqueceu a senha?</Link></div>{error && <div className="error-banner">{error}</div>}<button className="primary-button login-submit" disabled={busy}>{busy ? 'Entrando...' : 'Entrar na plataforma'} <ArrowRight size={18}/></button></form><div className="login-demo"><span>AMBIENTE DE DEMONSTRAÇÃO</span><p>Use as credenciais preenchidas ou consulte os demais perfis no README.</p></div></div><div className="login-panel-footer">© 2026 GCL Technology. Todos os direitos reservados.</div></section></div>
}

export function RecoverPage() { return <div className="simple-auth"><BrandLogo/><div className="panel"><h1>Recuperação de senha</h1><p>O envio de e-mails não está configurado nesta versão local. Solicite ao administrador a redefinição de sua senha.</p><Link className="primary-button" to="/login">Voltar ao login</Link></div></div> }
