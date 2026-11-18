export type Role = 'admin' | 'supervisor' | 'operator'

export const homePath = (role: string) =>
  role === 'operator' ? '/app/cobrancas/fila' : '/app/dashboard'

export function canAccessPath(role: string, path: string): boolean {
  if (!['admin', 'supervisor', 'operator'].includes(role)) return false
  if (
    path.startsWith('/app/dashboard') ||
    path.startsWith('/app/relatorios') ||
    path.startsWith('/app/analytics')
  )
    return role !== 'operator'
  if (path.startsWith('/app/usuarios') || path.startsWith('/app/configuracoes'))
    return role === 'admin'
  if (path.startsWith('/app/auditoria') || path.startsWith('/app/ia/gerencial'))
    return role !== 'operator'
  if (role === 'operator' && /\/(novo|editar)$/.test(path))
    return path.startsWith('/app/cobrancas/ocorrencias/novo') || path.startsWith('/app/negociacoes/nova')
  return true
}
