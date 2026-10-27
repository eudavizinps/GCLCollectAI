# Matriz de funcionalidades — 27/10/2026

| Funcionalidade | Status | Verificação |
| --- | --- | --- |
| Login, logout, sessão e senha com scrypt | Implementado | Teste HTTP e teste de interface de login |
| Isolamento por tenant e autorização por perfil | Implementado no servidor | Testes HTTP de tenant e permissões |
| Tema escuro/claro, sidebar e navegação | Implementado | Build; visual no navegador não verificado nesta sessão |
| Credores, carteiras, clientes, contratos, títulos, ocorrências e equipes | CRUD básico | Teste HTTP do fluxo de cadastro e teste de interface do cliente |
| Fila de cobrança | Implementação básica | Sem teste de navegador |
| Simulação, desconto, aprovação, aceite e acordo | Implementado | Testes HTTP |
| Pagamento demonstrativo, confirmação, estorno e saldo dos títulos | Implementado | Testes HTTP |
| Dashboard e analytics | Métricas principais e filtros do dashboard implementados | Teste HTTP dos filtros; gráficos sem teste visual |
| Quatro agentes determinísticos | Implementados em modo demo | Testes HTTP de análise, negociação, comunicação e consulta gerencial |
| Relatórios CSV e impressão/PDF do navegador | Parcial | Sem teste de exportação |
| Usuários, perfil, configurações e notificações | Parcial | Teste HTTP de usuários e preferência de notificações |
| Auditoria | Implementação básica | Teste de bloqueio ao operador |
| Recuperação de senha por e-mail | Indisponível, sinalizado na interface | — |
| Provedor LLM real, bots e integrações externas | Pendente | — |
| PostgreSQL e migrações | Pendente | — |
| Playwright E2E e teste visual responsivo | Pendente | Automação de navegador bloqueada nesta sessão |
