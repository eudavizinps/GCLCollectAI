# Estado do build — 01/11/2026

## Alteração mais recente

As pastas de testes da API e da interface foram retiradas do repositório, junto com os comandos, configurações e dependências usados apenas por elas. Os arquivos de produção Python e TypeScript foram formatados para leitura, sem mudança intencional de comportamento. A aplicação e os comandos de publicação permanecem nos mesmos caminhos.

## Verificação atual

- `npm ci` e `npm run build` em `frontend/`: passaram após a limpeza e a formatação.
- `python -m compileall -q backend/app scripts cloudflare/worker.py`: passou após a formatação Python.
- API local: iniciou normalmente; `/api/v1/health`, login e dashboard responderam `200 OK`.
- Após o envio ao GitHub, conferir o build automático no painel da Cloudflare e a resposta de `/api/v1/health`.

## Estado do produto

A demonstração usa dados fictícios, FastAPI, React e um Durable Object no Cloudflare. Os quatro agentes de IA ainda funcionam com regras determinísticas. PostgreSQL, provedor LLM real, integração bancária, envio de mensagens e recuperação de senha por e-mail não foram implementados.

As verificações automatizadas anteriores constam no histórico do Git, mas seus arquivos foram removidos por decisão do proprietário. Para mudanças futuras, conferir o build e os fluxos afetados antes de publicar.
