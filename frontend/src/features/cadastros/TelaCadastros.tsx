import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Download, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import { PageHeader } from '../../components/shared/CabecalhoPagina'
import { EmptyState, ErrorState, LoadingState } from '../../components/shared/EstadosPagina'
import {
  downloadCsv,
  fetchAll,
  get,
  patch,
  post,
  type Paged,
  type RecordItem,
  type User,
} from '../../servicos/api'
import { fieldLabel, type Field, type ResourceConfig } from './configuracaoCadastros'
import { useAuth } from '../../app/ContextoAutenticacao'

function label(item: RecordItem) {
  return String(item.name || item.number || item.code || item.id)
}
function format(value: unknown, key: string, related: Record<string, RecordItem[]>) {
  if (value == null || value === '') return '—'
  if (key.endsWith('_id'))
    return label(
      Object.values(related)
        .flat()
        .find((item) => item.id === value) || { id: String(value), tenant_id: '' },
    )
  if (['balance', 'principal', 'amount'].includes(key))
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
      Number(value),
    )
  if (key === 'at') return new Date(String(value)).toLocaleString('pt-BR')
  if (key === 'status')
    return (
      (
        { active: 'Ativo', inactive: 'Inativo', open: 'Aberto', paid: 'Quitado' } as Record<
          string,
          string
        >
      )[String(value)] || String(value)
    )
  return String(value)
}

export function RecordPage({ config }: { config: ResourceConfig }) {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const suffix = location.pathname.slice(config.path.length).split('/').filter(Boolean)
  const mode =
    suffix[0] === 'novo'
      ? 'create'
      : suffix.length > 1 && suffix[1] === 'editar'
        ? 'edit'
        : suffix.length
          ? 'detail'
          : 'list'
  const itemId = mode === 'create' || mode === 'list' ? '' : suffix[0]
  const [items, setItems] = useState<RecordItem[]>([])
  const [total, setTotal] = useState(0)
  const [detail, setDetail] = useState<RecordItem | null>(null)
  const [operators, setOperators] = useState<User[]>([])
  const [selectedOperator, setSelectedOperator] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [related, setRelated] = useState<Record<string, RecordItem[]>>({})
  const [form, setForm] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)
  const query = params.get('q') || ''
  const page = Number(params.get('page') || 1)
  useEffect(() => {
    setLoading(true)
    setError('')
    get<Paged<RecordItem>>(
      `/${config.resource}?page=${page}&size=20&q=${encodeURIComponent(query)}`,
    )
      .then((data) => {
        setItems(data.items)
        setTotal(data.total)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [config.resource, page, query, refresh])
  useEffect(() => {
    if (itemId)
      get<RecordItem>(`/${config.resource}/${itemId}`)
        .then((item) => {
          setDetail(item)
          if (config.resource === 'customers') {
            setPhone(String(item.phone || ''))
            setEmail(String(item.email || ''))
            setSelectedOperator(String(item.operator_id || ''))
          }
        })
        .catch((err) => setError(err.message))
    else setDetail(null)
  }, [config.resource, itemId, refresh])
  useEffect(() => {
    if (config.resource !== 'customers' || !itemId || detail?.id !== itemId || detail.can_manage === false) return
    get<User[]>(`/operators?customer_id=${encodeURIComponent(itemId)}`)
      .then(setOperators)
      .catch((err) => setError(err.message))
  }, [config.resource, itemId, detail?.id, detail?.can_manage, refresh])
  useEffect(() => {
    const refs = [
      ...new Set(config.fields.map((field) => field.resource).filter(Boolean)),
    ] as string[]
    Promise.all(
      refs.map(
        async (resource) =>
          [
            resource,
            resource === 'portfolios' && config.resource === 'customers'
              ? (await get<{ portfolios: { id: string; name: string }[] }>('/customers/search?size=1')).portfolios.map(
                  (item) => ({ ...item, tenant_id: '' }),
                )
              : resource === 'users'
              ? await get<RecordItem[]>('/users')
              : (await get<Paged<RecordItem>>(`/${resource}?size=100`)).items,
          ] as const,
      ),
    )
      .then((entries) => setRelated(Object.fromEntries(entries)))
      .catch(() => {})
  }, [config.fields])
  useEffect(() => {
    if (mode === 'edit' && detail)
      setForm(
        Object.fromEntries(
          config.fields.map((field) => [field.key, String(detail[field.key] ?? '')]),
        ),
      )
    else if (mode === 'create')
      setForm({
        kind: 'person',
        status: 'active',
        type: 'ligacao',
        channel: 'telefone',
        customer_id: params.get('customer_id') || '',
      })
  }, [mode, detail, config.fields])
  const search = (value: string) => {
    setParams(value ? { q: value } : {})
  }
  const save = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const data = Object.fromEntries(Object.entries(form).filter(([, value]) => value !== ''))
      if (mode === 'edit') await patch(`/${config.resource}/${itemId}`, { data })
      else await post(`/${config.resource}`, { data })
      setRefresh((v) => v + 1)
      navigate(config.path)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const deactivate = async () => {
    if (!detail || !window.confirm(`Inativar ${config.singular}?`)) return
    try {
      await post(`/${config.resource}/${detail.id}/deactivate`)
      navigate(config.path)
      setRefresh((v) => v + 1)
    } catch (err) {
      setError((err as Error).message)
    }
  }
  const saveContact = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await patch(`/customers/${itemId}`, { data: { phone, email } })
      setMessage('Contato atualizado.')
      setRefresh((value) => value + 1)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const transferCustomer = async () => {
    if (!selectedOperator) return
    setBusy(true)
    setError('')
    try {
      await post(`/customers/${itemId}/transfer`, { operator_id: selectedOperator })
      setMessage('Ficha atribuída ao operador.')
      setRefresh((value) => value + 1)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const exportRows = async () => {
    try {
      const rows = await fetchAll<RecordItem>(`/${config.resource}?q=${encodeURIComponent(query)}`)
      downloadCsv(`${config.resource}.csv`, rows)
    } catch (err) {
      setError((err as Error).message)
    }
  }
  const canEdit =
    !config.readOnly &&
    ['admin', 'supervisor'].includes(user?.role || '')
  const canCreate = canEdit || (config.resource === 'occurrences' && user?.role === 'operator')
  const canManageCustomer = detail?.can_manage !== false
  const customerActions =
    config.resource === 'customers' && detail && canManageCustomer ? (
      <div className="inline-actions">
        <Link
          className="secondary-button"
          to={`/app/cobrancas/ocorrencias/novo?customer_id=${detail.id}`}
        >
          Registrar contato
        </Link>
        <Link className="primary-button" to={`/app/negociacoes/nova?customer_id=${detail.id}`}>
          Negociar
        </Link>
        <Link className="secondary-button" to={`/app/ia/analise?customer_id=${detail.id}`}>
          Analisar com IA
        </Link>
      </div>
    ) : null
  const details = useMemo(
    () =>
      detail
        ? Object.entries(detail).filter(([key]) => !['id', 'tenant_id', 'operator_id', 'can_manage'].includes(key))
        : [],
    [detail],
  )
  if (mode === 'create' || mode === 'edit')
    return (
      <>
        <PageHeader
          eyebrow="CADASTRO / OPERAÇÃO"
          title={mode === 'create' ? `Novo ${config.singular}` : `Editar ${config.singular}`}
          description="Preencha os campos e salve para atualizar os dados da empresa."
          actions={
            <Link className="secondary-button" to={config.path}>
              <ArrowLeft size={16} /> Voltar
            </Link>
          }
        />
        <form className="panel record-form" onSubmit={save}>
          <div className="form-grid">
            {config.fields.map((field) => (
              <FieldInput
                key={field.key}
                field={field}
                value={form[field.key] || ''}
                set={(value) => setForm((current) => ({ ...current, [field.key]: value }))}
                related={related}
              />
            ))}
          </div>
          {error && <div className="error-banner">{error}</div>}
          <div className="form-actions">
            <Link to={config.path} className="secondary-button">
              Cancelar
            </Link>
            <button className="primary-button" disabled={busy}>
              {busy ? 'Salvando...' : 'Salvar registro'}
            </button>
          </div>
        </form>
      </>
    )
  if (mode === 'detail')
    return (
      <>
        <PageHeader
          eyebrow="DETALHES / OPERAÇÃO"
          title={detail ? label(detail) : config.singular}
          description={`Detalhes do ${config.singular}.`}
          actions={
            <>
              <Link className="secondary-button" to={config.path}>
                <ArrowLeft size={16} /> Voltar
              </Link>
              {canEdit && !['receivables', 'occurrences'].includes(config.resource) && (
                <Link className="primary-button" to={`${config.path}/${itemId}/editar`}>
                  <Pencil size={16} /> Editar
                </Link>
              )}
            </>
          }
        />
        {error && <ErrorState message={error} />}{' '}
        {message && <div className="success-banner">{message}</div>}
        {!detail ? (
          <LoadingState />
        ) : (
          <>
            <div className="panel detail-grid">
              {details.map(([key, value]) => (
                <div key={key}>
                  <span>{fieldLabel(key)}</span>
                  <strong>{format(value, key, related)}</strong>
                </div>
              ))}
            </div>
            {customerActions}
            {config.resource === 'customers' && canManageCustomer && (
              <div className="dashboard-grid">
                <form className="panel customer-contact-panel" onSubmit={saveContact}>
                  <h2>Atualizar contato</h2>
                  <div className="form-grid">
                    <label>
                      Telefone
                      <input value={phone} onChange={(event) => setPhone(event.target.value)} />
                    </label>
                    <label>
                      E-mail
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                      />
                    </label>
                  </div>
                  <button className="primary-button" disabled={busy}>Salvar contato</button>
                </form>
                <div className="panel customer-transfer-panel">
                  <h2>Transferir ficha</h2>
                  <label>
                    Operador da equipe responsável
                    <select
                      value={selectedOperator}
                      onChange={(event) => setSelectedOperator(event.target.value)}
                    >
                      <option value="">Selecione...</option>
                      {operators.map((operator) => (
                        <option key={operator.id} value={operator.id}>
                          {operator.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="primary-button"
                    disabled={busy || !selectedOperator || selectedOperator === detail.operator_id}
                    onClick={() => void transferCustomer()}
                  >
                    Atribuir operador
                  </button>
                </div>
              </div>
            )}
            {canEdit &&
              ['customers', 'creditors', 'portfolios', 'contracts', 'teams'].includes(
                config.resource,
              ) && (
                <button className="danger-button" onClick={() => void deactivate()}>
                  <Trash2 size={16} /> Inativar
                </button>
              )}
          </>
        )}
      </>
    )
  return (
    <>
      <PageHeader
        title={config.title}
        description={config.description}
        actions={
          <>
            <button className="secondary-button" onClick={() => setRefresh((v) => v + 1)}>
              <RefreshCw size={16} /> Atualizar
            </button>
            <button className="secondary-button" onClick={() => void exportRows()}>
              <Download size={16} /> Exportar CSV
            </button>
            {canCreate && (
              <Link className="primary-button" to={`${config.path}/novo`}>
                <Plus size={17} /> Novo {config.singular}
              </Link>
            )}
          </>
        }
      />
      <div className="panel table-panel">
        <div className="table-toolbar">
          <div className="search-field">
            <Search size={17} />
            <input
              value={query}
              onChange={(e) => search(e.target.value)}
              placeholder={`Buscar ${config.title.toLowerCase()}...`}
            />
          </div>
          <span>{total} registros</span>
        </div>
        {error && <ErrorState message={error} retry={() => setRefresh((v) => v + 1)} />}{' '}
        {loading ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {config.columns.map((key) => (
                    <th key={key}>{fieldLabel(key)}</th>
                  ))}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} onClick={() => navigate(`${config.path}/${item.id}`)}>
                    {config.columns.map((key) => (
                      <td key={key}>{format(item[key], key, related)}</td>
                    ))}
                    <td>
                      <Link to={`${config.path}/${item.id}`} onClick={(e) => e.stopPropagation()}>
                        Visualizar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="pagination">
          <span>
            Página {page} de {Math.max(1, Math.ceil(total / 20))}
          </span>
          <div>
            <button
              disabled={page <= 1}
              onClick={() => setParams({ page: String(page - 1), ...(query ? { q: query } : {}) })}
            >
              Anterior
            </button>
            <button
              disabled={page * 20 >= total}
              onClick={() => setParams({ page: String(page + 1), ...(query ? { q: query } : {}) })}
            >
              Próxima
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function FieldInput({
  field,
  value,
  set,
  related,
}: {
  field: Field
  value: string
  set: (value: string) => void
  related: Record<string, RecordItem[]>
}) {
  return (
    <label className={field.type === 'textarea' ? 'wide' : ''}>
      {field.label}
      {field.type === 'select' ? (
        <select required={field.required} value={value} onChange={(e) => set(e.target.value)}>
          <option value="">Selecione...</option>
          {field.options?.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
          {field.resource &&
            (related[field.resource] || []).map((item) => (
              <option key={item.id} value={item.id}>
                {label(item)}
              </option>
            ))}
        </select>
      ) : field.type === 'textarea' ? (
        <textarea value={value} onChange={(e) => set(e.target.value)} rows={4} />
      ) : (
        <input
          required={field.required}
          type={field.type || 'text'}
          step={field.type === 'number' ? '0.01' : undefined}
          min={field.type === 'number' ? '0' : undefined}
          value={value}
          onChange={(e) => set(e.target.value)}
        />
      )}
    </label>
  )
}
