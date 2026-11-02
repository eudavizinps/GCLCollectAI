# Matriz de funcionalidades — 01/11/2026

| Funcionalidade | Estado | Onde conferir |
| --- | --- | --- |
| Login, logout e sessão | Implementado para demo | `backend/app/modules/auth.py` e `backend/app/core/security.py` |
| Isolamento por tenant e autorização por perfil | Implementado no servidor | `backend/app/domain/common.py` e dependências de autenticação |
| Tema escuro/claro, sidebar e navegação | Implementado | `frontend/src/layouts/` e `frontend/src/styles/` |
| Credores, carteiras, clientes, contratos, títulos, ocorrências e equipes | CRUD básico | `backend/app/modules/records.py` e `frontend/src/features/records/` |
| Fila de cobrança | Implementação básica | `frontend/src/features/collections/` |
| Simulação, desconto, aprovação, aceite e acordo | Implementado | `backend/app/domain/financial.py` e `backend/app/modules/finance.py` |
| Pagamento demonstrativo, confirmação, estorno e saldo dos títulos | Implementado | `backend/app/modules/finance.py` |
| Dashboard e analytics | Métricas principais e filtros do dashboard implementados | `backend/app/modules/insights.py` |
| Quatro agentes determinísticos | Implementados em modo demo | `backend/app/modules/insights.py` e `frontend/src/features/ai/` |
| Relatórios CSV e impressão/PDF do navegador | Parcial | `frontend/src/features/management/` |
| Usuários, perfil, configurações e notificações | Parcial | `backend/app/modules/admin.py` e respectivas telas |
| Auditoria | Implementação básica | `backend/app/domain/common.py` |
| Recuperação de senha por e-mail | Indisponível, sinalizado na interface | — |
| Provedor LLM real, bots e integrações externas | Pendente | — |
| PostgreSQL e migrações | Pendente | — |
| Demonstração Cloudflare (FastAPI, React e Durable Object) | Publicada | `cloudflare/` e [guia de publicação](deployment/cloudflare-demo.md) |

As pastas de testes automatizados foram removidas em 01/11/2026 a pedido do proprietário. O estado funcional acima não mudou; cada fluxo alterado precisa de conferência manual antes de ser considerado pronto.
