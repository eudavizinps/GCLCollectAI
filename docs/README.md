# Guia do repositório

Comece pelo [README principal](../README.md) para instalar e executar o CollectAI. Este índice ajuda a encontrar o código e a documentação por responsabilidade.

## Onde procurar

| Assunto | Local |
| --- | --- |
| Rotas e autenticação da API | `backend/app/modules/` e `backend/app/core/security.py` |
| Regras e cálculos financeiros | `backend/app/domain/financial.py` |
| Persistência local e no Worker | `backend/app/core/storage.py` |
| Testes da API | `backend/tests/` |
| Telas e fluxos da interface | `frontend/src/features/`, separados por domínio |
| Componentes compartilhados | `frontend/src/components/shared/` |
| Navegação e sessão da interface | `frontend/src/app/` |
| Testes da interface | `frontend/src/tests/` |
| Configuração Cloudflare | `cloudflare/` |
| Comandos para executar, popular e publicar | `scripts/` |

O [mapa de arquivos](architecture/file-map.md) detalha os arquivos principais. As regras de contribuição e os limites de segurança estão em [AGENTS.md](../AGENTS.md).

## Documentação por assunto

### Arquitetura e regras

- [Visão da arquitetura](architecture/overview.md)
- [Rotas da API](architecture/api.md)
- [Regras de negócio](architecture/business-rules.md)
- [Desenho de dados](architecture/database-design.md)
- [Mapa de arquivos](architecture/file-map.md)

### Publicação

- [Demonstração no Cloudflare](deployment/cloudflare-demo.md)
- [Deploy automático pelo GitHub](deployment/cloudflare-git.md)

### Planejamento e acompanhamento

- [Backlog](planning/backlog.md)
- [Plano histórico de commits](planning/commit-plan.md)
- [Matriz de funcionalidades](FEATURE_MATRIX.md)
- [Estado do build](BUILD_STATUS.md)

## Antes de abrir uma alteração

1. Identifique o domínio afetado e mantenha novas telas dentro de `frontend/src/features/<domínio>/`.
2. Mantenha rotas em `backend/app/modules/` e regras financeiras em `backend/app/domain/financial.py`. Consultas organizacionais usam o tenant da sessão.
3. Rode `python scripts/run_tests.py` na raiz e `npm run build` em `frontend/`. Para mudanças na interface, rode também `npm test` em `frontend/`.
4. Atualize a matriz e o estado do build quando uma funcionalidade mudar. Confira também o comando de deploy se alterar `scripts/stage_cloudflare.py` ou `cloudflare/`.

Pastas como `frontend/dist/`, `.cloudflare-build/` e `.cloudflare-dev/` são artefatos gerados e não fazem parte do código versionado.
