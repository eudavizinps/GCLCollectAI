# API REST

Prefixo: `/api/v1`. OpenAPI interativo em `/docs` da API local.

| Módulo | Endpoints principais |
| --- | --- |
| Autenticação | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/recover` |
| Registros | `GET/POST /{resource}`, `GET/PATCH /{resource}/{id}`, `POST /{resource}/{id}/deactivate` |
| Recursos de registros | `creditors`, `portfolios`, `customers`, `contracts`, `receivables`, `occurrences`, `teams` |
| Financeiro | `POST /negotiations/simulate`, `POST /negotiations`, `POST /negotiations/{id}/approve`, `reject`, `accept`, `POST /payments`, `POST /payments/{id}/confirm`, `reverse` |
| Consulta financeira | `GET /negotiations`, `GET /agreements`, `GET /payments` e detalhes por ID |
| Gestão | `GET/POST /users`, `POST /users/{id}/toggle`, `GET/PATCH /settings`, `PATCH /profile`, `POST /profile/password` |
| Indicadores e IA | `GET /dashboard/overview`, `GET /ai/status`, `POST /ai/{agent}` |
| Histórico | `GET /audit`, `GET /notifications`, `POST /notifications/{id}/read`, `POST /notifications/read-all` |

Listagens aceitam `q`, `page` e `size` (até 100), e retornam `{items,total,page,size}`. Erros usam `detail` e status HTTP apropriado. Requisições autenticadas usam cookie HTTP-only; o front-end envia `credentials: include`.

`GET /dashboard/overview` aceita `days`, `creditor_id` e `portfolio_id`. A recuperação considera pagamentos confirmados no período; saldos em cobrança representam o estado atual da carteira selecionada.
