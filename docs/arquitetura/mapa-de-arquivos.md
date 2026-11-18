# Mapa de arquivos

## Interface

| O que procurar | Onde fica |
| --- | --- |
| Entrada do React e rotas | `frontend/src/main.tsx`, `frontend/src/app/Aplicacao.tsx` |
| Sessão, permissões e menu | `frontend/src/app/ContextoAutenticacao.tsx`, `permissoes.ts`, `navegacao.ts` |
| Login e recuperação de senha | `frontend/src/features/autenticacao/TelaLogin.tsx` |
| Painel e indicadores | `frontend/src/features/painel/`, `frontend/src/features/indicadores/` |
| Clientes, carteiras e demais cadastros | `frontend/src/features/cadastros/` |
| Fila de cobrança e operações financeiras | `frontend/src/features/cobrancas/`, `frontend/src/features/financeiro/` |
| Agentes de IA demonstrativos | `frontend/src/features/agentes_ia/` |
| Usuários, relatórios e configurações | `frontend/src/features/usuarios/`, `relatorios/`, `configuracoes/` |
| Perfil e notificações | `frontend/src/features/perfil/`, `notificacoes/` |
| Componentes reutilizáveis e marca | `frontend/src/components/shared/`, `frontend/src/components/marca/` |
| Estrutura visual, estilos e cliente HTTP | `frontend/src/estrutura/`, `frontend/src/estilos/`, `frontend/src/servicos/api.ts` |

## API e publicação

| O que procurar | Onde fica |
| --- | --- |
| Entrada da API | `backend/app/main.py` |
| Rotas de autenticação, administração e cadastros | `backend/app/modules/autenticacao.py`, `administracao.py`, `cadastros.py` |
| Rotas financeiras, indicadores e IA | `backend/app/modules/financeiro.py`, `indicadores_ia.py` |
| Regras de permissão e utilitários do domínio | `backend/app/domain/permissoes.py`, `comum.py` |
| Cálculo financeiro autoritativo | `backend/app/domain/financial.py` |
| Segurança, configuração e armazenamento | `backend/app/core/seguranca.py`, `configuracao.py`, `storage.py` |
| Dados e acessos fictícios da demonstração | `backend/app/core/dados_demo.py`, `acessos_demo.py` |
| Iniciar API, gerar dados e preparar deploy | `scripts/run_api.py`, `seed_demo.py`, `stage_cloudflare.py` |
| Entrada e configuração do Worker | `cloudflare/worker.py`, `cloudflare/wrangler.jsonc` |

As pastas `frontend/`, `backend/`, `scripts/` e `cloudflare/` mantêm seus nomes porque os comandos de build e publicação usam esses caminhos. Dentro delas, as funcionalidades estão identificadas em português.
