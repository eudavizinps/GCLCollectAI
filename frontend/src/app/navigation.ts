import { Bell, LayoutDashboard, Users, Landmark, Layers3, FileText, Receipt, ListTodo, History, Handshake, BadgeCheck, CreditCard, Sparkles, ScanSearch, MessagesSquare, MessageCircle, BarChart3, ChartNoAxesCombined, UserCog, UsersRound, ShieldCheck, Settings, CircleUserRound } from 'lucide-react'

export const navigation = [
  { group: 'Visão geral', links: [
    { path: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard }, { path: '/app/notificacoes', label: 'Notificações', icon: Bell }] },
  { group: 'Operação', links: [
    { path: '/app/clientes', label: 'Clientes', icon: Users }, { path: '/app/credores', label: 'Credores', icon: Landmark },
    { path: '/app/carteiras', label: 'Carteiras', icon: Layers3 }, { path: '/app/contratos', label: 'Contratos', icon: FileText },
    { path: '/app/titulos', label: 'Títulos', icon: Receipt }, { path: '/app/cobrancas/fila', label: 'Fila de cobrança', icon: ListTodo },
    { path: '/app/cobrancas/ocorrencias', label: 'Ocorrências', icon: History }] },
  { group: 'Financeiro', links: [
    { path: '/app/negociacoes', label: 'Negociações', icon: Handshake }, { path: '/app/acordos', label: 'Acordos', icon: BadgeCheck }, { path: '/app/pagamentos', label: 'Pagamentos', icon: CreditCard }] },
  { group: 'Inteligência artificial', links: [
    { path: '/app/ia', label: 'Central de IA', icon: Sparkles }, { path: '/app/ia/analise', label: 'Análise de cobrança', icon: ScanSearch },
    { path: '/app/ia/negociacao', label: 'Assistente de negociação', icon: MessagesSquare }, { path: '/app/ia/comunicacao', label: 'Comunicação', icon: MessageCircle },
    { path: '/app/ia/gerencial', label: 'Analista gerencial', icon: BarChart3 }] },
  { group: 'Gestão', links: [
    { path: '/app/relatorios', label: 'Relatórios', icon: FileText }, { path: '/app/analytics', label: 'Analytics', icon: ChartNoAxesCombined },
    { path: '/app/usuarios', label: 'Usuários', icon: UserCog }, { path: '/app/equipes', label: 'Equipes', icon: UsersRound }, { path: '/app/auditoria', label: 'Auditoria', icon: ShieldCheck }] },
  { group: 'Sistema', links: [
    { path: '/app/configuracoes', label: 'Configurações', icon: Settings }, { path: '/app/perfil', label: 'Meu perfil', icon: CircleUserRound }] }
]
