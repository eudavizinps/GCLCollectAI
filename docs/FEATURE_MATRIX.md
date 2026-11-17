# Matriz de funcionalidades — 01/11/2026

## Perfis ativos — 17/11/2026

| Funcionalidade | Administrador | Supervisor | Operador |
| --- | --- | --- | --- |
| Dashboard gerencial | Sim | Sim | Não |
| Consultar clientes e carteiras | Sim | Sim | Apenas carteiras da equipe |
| Registrar ocorrências | Sim | Sim | Apenas clientes da equipe |
| Atualizar telefone e e-mail | Sim | Sim | Apenas clientes da equipe |
| Transferir ficha para outro operador | Sim | Sim | Apenas na equipe da carteira |
| Consultar agentes de IA demonstrativos | Sim | Sim | Apenas clientes da equipe; sem agente gerencial |
| Gerenciar usuários | Sim | Não | Não |
| Relatórios financeiros e analytics | Sim | Sim | Não |
| Configurar sistema | Sim | Não | Não |

O perfil `superadmin` permanece no código legado, mas não pode iniciar sessão, ser criado nem ser atribuído. A demonstração nova cria somente os três perfis ativos por empresa. Contas legadas desse perfil continuam armazenadas, porém sem acesso. O Operador acessa as carteiras ligadas à sua equipe; a transferência altera o operador responsável pela ficha e sua fila de cobrança. A matriz é inicial e fixa: a configuração de permissões adicionais pelo Administrador fica para uma etapa futura.

| Funcionalidade | Estado | Onde conferir |
| --- | --- | --- |
| Layout responsivo do login e das páginas internas | Ajustado para celular, tablet e desktop; login sem rolagem dupla e tabelas com rolagem no próprio painel | `frontend/src/styles/login.css` e `frontend/src/styles/responsive.css` |
| Login, logout e sessão | Implementado para demo | `backend/app/modules/auth.py` e `backend/app/core/security.py` |
| Visual do login inspirado no modelo roxo com efeito de vidro | Implementado com cartão compacto e centralizado; conferido localmente em desktop e celular | `frontend/src/features/auth/LoginPage.tsx` e `frontend/src/styles/login.css` |
| Entrada com Microsoft | Apenas elemento visual desativado; integração pendente | `frontend/src/features/auth/LoginPage.tsx` |
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
