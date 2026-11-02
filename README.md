# CollectAI v0.1 — by GCL Technology

MVP local de gestão de cobrança para duas empresas fictícias, com API FastAPI, interface React, persistência JSON, fluxo de negociação e pagamento demonstrativo e quatro agentes de IA baseados em regras. A identidade usa as imagens GCL fornecidas pelo proprietário.

## Requisitos

- Python 3.13 ou compatível
- Node.js 20 ou superior e npm

## Início rápido no Windows (PowerShell)

```powershell
python -m pip install --target backend/.deps -r backend/requirements-local.txt
python scripts/seed_demo.py
python scripts/run_api.py
```

Em outro terminal:

```powershell
cd frontend
npm install
npm run dev
```

Abra `http://127.0.0.1:5173`. API: `http://127.0.0.1:8000/docs`.

Alternativamente, com Docker instalado: `docker compose up --build` (configuração adicionada, ainda não validada neste ambiente).

O seed não substitui dados existentes. Para recriar o ambiente fictício, execute `python scripts/seed_demo.py --reset`; um backup JSON é criado antes da troca. Os dados continuam disponíveis após reiniciar o servidor.

## Credenciais locais de demonstração

| Empresa | Perfil | E-mail | 
| --- | --- | --- | --- |
| Aurora | Administrador | `admin1@demo.collectai.local` | 
| Aurora | Superadministrador | `superadmin1@demo.collectai.local` | 
| Aurora | Supervisor | `supervisor1@demo.collectai.local` | 
| Aurora | Operador | `operator1@demo.collectai.local` | 
| Horizonte | Administrador | `admin2@demo.collectai.local` |
| Horizonte | Superadministrador | `superadmin2@demo.collectai.local` | 
| Horizonte | Supervisor | `supervisor2@demo.collectai.local` |
| Horizonte | Operador | `operator2@demo.collectai.local` |

Essas credenciais são públicas e destinam-se somente à demonstração com dados fictícios. Não use dados reais, senhas pessoais ou documentos verdadeiros nesta instância.

## Demonstração no Cloudflare

Endereço público: https://collectai-demo.davi-de-paula035.workers.dev. O fluxo de deploy por commit está documentado em [Deploy automático pelo GitHub](docs/deployment/cloudflare-git.md).

O Worker em `cloudflare/wrangler.jsonc` executa a API FastAPI e serve o build React no mesmo endereço. Um Durable Object guarda alterações feitas na demonstração entre reinicializações. Os dados iniciais são fictícios e gerados por `python scripts/export_cloudflare_seed.py`.

No Windows, execute `powershell.exe -ExecutionPolicy Bypass -File scripts/cloudflare.ps1 -Action dev` para testar em `http://127.0.0.1:8787`. Após autorizar o Wrangler com `-Action login`, publique com `-Action deploy`. O script contorna um problema do pywrangler com espaços no caminho do usuário criando temporariamente a unidade `X:`. Veja [instruções de publicação](docs/deployment/cloudflare-demo.md).

## Estrutura

```text
backend/
  app/core/          configuração, sessões e persistência
  app/domain/        regras de negócio e cálculos financeiros
  app/modules/       rotas HTTP por área
frontend/
  src/features/      telas organizadas por domínio
  src/components/    componentes reutilizáveis e marca
  src/app/           rotas, navegação e autenticação
cloudflare/          configuração e entrada do Worker
scripts/             comandos de desenvolvimento, seed e deploy
docs/               arquitetura, publicação, planejamento e status
```

O [índice da documentação](docs/README.md) explica onde encontrar cada assunto. Os diretórios `.cloudflare-build/`, `.cloudflare-dev/` e `frontend/dist/` são gerados localmente e ignorados pelo Git.

## Verificação local

```powershell
cd frontend
npm run build
```

Depois do build, execute a API e confira `/api/v1/health` e os fluxos que você alterou.

## Configuração

Veja `.env.example`. `AI_PROVIDER=demo` funciona sem chave externa. Outros valores retornam indisponibilidade explícita nesta versão. `FRONTEND_ORIGIN` define a origem permitida; `COLLECTAI_DATA_PATH` aponta para o armazenamento JSON.

## Limitações do v0.1

O produto ainda não inclui PostgreSQL, integração bancária, envio de mensagens, provedor LLM real, recuperação de senha por e-mail, editor de políticas financeiras nem exportação PDF dedicada. As páginas e fluxos principais existem, mas algumas telas de gestão têm recursos parciais. Veja [matriz de funcionalidades](docs/FEATURE_MATRIX.md) e [status de build](docs/BUILD_STATUS.md).

O cookie de sessão usa `HttpOnly` e `SameSite=Lax`; em HTTPS também usa `Secure`. A demonstração no Cloudflare ainda não é um serviço apto a receber dados reais. Antes de operação real, são necessários autenticação e proteção de acesso adequadas, gestão de segredos, proteção CSRF, banco transacional e revisão de segurança.

## Migração futura

O contrato do adapter em `backend/app/core/storage.py` pode ser substituído por repositórios SQLAlchemy com PostgreSQL e Alembic. O domínio financeiro deve continuar responsável pelos cálculos e transições. Veja [desenho de dados](docs/architecture/database-design.md).
