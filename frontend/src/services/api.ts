export type User = { id: string; tenant_id: string; name: string; email: string; role: string; team_id?: string | null; active: boolean }
export type RecordItem = { id: string; tenant_id: string; name?: unknown; phone?: unknown; email?: unknown; [key: string]: unknown }
export type Paged<T> = { items: T[]; total: number; page: number; size: number }

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/v1${path}`, { credentials: 'include', headers: { 'Content-Type': 'application/json', ...options.headers }, ...options })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(typeof error.detail === 'string' ? error.detail : `Erro ${response.status}`)
  }
  return response.json() as Promise<T>
}

export const get = <T,>(path: string) => api<T>(path)
export const post = <T,>(path: string, body: unknown = {}) => api<T>(path, { method: 'POST', body: JSON.stringify(body) })
export const patch = <T,>(path: string, body: unknown) => api<T>(path, { method: 'PATCH', body: JSON.stringify(body) })

export async function fetchAll<T>(path: string): Promise<T[]> {
  const all: T[] = []
  let page = 1
  while (true) {
    const separator = path.includes('?') ? '&' : '?'
    const response = await get<Paged<T>>(`${path}${separator}page=${page}&size=100`)
    all.push(...response.items)
    if (all.length >= response.total || response.items.length === 0) return all
    page += 1
  }
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return
  const keys = Array.from(new Set(rows.flatMap(Object.keys))).filter(key => key !== 'tenant_id')
  const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`
  const content = '\ufeff' + [keys.map(escape).join(';'), ...rows.map(row => keys.map(key => escape(row[key])).join(';'))].join('\r\n')
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url)
}
