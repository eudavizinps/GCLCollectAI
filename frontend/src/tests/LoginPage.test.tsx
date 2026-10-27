import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../app/AuthContext'
import { LoginPage } from '../features/auth/LoginPage'

afterEach(() => vi.unstubAllGlobals())

describe('LoginPage', () => {
  it('shows a server error and then enters with valid credentials', async () => {
    let valid = false
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input)
      if (path.endsWith('/auth/me')) return new Response(JSON.stringify({ detail: 'Sem sessão' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
      if (path.endsWith('/auth/login')) return valid
        ? new Response(JSON.stringify({ id: 'u1', tenant_id: 't1', name: 'Administrador', email: 'admin1@demo.collectai.local', role: 'admin', active: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        : new Response(JSON.stringify({ detail: 'E-mail ou senha inválidos' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
      throw new Error(`Unexpected request: ${path}`)
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(<MemoryRouter initialEntries={['/login']}><AuthProvider><Routes><Route path="/login" element={<LoginPage/>}/><Route path="/app/dashboard" element={<div>Dashboard recebido</div>}/></Routes></AuthProvider></MemoryRouter>)
    const button = await screen.findByRole('button', { name: /Entrar na plataforma/ })
    await user.click(button)
    expect(await screen.findByText('E-mail ou senha inválidos')).toBeInTheDocument()
    valid = true
    await user.click(button)
    expect(await screen.findByText('Dashboard recebido')).toBeInTheDocument()
    await waitFor(() => expect(fetchMock.mock.calls.filter(([path]) => String(path).endsWith('/auth/login'))).toHaveLength(2))
  })
})
