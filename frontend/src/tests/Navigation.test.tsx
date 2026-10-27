import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from '../app/AuthContext'
import { DashboardLayout } from '../layouts/DashboardLayout'

afterEach(() => vi.unstubAllGlobals())

function ProtectedLayout() {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return null
  return <DashboardLayout><div data-testid="location">{location.pathname}</div></DashboardLayout>
}

describe('navigation', () => {
  it('navigates to customers and hides management links from operators', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input)
      const headers = { 'Content-Type': 'application/json' }
      if (path.endsWith('/auth/me')) return new Response(JSON.stringify({ id: 'u1', tenant_id: 't1', name: 'Operador', email: 'operador@demo.local', role: 'operator', active: true }), { status: 200, headers })
      if (path.startsWith('/api/v1/notifications')) return new Response(JSON.stringify({ items: [], total: 0, page: 1, size: 100 }), { status: 200, headers })
      throw new Error(`Unexpected request: ${path}`)
    }))
    const user = userEvent.setup()
    render(<MemoryRouter initialEntries={['/app/dashboard']}><AuthProvider><Routes><Route path="/app/*" element={<ProtectedLayout/>}/></Routes></AuthProvider></MemoryRouter>)
    expect(await screen.findByRole('link', { name: 'Clientes' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Usuários' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Clientes' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/app/clientes')
  })
})
