# Demonstração CollectAI no Cloudflare

Esta implantação usa Cloudflare Workers com Python/FastAPI, arquivos estáticos do Vite e um Durable Object SQLite para guardar o JSON fictício da demonstração. Endereço publicado: https://collectai-demo.davi-de-paula035.workers.dev.

## Publicar

No Windows PowerShell, na raiz do repositório:

```powershell
powershell.exe -ExecutionPolicy Bypass -File scripts/cloudflare.ps1 -Action login
powershell.exe -ExecutionPolicy Bypass -File scripts/cloudflare.ps1 -Action deploy
```

O login usa a autorização oficial do Wrangler por código no navegador. O script instala `uv` apenas na pasta ignorada `.cloudflare-dev`, faz o build do frontend, copia somente os arquivos necessários para uma pasta de deploy gerada e chama `pywrangler deploy`. `X:` é uma unidade temporária usada para contornar o caminho local com espaços. Se `X:` já estiver ocupado por outro local, o script interrompe sem alterá-lo.

Para desenvolvimento local, use `-Action dev` e acesse `http://127.0.0.1:8787`. Para verificar o pacote sem publicar, use `-Action check`. Para conferir a autenticação, use `-Action whoami`.

## Dados e limites

- Os dados iniciais são gerados em `backend/app/core/demo_seed.py` a partir de `scripts/seed_demo.py` e contêm somente pessoas e operações fictícias.
- O Durable Object guarda as alterações da demonstração. Publicar uma nova versão não deve apagar esse estado; mudanças no seed só serão usadas ao iniciar uma instância vazia ou ao mudar deliberadamente a chave de armazenamento.
- As credenciais `@demo.collectai.local` e a senha `Demo@12345` são públicas. Não insira dados reais nem senhas pessoais.
- O hash portátil usado pelo Python Worker protege apenas essas credenciais públicas de demonstração. O ambiente local continua usando scrypt. Esta configuração não serve para operação real com clientes.
- O serviço ainda não tem integração bancária, envio de mensagens, provedor LLM real, política de acesso no Cloudflare Access ou recuperação de senha por e-mail.
- Para um endereço próprio, configure a rota ou domínio personalizado no painel Cloudflare depois de validar o endereço `workers.dev`.

## Verificações locais

Com `-Action dev`, foram verificados `/`, a navegação `/app/dashboard`, `/api/v1/health`, login, dashboard, leitura e criação de cliente fictício. No endereço público, foram verificados `/`, `/app/dashboard`, health, login com cookie `Secure` e leitura do dashboard. O pacote enviado tinha 9,5 MiB. Os testes da API e o build frontend também devem passar antes de cada publicação.
