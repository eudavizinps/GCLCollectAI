import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../app/AuthContext'
import { RecordPage } from '../features/records/RecordPage'
import { resources } from '../features/records/config'

afterEach(() => vi.unstubAllGlobals())

describe('RecordPage', () => {
  it('submits a customer through the API and returns to the list', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, options?: RequestInit) => {
      const path = String(input)
      const headers = { 'Content-Type': 'application/json' }
      if (path.endsWith('/auth/me')) return new Response(JSON.stringify({ id: 'u1', tenant_id: 't1', name: 'Administrador', email: 'admin@demo.local', role: 'admin', active: true }), { status: 200, headers })
      if (path.includes('/portfolios') || (path.includes('/customers') && options?.method !== 'POST')) return new Response(JSON.stringify({ items: [], total: 0, page: 1, size: 20 }), { status: 200, headers })
      if (path.endsWith('/customers') && options?.method === 'POST') return new Response(JSON.stringify({ id: 'c1', tenant_id: 't1', name: 'Maria Teste' }), { status: 200, headers })
      throw new Error(`Unexpected request: ${path}`)
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(<MemoryRouter initialEntries={['/app/clientes/novo']}><AuthProvider><Routes><Route path="/app/clientes/*" element={<RecordPage config={resources.clientes}/>}/></Routes></AuthProvider></MemoryRouter>)
    await user.type(await screen.findByLabelText('Nome / razão social'), 'Maria Teste')
    await user.type(screen.getByLabelText('CPF / CNPJ'), '12345678901')
    await user.click(screen.getByRole('button', { name: 'Salvar registro' }))
    await waitFor(() => expect(fetchMock.mock.calls.some(([path, options]) => String(path).endsWith('/customers') && options?.method === 'POST')).toBe(true))
    expect(await screen.findByRole('heading', { name: 'Clientes' })).toBeInTheDocument()
  })
})
