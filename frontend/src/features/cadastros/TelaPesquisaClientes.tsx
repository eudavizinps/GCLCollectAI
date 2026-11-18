import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  CalendarDays, ChevronDown, ChevronLeft, ChevronRight, ClipboardList,
  Eye, FileText, Filter, IdCard, Layers3, List, MoreVertical,
  Phone, Search, SlidersHorizontal, UserRound, UsersRound, X,
} from 'lucide-react'
import { get, type Paged, type RecordItem } from '../../servicos/api'

type Filters = {
  q: string
  name: string; document: string; contract: string; phone: string
  creditor_id: string; portfolio_id: string; collection_status: string; agreement_status: string
  due_from: string; due_to: string; amount_from: string; amount_to: string
  delay_from: string; delay_to: string
}

type CustomerResult = {
  id: string; name: string; document: string; phone: string; contract: string
  creditor: string; portfolio: string; amount: string; due_date: string | null
  delay_days: number; status: string; agreement_status: string
}

const emptyFilters: Filters = {
  q: '',
  name: '', document: '', contract: '', phone: '', creditor_id: '', portfolio_id: '',
  collection_status: '', agreement_status: '', due_from: '', due_to: '',
  amount_from: '', amount_to: '', delay_from: '', delay_to: '',
}

const statuses: Record<string, string> = {
  overdue: 'Em atraso', due_today: 'Vence hoje', collection: 'Em cobrança',
  agreement: 'Acordo ativo', paid: 'Quitado',
}

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function formatDocument(value: string) {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 11) return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  if (digits.length === 14) return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  return value || '—'
}

function formatDate(value: string | null) {
  if (!value) return '—'
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

function field(
  label: string, key: keyof Filters, filters: Filters,
  setFilters: (value: Filters) => void, placeholder: string,
  Icon: typeof Search, type = 'text',
) {
  return <label className="customer-filter" key={key}>
    <span>{label}</span>
    <span className="customer-input"><Icon size={17} aria-hidden="true" />
      <input type={type} value={filters[key]} placeholder={placeholder}
        onChange={(event) => setFilters({ ...filters, [key]: event.target.value })} />
    </span>
  </label>
}

function choice(
  label: string, key: keyof Filters, filters: Filters,
  setFilters: (value: Filters) => void, Icon: typeof Search,
  options: { value: string; label: string }[],
) {
  return <label className="customer-filter" key={key}>
    <span>{label}</span>
    <span className="customer-input"><Icon size={17} aria-hidden="true" />
      <select value={filters[key]} onChange={(event) => setFilters({ ...filters, [key]: event.target.value })}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </span>
  </label>
}

function range(
  label: string, from: keyof Filters, to: keyof Filters,
  filters: Filters, setFilters: (value: Filters) => void,
  Icon: typeof Search, type: string,
) {
  return <fieldset className="customer-filter customer-range" key={from}>
    <legend>{label}</legend>
    <div className="customer-range-inputs">
      <span className="customer-input"><Icon size={17} aria-hidden="true" />
        <input aria-label={`${label} de`} type={type} min={type === 'number' ? 0 : undefined}
          step={type === 'number' ? 'any' : undefined} placeholder="De" value={filters[from]}
          onChange={(event) => setFilters({ ...filters, [from]: event.target.value })} />
      </span>
      <span className="customer-input">
        <input aria-label={`${label} até`} type={type} min={type === 'number' ? 0 : undefined}
          step={type === 'number' ? 'any' : undefined} placeholder="Até" value={filters[to]}
          onChange={(event) => setFilters({ ...filters, [to]: event.target.value })} />
      </span>
    </div>
  </fieldset>
}

export function CustomerSearchPage() {
  const [params] = useSearchParams()
  const query = params.get('q') || ''
  const [filters, setFilters] = useState<Filters>({ ...emptyFilters, name: query, q: query })
  const [applied, setApplied] = useState<Filters>({ ...emptyFilters, name: query, q: query })
  const [advanced, setAdvanced] = useState(true)
  const [creditors, setCreditors] = useState<RecordItem[]>([])
  const [portfolios, setPortfolios] = useState<RecordItem[]>([])
  const [rows, setRows] = useState<CustomerResult[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [sort, setSort] = useState('due_asc')
  const [selected, setSelected] = useState<string[]>([])
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const next = { ...emptyFilters, name: query, q: query }
    setFilters(next)
    setApplied(next)
    setPage(1)
  }, [query])

  useEffect(() => {
    Promise.all([get<Paged<RecordItem>>('/creditors?size=100'), get<Paged<RecordItem>>('/portfolios?size=100')])
      .then(([creditorData, portfolioData]) => {
        setCreditors(creditorData.items)
        setPortfolios(portfolioData.items)
      })
      .catch((reason) => setError((reason as Error).message))
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const searchParams = new URLSearchParams({ page: String(page), size: String(size), sort })
    Object.entries(applied).forEach(([key, value]) => {
      if (value && !(key === 'name' && applied.q === applied.name)) searchParams.set(key, value)
    })
    setLoading(true)
    setError('')
    get<Paged<CustomerResult>>(`/customers/search?${searchParams}`)
      .then((data) => {
        if (controller.signal.aborted) return
        setRows(data.items)
        setTotal(data.total)
        setSelected([])
      })
      .catch((reason) => { if (!controller.signal.aborted) setError((reason as Error).message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [applied, page, size, sort])

  const search = (event: FormEvent) => {
    event.preventDefault()
    setPage(1)
    setApplied({ ...filters, q: filters.name === query ? query : '' })
  }
  const clear = () => {
    setFilters({ ...emptyFilters })
    setApplied({ ...emptyFilters })
    setPage(1)
  }
  const toggleRow = (id: string) => setSelected((current) =>
    current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
  )
  const pages = Math.max(1, Math.ceil(total / size))
  const first = total ? (page - 1) * size + 1 : 0
  const last = Math.min(page * size, total)

  return <div className="customer-search-page">
    <div className="customer-page-heading">
      <span className="customer-heading-icon"><UsersRound size={28} /></span>
      <div><h1>Pesquisa de Clientes</h1><p>Encontre clientes da sua carteira e filtre conforme a necessidade.</p></div>
    </div>

    <form className="customer-search-panel" onSubmit={search}>
      <div className="customer-panel-heading">
        <h2><Filter size={21} /> Filtros de Pesquisa</h2>
        <div className="customer-panel-actions">
          <button type="button" className="customer-outline-button" onClick={clear}><X size={16} /> Limpar Filtros</button>
          <button type="button" className="customer-outline-button" aria-expanded={advanced}
            onClick={() => setAdvanced(!advanced)}><SlidersHorizontal size={17} /> Filtros Avançados <ChevronDown size={15} /></button>
        </div>
      </div>
      <div className="customer-filters-grid">
        {field('Nome do Cliente', 'name', filters, setFilters, 'Digite o nome do cliente', UserRound)}
        {field('CPF / CNPJ', 'document', filters, setFilters, '000.000.000-00', IdCard)}
        {field('Contrato', 'contract', filters, setFilters, 'Digite o nº do contrato', FileText)}
        {field('Telefone', 'phone', filters, setFilters, '(21) 90000-0000', Phone)}
        {advanced && <>
          {choice('Credor', 'creditor_id', filters, setFilters, FileText, [
            { value: '', label: 'Selecione o credor' },
            ...creditors.map((item) => ({ value: item.id, label: String(item.name || '') })),
          ])}
          {choice('Produto', 'portfolio_id', filters, setFilters, Layers3, [
            { value: '', label: 'Selecione o produto' },
            ...portfolios.map((item) => ({ value: item.id, label: String(item.name || '') })),
          ])}
          {choice('Status da Cobrança', 'collection_status', filters, setFilters, List, [
            { value: '', label: 'Todos os status' },
            ...Object.entries(statuses).map(([value, label]) => ({ value, label })),
          ])}
          {choice('Situação do Acordo', 'agreement_status', filters, setFilters, ClipboardList, [
            { value: '', label: 'Todos' }, { value: 'active', label: 'Acordo ativo' },
            { value: 'paid', label: 'Acordo quitado' }, { value: 'none', label: 'Sem acordo' },
          ])}
          {range('Vencimento', 'due_from', 'due_to', filters, setFilters, CalendarDays, 'date')}
          {range('Valor da Dívida', 'amount_from', 'amount_to', filters, setFilters, Search, 'number')}
          {range('Atraso (dias)', 'delay_from', 'delay_to', filters, setFilters, CalendarDays, 'number')}
        </>}
        <button className="customer-search-button" type="submit"><Search size={20} /> Pesquisar Clientes</button>
      </div>
    </form>

    <section className="customer-results-panel" aria-label="Resultado da pesquisa">
      <div className="customer-results-heading">
        <div className="customer-results-title"><span className="customer-list-icon"><List size={20} /></span>
          <h2>Resultado da Pesquisa</h2><span className="customer-count">{total} clientes encontrados</span>
        </div>
        <div className="customer-results-controls">
          <label>Ordenar por: <select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1) }}>
            <option value="due_asc">Vencimento (mais próximo)</option>
            <option value="due_desc">Vencimento (mais distante)</option>
            <option value="name">Nome (A–Z)</option>
            <option value="amount_desc">Maior dívida</option>
            <option value="delay_desc">Maior atraso</option>
          </select></label>
          <label>Exibir: <select value={size} onChange={(event) => { setSize(Number(event.target.value)); setPage(1) }}>
            <option value={5}>5 por página</option><option value={10}>10 por página</option>
            <option value={20}>20 por página</option><option value={50}>50 por página</option>
          </select></label>
        </div>
      </div>
      {error && <div className="error-banner" role="alert">{error}</div>}
      <div className="customer-table-scroll">
        <table className="customer-results-table">
          <thead><tr>
            <th><input type="checkbox" aria-label="Selecionar clientes da página" checked={rows.length > 0 && selected.length === rows.length}
              onChange={(event) => setSelected(event.target.checked ? rows.map((row) => row.id) : [])} /></th>
            <th>Cliente</th><th>CPF / CNPJ</th><th>Contrato</th><th>Credor</th>
            <th>Valor (R$)</th><th>Vencimento</th><th>Atraso</th><th>Status</th><th>Ações</th>
          </tr></thead>
          <tbody>
            {rows.map((row) => <tr key={row.id}>
              <td><input type="checkbox" aria-label={`Selecionar ${row.name}`} checked={selected.includes(row.id)} onChange={() => toggleRow(row.id)} /></td>
              <td className="customer-name"><Link to={`/app/clientes/${row.id}`}>{row.name}</Link><small>{row.portfolio}</small></td>
              <td>{formatDocument(row.document)}</td><td>{row.contract || '—'}</td><td>{row.creditor || '—'}</td>
              <td>{money.format(Number(row.amount))}</td><td>{formatDate(row.due_date)}</td>
              <td>{row.delay_days ? <span className="customer-delay">{row.delay_days} dias</span> : '—'}</td>
              <td><span className={`customer-status ${row.status}`}>{statuses[row.status] || row.status}</span></td>
              <td><div className="customer-row-actions">
                <Link to={`/app/clientes/${row.id}`} title="Ver cliente" aria-label={`Ver ${row.name}`}><Eye size={18} /></Link>
                {row.phone ? <a href={`tel:${row.phone.replace(/\D/g, '')}`} title={`Ligar para ${row.name}`} aria-label={`Ligar para ${row.name}`}><Phone size={17} /></a> : null}
                <div className="customer-more"><button type="button" title="Mais ações" aria-label={`Mais ações para ${row.name}`}
                  aria-expanded={openMenu === row.id} onClick={() => setOpenMenu(openMenu === row.id ? null : row.id)}><MoreVertical size={18} /></button>
                  {openMenu === row.id && <div className="customer-more-menu">
                    <Link to={`/app/clientes/${row.id}`} onClick={() => setOpenMenu(null)}>Ver ficha</Link>
                    <Link to={`/app/cobrancas/ocorrencias/novo?customer_id=${row.id}`} onClick={() => setOpenMenu(null)}>Registrar ocorrência</Link>
                  </div>}
                </div>
              </div></td>
            </tr>)}
            {!loading && rows.length === 0 && <tr><td colSpan={10} className="customer-empty">Nenhum cliente encontrado com esses filtros.</td></tr>}
            {loading && <tr><td colSpan={10} className="customer-empty">Buscando clientes...</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="customer-results-footer">
        <span>Mostrando {first} a {last} de {total} registros{selected.length ? ` · ${selected.length} selecionado(s)` : ''}</span>
        <div className="customer-pages">
          <button type="button" aria-label="Página anterior" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft size={18} /></button>
          {Array.from({ length: Math.min(5, pages) }, (_, index) => {
            const number = Math.max(1, Math.min(page - 2, pages - 4)) + index
            return <button type="button" key={number} className={page === number ? 'active' : ''}
              aria-label={`Página ${number}`} aria-current={page === number ? 'page' : undefined} onClick={() => setPage(number)}>{number}</button>
          })}
          <button type="button" aria-label="Próxima página" disabled={page >= pages} onClick={() => setPage(page + 1)}><ChevronRight size={18} /></button>
        </div>
      </div>
    </section>
  </div>
}
