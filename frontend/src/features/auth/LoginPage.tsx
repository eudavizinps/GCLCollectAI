import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ChartNoAxesColumnIncreasing, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Zap } from 'lucide-react'
import { BrandLogo } from '../../components/branding/BrandLogo'
import { useAuth } from '../../app/AuthContext'
import { homePath } from '../../app/permissions'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin1@demo.collectai.local')
  const [password, setPassword] = useState('Demo@12345')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const role = await login(email, password, remember)
      navigate(homePath(role))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <header className="login-card-header">
          <BrandLogo large />
          <h1 id="login-title">Acesse sua plataforma</h1>
          <p>Gestão de cobrança, recuperação de crédito e automação inteligente.</p>
        </header>
        <form onSubmit={submit}>
          <label className="login-field" htmlFor="login-email">
            <span><Mail size={21} /> E-mail corporativo</span>
            <input id="login-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Ex.: seuemail@empresa.com" />
          </label>
          <label className="login-field" htmlFor="login-password">
            <span><LockKeyhole size={21} /> Senha</span>
            <span className="login-password-wrap">
              <input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Sua senha" />
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={showPassword}>
                {showPassword ? <EyeOff size={23} /> : <Eye size={23} />}
              </button>
            </span>
          </label>
          <div className="login-options">
            <label className="login-remember"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />Manter sessão</label>
            <Link to="/recuperar-senha">Esqueceu a senha?</Link>
          </div>
          {error && <div className="error-banner" role="alert">{error}</div>}
          <button className="login-submit" type="submit" disabled={busy}>{busy ? 'Entrando...' : 'Entrar na plataforma'} <ArrowRight size={25} /></button>
        </form>
        <div className="login-divider"><span>ou</span></div>
        <button className="login-microsoft" type="button" disabled title="Integração Microsoft ainda não disponível">
          <span className="microsoft-mark" aria-hidden="true"><i /><i /><i /><i /></span>Entrar com Microsoft
        </button>
        <p className="login-microsoft-note">Integração Microsoft em breve</p>
        <div className="login-benefits" aria-label="Recursos da plataforma">
          <div><Zap size={31} /><span><strong>Automação</strong><small>de cobranças</small></span></div>
          <div><ChartNoAxesColumnIncreasing size={31} /><span><strong>Controle</strong><small>de resultados</small></span></div>
          <div><ShieldCheck size={34} /><span><strong>Segurança</strong><small>de acesso</small></span></div>
        </div>
      </section>
      <footer className="login-page-footer">© 2026 GCL Technology. Todos os direitos reservados.</footer>
    </main>
  )
}

export function RecoverPage() {
  return <div className="simple-auth"><BrandLogo /><div className="panel"><h1>Recuperação de senha</h1><p>O envio de e-mails não está configurado nesta versão. Solicite ao administrador a redefinição de sua senha.</p><Link className="primary-button" to="/login">Voltar ao login</Link></div></div>
}
