# Arquitetura

```text
React/Vite → /api/v1 FastAPI → módulos HTTP → regras de domínio → adapter JSON
                                      ↘ agentes demonstrativos → consultas autorizadas
```

O navegador armazena apenas a preferência visual e a posição da sidebar. A sessão vive no servidor, identificada por cookie HTTP-only. O `tenant_id` é derivado da sessão em toda requisição. O cliente não escolhe o tenant. Dados de outras empresas retornam 404.

`storage.change` faz leitura, operação e troca atômica do arquivo sob lock local exclusivo. O JSON fica fora da pasta pública do Vite. O lock protege vários processos locais, mas não substitui um banco transacional em produção. Em falha abrupta, um arquivo `.lock` órfão pode exigir remoção manual após verificar que nenhum processo usa os dados.

O domínio financeiro usa `Decimal` e é o único caminho para aceite de negociação, desconto, acordo, confirmação e estorno. CRUD de títulos é limitado à criação; histórico financeiro não é editável pelo endpoint genérico. Agentes demonstrativos usam a mesma simulação do domínio e registram execução; não confirmam pagamentos.

A interface tem módulos em `features/`, componentes compartilhados em `components/shared/`, configuração de navegação e contexto de autenticação em `app/`, cliente HTTP em `services/` e tokens visuais em `styles/`.

O mockup de parede fornecido está preservado em `frontend/public/brand/gcl-brand-reference.jpeg`; o símbolo no fundo original está em `gcl-symbol-original.jpeg` e é usado no componente `BrandLogo`. Não foi fornecida versão transparente.
