# Estado do build — 01/11/2026

## Pesquisa de clientes — 18/11/2026

A rota `/app/clientes` abre o painel de pesquisa inspirado no modelo enviado. A API `/api/v1/customers/search` calcula valor em aberto, vencimento, atraso e situação do acordo a partir dos registros do tenant, com filtros e paginação no servidor. A busca do Operador utiliza somente os clientes e registros das carteiras autorizadas da equipe.

Verificação local: `npm run build` em `frontend/`, compilação Python, preparação do pacote Cloudflare e `git diff --check` passaram. A API retornou 30 clientes para Administrador e Supervisor e 15 para Operador; buscas do Operador por documento e contrato retornaram somente o cliente correspondente. Filtros por credor, carteira, acordo, valor e atraso, além de ordenação, paginação e busca sem resultados, responderam corretamente. A conferência visual automática não foi possível nesta sessão porque o acesso ao navegador estava indisponível.

## Nomes e localização do código — 18/11/2026

As telas em `frontend/src/features/` foram agrupadas em pastas de domínio com nomes em português. Arquivos de entrada, sessão, navegação, componentes, estilos e serviços receberam nomes mais claros. As rotas da API agora estão em módulos chamados `autenticacao.py`, `administracao.py`, `cadastros.py`, `financeiro.py` e `indicadores_ia.py`. Os guias ficam em `docs/arquitetura/`, `docs/publicacao/` e `docs/planejamento/`. O [mapa de arquivos](arquitetura/mapa-de-arquivos.md) aponta para cada área.

Os caminhos exigidos pelas ferramentas e pelas regras do projeto, como `backend/app/core/storage.py`, `backend/app/domain/financial.py`, `scripts/seed_demo.py` e `frontend/src/components/shared/`, foram mantidos. As URLs da aplicação e da API não foram alteradas. O build do frontend, a compilação Python, o início da API, as rotas principais e a preparação do pacote Cloudflare passaram após a reorganização.

## Acessos demonstrativos — 17/11/2026

Os acessos de Administrador, Supervisor e Operador da empresa Aurora foram alterados para as três credenciais de teste fornecidas pelo proprietário. O seed novo e o armazenamento local usam os novos dados. Uma migração única no adapter de armazenamento atualiza as contas já persistidas na Cloudflare sem apagar os dados fictícios; sessões anteriores dessas contas são encerradas. A empresa Horizonte mantém os acessos demonstrativos anteriores.

Verificação local: os três logins novos responderam `200`, enquanto o e-mail antigo do Administrador respondeu `401`. O seed local, o pacote da Cloudflare e a migração idempotente foram conferidos. `npm run build` em `frontend/` e a compilação Python passaram.

## Login compacto — 17/11/2026

O cartão foi reduzido novamente em largura, tipografia e espaçamento. O botão da Microsoft, o separador e a nota de integração foram removidos. Em telas de até 400 px, o bloco de benefícios é ocultado para priorizar o formulário. O layout continua centralizado e mantém os campos acessíveis em telas pequenas.

`npm run build` em `frontend/` passou; a busca no código confirmou que não restam componentes ou estilos da entrada Microsoft. A conferência visual automatizada nesta revisão foi interrompida porque a ferramenta não conseguiu confirmar a URL da aba do navegador.

## Login sem credenciais iniciais — 17/11/2026

O formulário de login deixou de preencher automaticamente a conta demonstrativa. E-mail e senha começam vazios; os campos têm nomes estáveis e `autocomplete` apropriado para permitir o gerenciador de senhas do navegador. A forma e o momento da sugestão de credenciais dependem do navegador e das preferências do usuário.

`npm run build` em `frontend/` passou após a alteração. A inspeção do formulário confirma que não há valores iniciais no código; o Chrome headless local não retornou o DOM para uma conferência visual nesta sessão.

## Perfis e acesso — 17/11/2026

A matriz inicial tem Administrador, Supervisor e Operador. O perfil legado Superadministrador foi desativado no login, nas sessões, no cadastro e na demonstração gerada, sem apagar a implementação antiga. As páginas e a API aplicam as mesmas restrições de acesso. Operadores consultam clientes das carteiras da equipe, registram ocorrências, atualizam telefone/e-mail e atribuem fichas a outro operador autorizado da equipe. A fila de cobrança considera a atribuição. O dashboard gerencial e os relatórios são exclusivos de Administrador e Supervisor; usuários e configurações são exclusivos do Administrador. Os agentes de IA para Operador ficam limitados aos clientes autorizados, sem consulta gerencial.

A política atual é fixa. Permissões adicionais configuráveis pelo Administrador ainda não foram implementadas.

Verificação: `npm run build` em `frontend/`, compilação Python e checagem de whitespace passaram. Em uma base fictícia isolada, foram conferidos login dos três perfis, bloqueio de login e sessão do Superadministrador legado, acesso ao dashboard, usuários, configurações e agente gerencial, consulta limitada a 15 de 30 clientes, atualização de contato, registro de ocorrência e transferência aceita ou recusada conforme equipe e carteira.

## Atualização de 17/11/2026

A tela de login recebeu um novo layout centralizado, fundo roxo, painel translúcido e adaptação para celular conforme o modelo enviado pelo proprietário. O formulário existente, a opção de manter sessão, a visualização da senha e a recuperação de senha continuam disponíveis. A entrada com Microsoft foi removida na revisão mais recente porque a integração não existe.

`npm run build` em `frontend/` passou. A conferência visual local em desktop e celular foi concluída na revisão responsiva registrada abaixo.

## Alteração mais recente

As pastas de testes da API e da interface foram retiradas do repositório, junto com os comandos, configurações e dependências usados apenas por elas. Os arquivos de produção Python e TypeScript foram formatados para leitura, sem mudança intencional de comportamento. A aplicação e os comandos de publicação permanecem nos mesmos caminhos.

## Verificação atual

- `npm ci` e `npm run build` em `frontend/`: passaram após a limpeza e a formatação.
- `python -m compileall -q backend/app scripts cloudflare/worker.py`: passou após a formatação Python.
- API local: iniciou normalmente; `/api/v1/health`, login e dashboard responderam `200 OK`.
- Após o envio ao GitHub, conferir o build automático no painel da Cloudflare e a resposta de `/api/v1/health`.

## Revisão responsiva de 17/11/2026

O login foi compactado para janelas de desktop com pouca altura. Os layouts compartilhados foram ajustados para celular e tablet: navegação, filtros, cartões, formulários, gráficos, tabelas e painéis de configurações. As tabelas largas mantêm rolagem horizontal dentro do painel.

`npm run build` em `frontend/` passou. A conferência local com dados fictícios percorreu login e páginas internas em larguras de 320, 390, 768, 1024 e 1280 px. As capturas do login e de páginas representativas foram inspecionadas em 390 px; em 1280×720 o login cabe integralmente na janela. Em telas baixas de celular, a página rola verticalmente para manter os controles acessíveis.

### Correção da rolagem do login

O contêiner do login usava `overflow-x: hidden`, que criava uma área de rolagem vertical interna. A decoração circular fora da tela aumentava essa área e deixava um grande espaço vazio. O contêiner agora usa `overflow: clip`, sem barra interna; a página só rola quando o conteúdo ultrapassa a altura disponível. A medição no navegador confirmou altura do documento igual à janela em 1280×720 e 1267×630, sem largura excedente. Em 390×844 e 320×568, o conteúdo permanece acessível pela rolagem normal da página.

### Ajuste das proporções do login

O cartão, o logotipo, os textos, os campos e os botões foram reduzidos em conjunto para manter o formulário centralizado sem ocupar quase toda a tela. A versão compacta também atende janelas intermediárias com pouca altura. A conferência visual local foi feita em 1280×720, 700×630 e 390×844; nessas medidas, todo o login e o rodapé cabem na janela sem rolagem. Em 320×568, a página rola verticalmente para manter todos os controles acessíveis.

## Estado do produto

A demonstração usa dados fictícios, FastAPI, React e um Durable Object no Cloudflare. Os quatro agentes de IA ainda funcionam com regras determinísticas. PostgreSQL, provedor LLM real, integração bancária, envio de mensagens e recuperação de senha por e-mail não foram implementados.

As verificações automatizadas anteriores constam no histórico do Git, mas seus arquivos foram removidos por decisão do proprietário. Para mudanças futuras, conferir o build e os fluxos afetados antes de publicar.
