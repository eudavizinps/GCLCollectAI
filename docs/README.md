# Guia do repositório

Comece pelo [README principal](../README.md) para instalar e executar o CollectAI. Este índice ajuda a encontrar o código e a documentação por responsabilidade.

## Onde procurar

| Assunto | Local |
| --- | --- |
| Rotas e autenticação da API | `backend/app/modules/` e `backend/app/core/seguranca.py` |
| Regras e cálculos financeiros | `backend/app/domain/financial.py` |
| Persistência local e no Worker | `backend/app/core/storage.py` |
| Telas e fluxos da interface | `frontend/src/features/`, separados por domínio |
| Componentes compartilhados | `frontend/src/components/shared/` |
| Navegação e sessão da interface | `frontend/src/app/` |
| Configuração Cloudflare | `cloudflare/` |
| Comandos para executar, popular e publicar | `scripts/` |

O [mapa de arquivos](arquitetura/mapa-de-arquivos.md) detalha os arquivos principais. As regras de contribuição e os limites de segurança estão em [AGENTS.md](../AGENTS.md).

## Documentação por assunto

### Arquitetura e regras

- [Visão da arquitetura](arquitetura/visao-geral.md)
- [Rotas da API](arquitetura/api.md)
- [Regras de negócio](arquitetura/regras-de-negocio.md)
- [Desenho de dados](arquitetura/modelo-de-dados.md)
- [Mapa de arquivos](arquitetura/mapa-de-arquivos.md)

### Publicação

- [Demonstração no Cloudflare](publicacao/cloudflare-demo.md)
- [Deploy automático pelo GitHub](publicacao/cloudflare-github.md)

### Planejamento e acompanhamento

- [Backlog](planejamento/pendencias.md)
- [Plano histórico de commits](planejamento/plano-de-commits.md)
- [Matriz de funcionalidades](FEATURE_MATRIX.md)
- [Estado do build](BUILD_STATUS.md)

## Antes de abrir uma alteração

1. Identifique o domínio afetado e mantenha novas telas dentro de `frontend/src/features/<domínio>/`.
2. Mantenha rotas em `backend/app/modules/` e regras financeiras em `backend/app/domain/financial.py`. Consultas organizacionais usam o tenant da sessão.
3. Rode `npm run build` em `frontend/` e confira manualmente os fluxos afetados.
4. Atualize a matriz e o estado do build quando uma funcionalidade mudar. Confira também o comando de deploy se alterar `scripts/stage_cloudflare.py` ou `cloudflare/`.

Pastas como `frontend/dist/`, `.cloudflare-build/` e `.cloudflare-dev/` são artefatos gerados e não fazem parte do código versionado.
