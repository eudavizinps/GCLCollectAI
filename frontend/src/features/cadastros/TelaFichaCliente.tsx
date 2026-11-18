import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, ArrowRightLeft, Bot, CalendarDays, ChevronDown, ClipboardList,
  Clock3, Coins, CreditCard, Download, FileText, Handshake, LayoutGrid,
  Mail, MapPin, MessageCircle, Paperclip, Pencil, Phone, Plus, UserRound,
} from 'lucide-react'
import { ErrorState, LoadingState } from '../../components/shared/EstadosPagina'
import { downloadCsv, get, patch, post, type RecordItem, type User } from '../../servicos/api'
import { useAuth } from '../../app/ContextoAutenticacao'

type CustomerRecord = {
  customer: RecordItem
  portfolio: { id: string; name: string } | null
  creditor: { id: string; name: string } | null
  can_manage: boolean
  contracts: RecordItem[]
  receivables: RecordItem[]
  agreements: RecordItem[]
  payments: RecordItem[]
  occurrences: RecordItem[]
  summary: {
    balance: string; paid: string; total: string
    due_date: string | null; delay_days: number; status: string
  }
}

type Tab = 'overview' | 'registration' | 'contracts' | 'agreements' | 'occurrences' | 'documents'

const tabs: { key: Tab; label: string; icon: typeof UserRound }[] = [
  { key: 'overview', label: 'Visão Geral', icon: LayoutGrid },
  { key: 'registration', label: 'Cadastro', icon: UserRound },
  { key: 'contracts', label: 'Contratos / Débitos', icon: FileText },
  { key: 'agreements', label: 'Acordos', icon: Handshake },
  { key: 'occurrences', label: 'Ocorrências', icon: MessageCircle },
  { key: 'documents', label: 'Documentos', icon: Paperclip },
]

const statusLabel: Record<string, string> = {
  overdue: 'Em atraso', due_today: 'Vence hoje', collection: 'Em cobrança',
  agreement: 'Acordo ativo', paid: 'Quitado', no_debt: 'Sem débitos',
  open: 'Em aberto', in_agreement: 'Em acordo', active: 'Ativo',
  confirmed: 'Confirmado', reversed: 'Estornado', inactive: 'Inativo',
}
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const money = (value: unknown) => currency.format(Number(value || 0))
const text = (value: unknown) => String(value || '—')
const date = (value: unknown) => {
  if (!value) return '—'
  const parsed = new Date(String(value).slice(0, 10) + 'T12:00:00')
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString('pt-BR')
}
const dateTime = (value: unknown) => value ? new Date(String(value)).toLocaleString('pt-BR') : '—'
const document = (value: unknown) => {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.length === 11) return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  if (digits.length === 14) return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  return text(value)
}

function Panel({ title, icon: Icon, action, children, className = '' }: {
  title: string; icon: typeof UserRound; action?: ReactNode
  children: ReactNode; className?: string
}) {
  return <section className={`customer-record-panel ${className}`}>
    <div className="customer-record-panel-heading"><h2><Icon size={21} /> {title}</h2>{action}</div>
    {children}
  </section>
}

export function CustomerRecordPage({ id }: { id: string }) {
  const { user } = useAuth()
  const [record, setRecord] = useState<CustomerRecord | null>(null)
  const [operators, setOperators] = useState<User[]>([])
  const [tab, setTab] = useState<Tab>('overview')
  const [editingContact, setEditingContact] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [operatorId, setOperatorId] = useState('')
  const [refresh, setRefresh] = useState(0)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    setTab('overview')
    setMessage('')
    setEditingContact(false)
    setShowTransfer(false)
  }, [id])

  useEffect(() => {
    let active = true
    setLoading(true)
    setRecord(null)
    setError('')
    get<CustomerRecord>(`/customers/${id}/record`)
      .then((data) => {
        if (!active) return
        setRecord(data)
        setPhone(String(data.customer.phone || ''))
        setEmail(String(data.customer.email || ''))
        setOperatorId(String(data.customer.operator_id || ''))
      })
      .catch((reason) => { if (active) setError((reason as Error).message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, refresh])

  useEffect(() => {
    if (!record?.can_manage) return
    get<User[]>(`/operators?customer_id=${encodeURIComponent(id)}`)
      .then(setOperators)
      .catch(() => setOperators([]))
  }, [id, record?.can_manage])

  const saveContact = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await patch(`/customers/${id}`, { data: { phone, email } })
      setMessage('Contato atualizado.')
      setEditingContact(false)
      setRefresh((value) => value + 1)
    } catch (reason) { setError((reason as Error).message) }
    finally { setBusy(false) }
  }

  const transfer = async (event: FormEvent) => {
    event.preventDefault()
    if (!operatorId) return
    setBusy(true)
    setError('')
    try {
      await post(`/customers/${id}/transfer`, { operator_id: operatorId })
      setMessage('Ficha atribuída ao operador selecionado.')
      setShowTransfer(false)
      setRefresh((value) => value + 1)
    } catch (reason) { setError((reason as Error).message) }
    finally { setBusy(false) }
  }

  if (loading && !record) return <LoadingState />
  if (!record) return <ErrorState message={error || 'Cliente não encontrado.'} />

  const { customer, summary, contracts, receivables, agreements, payments, occurrences } = record
  const firstContract = contracts[0]
  const initials = String(customer.name || 'C').split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  const phoneDigits = String(customer.phone || '').replace(/\D/g, '')
  const phoneLink = phoneDigits ? `tel:${phoneDigits}` : undefined
  const whatsappLink = phoneDigits ? `https://wa.me/55${phoneDigits.replace(/^55/, '')}` : undefined
  const address = [customer.address, customer.city, customer.state, customer.zip_code].filter(Boolean).join(', ')
  const status = statusLabel[summary.status] || summary.status
  const manage = record.can_manage
  const show = (section: Tab) => tab === 'overview' || tab === section

  return <div className="customer-record-page">
    <div className="customer-record-title">
      <Link to="/app/clientes" aria-label="Voltar à pesquisa"><ArrowLeft size={22} /></Link>
      <div><h1>Ficha de Atendimento</h1><p>Visualize os dados do cliente, contratos, ocorrências e registre o atendimento.</p></div>
    </div>
    {error && <div className="error-banner" role="alert">{error}</div>}
    {message && <div className="success-banner" role="status">{message}</div>}

    <div className="customer-record-top">
      <section className="customer-record-hero">
        <div className="customer-record-avatar">{initials}</div>
        <div className="customer-record-identity">
          <h2>{text(customer.name)}</h2>
          <p>{String(customer.kind) === 'company' ? 'CNPJ' : 'CPF'}: {document(customer.document)}</p>
          <p>Contrato: {text(firstContract?.number)}</p>
          <p>Credor: <span className="customer-record-chip">{record.creditor?.name || 'Não informado'}</span></p>
        </div>
        <div className="customer-record-metrics">
          <div><Clock3 size={22} /><span>Tempo de atraso</span><strong className={summary.delay_days ? 'late' : ''}>{summary.delay_days ? `${summary.delay_days} dias` : '—'}</strong></div>
          <div><Coins size={23} /><span>Valor em aberto</span><strong>{money(summary.balance)}</strong></div>
          <div><FileText size={22} /><span>Situação</span><strong className={`customer-record-status ${summary.status}`}>{status}</strong></div>
        </div>
      </section>
      <section className="customer-record-actions" aria-label="Ações do cliente">
        <div className="customer-record-action-row">
          {manage && customer.email ? <a className="customer-record-action primary" href={`mailto:${customer.email}`}><Mail size={19} /> E-mail</a> : <button disabled title="Contato indisponível para esta ficha"><Mail size={19} /> E-mail</button>}
          {manage && whatsappLink ? <a className="customer-record-action whatsapp" href={whatsappLink} target="_blank" rel="noreferrer"><MessageCircle size={19} /> WhatsApp</a> : <button disabled title="Contato indisponível para esta ficha"><MessageCircle size={19} /> WhatsApp</button>}
          {manage && <button onClick={() => setShowTransfer(!showTransfer)}><ArrowRightLeft size={19} /> Passar Ficha</button>}
        </div>
        {showTransfer && <form className="customer-record-transfer" onSubmit={transfer}>
          <label>Operador responsável
            <select value={operatorId} onChange={(event) => setOperatorId(event.target.value)} required>
              <option value="">Selecione um operador</option>
              {operators.map((operator) => <option key={operator.id} value={operator.id}>{operator.name}</option>)}
            </select>
          </label>
          <button className="primary-button" disabled={busy || !operatorId || operatorId === customer.operator_id}>Confirmar transferência</button>
        </form>}
        <button className="customer-record-ai-toggle" onClick={() => setTab('overview')}><Bot size={21} /> Agente de IA <ChevronDown size={17} /></button>
      </section>
    </div>

    <nav className="customer-record-tabs" aria-label="Seções da ficha">
      {tabs.map((item) => <button key={item.key} className={tab === item.key ? 'active' : ''}
        aria-current={tab === item.key ? 'page' : undefined} onClick={() => setTab(item.key)}>
        <item.icon size={18} /> {item.label}
      </button>)}
    </nav>

    {tab !== 'documents' && <div className={`customer-record-grid ${tab === 'overview' ? '' : 'single'}`}>
      <div className="customer-record-column">
        {show('registration') && <>
          <Panel title="Dados Cadastrais" icon={UserRound} action={user?.role !== 'operator' && <Link to={`/app/clientes/${id}/editar`}><Pencil size={15} /> Editar</Link>}>
            <div className="customer-record-fields">
              <div><span>Nome completo</span><strong>{text(customer.name)}</strong></div>
              <div><span>CPF / CNPJ</span><strong>{document(customer.document)}</strong></div>
              <div><span>Tipo</span><strong>{customer.kind === 'company' ? 'Pessoa jurídica' : 'Pessoa física'}</strong></div>
              <div><span>Status</span><strong>{statusLabel[String(customer.status)] || text(customer.status)}</strong></div>
              <div><span>Carteira / produto</span><strong>{record.portfolio?.name || '—'}</strong></div>
              <div><span>Cadastro</span><strong>{date(customer.created_at)}</strong></div>
            </div>
            {Boolean(customer.notes) && <p className="customer-record-note">{text(customer.notes)}</p>}
          </Panel>
          <Panel title="Contatos" icon={Phone} action={manage && <button onClick={() => setEditingContact(!editingContact)}><Pencil size={15} /> {editingContact ? 'Cancelar' : 'Editar'}</button>}>
            {editingContact ? <form className="customer-record-contact-form" onSubmit={saveContact}>
              <label>Telefone<input value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
              <label>E-mail<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
              <button className="primary-button" disabled={busy}>Salvar contato</button>
            </form> : <div className="customer-record-contact-list">
              <div><Phone size={17} /><span>{text(customer.phone)}</span>{manage && phoneLink && <a href={phoneLink}>Ligar</a>}</div>
              <div><Mail size={17} /><span>{text(customer.email)}</span>{manage && Boolean(customer.email) && <a href={`mailto:${customer.email}`}>Enviar</a>}</div>
            </div>}
          </Panel>
          <Panel title="Endereço" icon={MapPin} action={user?.role !== 'operator' && <Link to={`/app/clientes/${id}/editar`}><Pencil size={15} /> Editar</Link>}>
            <p className="customer-record-address">{address || 'Endereço não informado.'}</p>
            {address && <a className="customer-record-map" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" rel="noreferrer"><MapPin size={15} /> Ver no mapa</a>}
          </Panel>
        </>}
      </div>

      <div className="customer-record-column">
        {show('contracts') && <>
          <Panel title="Contratos e Débitos" icon={FileText} action={tab === 'overview' && <button onClick={() => setTab('contracts')}>Ver todos</button>}>
            {receivables.length ? <div className="customer-record-table-scroll"><table><thead><tr><th>Contrato</th><th>Título</th><th>Vencimento</th><th>Em aberto</th><th>Status</th></tr></thead>
              <tbody>{(tab === 'overview' ? receivables.slice(0, 4) : receivables).map((title) => <tr key={title.id}>
                <td>{text(contracts.find((item) => item.id === title.contract_id)?.number)}</td><td>{text(title.number)}</td>
                <td>{date(title.due_date)}</td><td>{money(title.balance)}</td>
                <td><span className="customer-record-small-status">{statusLabel[String(title.status)] || text(title.status)}</span></td>
              </tr>)}</tbody></table></div> : <p className="customer-record-empty">Nenhum débito cadastrado.</p>}
            {tab === 'contracts' && contracts.length > 0 && <p className="customer-record-note">{contracts.length} contrato(s) cadastrado(s) para este cliente.</p>}
          </Panel>
          <Panel title="Resumo Financeiro" icon={Coins}>
            <div className="customer-record-financial"><div><span>Total registrado</span><strong>{money(summary.total)}</strong></div><div><span>Pago</span><strong className="paid">{money(summary.paid)}</strong></div><div><span>Em aberto</span><strong className="open">{money(summary.balance)}</strong></div></div>
          </Panel>
          <Panel title="Últimos Pagamentos" icon={CreditCard} action={tab === 'overview' && <button onClick={() => setTab('contracts')}>Ver todos</button>}>
            {payments.length ? <div className="customer-record-table-scroll"><table><thead><tr><th>Data</th><th>Valor</th><th>Forma</th><th>Status</th></tr></thead><tbody>
              {(tab === 'overview' ? payments.slice(0, 3) : payments).map((payment) => <tr key={payment.id}><td>{date(payment.confirmed_at || payment.created_at)}</td><td>{money(payment.amount)}</td><td>{text(payment.method)}</td><td>{statusLabel[String(payment.status)] || text(payment.status)}</td></tr>)}
            </tbody></table></div> : <p className="customer-record-empty">Nenhum pagamento registrado.</p>}
          </Panel>
        </>}
        {tab === 'agreements' && <Panel title="Acordos" icon={Handshake}>
          {agreements.length ? <div className="customer-record-table-scroll"><table><thead><tr><th>Número</th><th>Total</th><th>Pago</th><th>Em aberto</th><th>Status</th></tr></thead><tbody>
            {agreements.map((agreement) => <tr key={agreement.id}><td>{text(agreement.number)}</td><td>{money(agreement.total)}</td><td>{money(agreement.paid)}</td><td>{money(agreement.balance)}</td><td>{statusLabel[String(agreement.status)] || text(agreement.status)}</td></tr>)}
          </tbody></table></div> : <p className="customer-record-empty">Nenhum acordo registrado.</p>}
        </Panel>}
      </div>

      <div className="customer-record-column">
        {show('overview') && <Panel title="Agente de IA — Cobrança" icon={Bot} className="customer-record-ai" action={<span className="customer-record-demo">Demonstração</span>}>
          <p id="agente-cliente">Consulte os agentes demonstrativos para analisar o caso, simular abordagens e preparar mensagens.</p>
          {manage ? <div className="customer-record-ai-links">
            <Link to={`/app/ia/analise?customer_id=${id}`}>Resumo do cliente</Link>
            <Link to={`/app/ia/negociacao?customer_id=${id}`}>Sugerir negociação</Link>
            <Link to={`/app/ia/comunicacao?customer_id=${id}`}>Gerar abordagem</Link>
          </div> : <p className="customer-record-note">A execução dos agentes fica disponível para a equipe responsável pela carteira.</p>}
        </Panel>}
        {show('occurrences') && <Panel title="Histórico de Ocorrências" icon={ClipboardList}
          action={occurrences.length > 0 && <button onClick={() => downloadCsv('ocorrencias-cliente.csv', occurrences)}><Download size={15} /> Exportar</button>}>
          {occurrences.length ? <div className="customer-record-timeline">
            {(tab === 'overview' ? occurrences.slice(0, 4) : occurrences).map((item) => <div key={item.id}>
              <strong>{dateTime(item.at || item.created_at)} <span>{text(item.type)}</span></strong>
              <p>{text(item.description)}</p>{Boolean(item.result) && <small>Resultado: {text(item.result)}</small>}
            </div>)}
          </div> : <p className="customer-record-empty">Nenhuma ocorrência registrada.</p>}
          {manage && <Link className="customer-record-new" to={`/app/cobrancas/ocorrencias/novo?customer_id=${id}`}><Plus size={18} /> Nova Ocorrência</Link>}
        </Panel>}
      </div>
    </div>}

    {tab === 'documents' && <Panel title="Documentos" icon={Paperclip} className="customer-record-documents">
      <p className="customer-record-empty">Ainda não há documentos cadastrados para este cliente.</p>
    </Panel>}
    {tab === 'agreements' && manage && <Link className="customer-record-new customer-record-agreement-link" to={`/app/negociacoes/nova?customer_id=${id}`}><Plus size={18} /> Nova negociação</Link>}
    {tab === 'contracts' && <div className="customer-record-return"><CalendarDays size={16} /> Próximo vencimento em aberto: {date(summary.due_date)}</div>}
  </div>
}
