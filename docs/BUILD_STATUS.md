# Estado do build — 01/11/2026

## Perfis e acesso — 17/11/2026

A matriz inicial tem Administrador, Supervisor e Operador. O perfil legado Superadministrador foi desativado no login, nas sessões, no cadastro e na demonstração gerada, sem apagar a implementação antiga. As páginas e a API aplicam as mesmas restrições de acesso. Operadores consultam clientes das carteiras da equipe, registram ocorrências, atualizam telefone/e-mail e atribuem fichas a outro operador autorizado da equipe. A fila de cobrança considera a atribuição. O dashboard gerencial e os relatórios são exclusivos de Administrador e Supervisor; usuários e configurações são exclusivos do Administrador. Os agentes de IA para Operador ficam limitados aos clientes autorizados, sem consulta gerencial.

A política atual é fixa. Permissões adicionais configuráveis pelo Administrador ainda não foram implementadas.

Verificação: `npm run build` em `frontend/`, compilação Python e checagem de whitespace passaram. Em uma base fictícia isolada, foram conferidos login dos três perfis, bloqueio de login e sessão do Superadministrador legado, acesso ao dashboard, usuários, configurações e agente gerencial, consulta limitada a 15 de 30 clientes, atualização de contato, registro de ocorrência e transferência aceita ou recusada conforme equipe e carteira.

## Atualização de 17/11/2026

A tela de login recebeu um novo layout centralizado, fundo roxo, painel translúcido e adaptação para celular conforme o modelo enviado pelo proprietário. O formulário existente, a opção de manter sessão, a visualização da senha e a recuperação de senha continuam disponíveis. A entrada com Microsoft aparece desativada porque a integração ainda não existe.

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
