# Matriz de funcionalidades — 01/11/2026

## Pesquisa de clientes — 18/11/2026

A tela `/app/clientes` permite pesquisar por nome, CPF/CNPJ, contrato, telefone, credor, produto (carteira), status da cobrança, situação do acordo, vencimento, valor em aberto e dias de atraso. A lista de resultados fica oculta até o usuário preencher ao menos um filtro e pesquisar; ao alterar ou limpar filtros, ela volta a ficar oculta. Os resultados têm ordenação, paginação e acesso à ficha e ligação. Todos os três perfis consultam todos os clientes cadastrados da própria empresa, inclusive quitados e inativos. Ações como registrar ocorrência e alterar ficha continuam limitadas às carteiras autorizadas para o Operador. Produto corresponde à carteira nesta demonstração, pois não existe um cadastro separado de produtos.

## Login — 17/11/2026

O login abre com e-mail e senha vazios. Os campos mantêm os identificadores padrão de preenchimento do navegador, para que o usuário possa selecionar credenciais salvas quando o navegador oferecer essa opção.

As três contas demonstrativas da empresa Aurora usam os e-mails `adminteste@collectai.local`, `supteste@collectai.local` e `opteste@collectai.local`; as senhas correspondentes estão registradas no guia de publicação.

O cartão do login foi reduzido novamente para desktop e celular. A opção de entrada com Microsoft e o separador foram removidos da interface.

## Perfis ativos — 17/11/2026

| Funcionalidade | Administrador | Supervisor | Operador |
| --- | --- | --- | --- |
| Dashboard gerencial | Sim | Sim | Não |
| Consultar todos os clientes da empresa | Sim | Sim | Sim |
| Consultar carteiras operacionais | Sim | Sim | Apenas carteiras da equipe |
| Registrar ocorrências | Sim | Sim | Apenas clientes da equipe |
| Atualizar telefone e e-mail | Sim | Sim | Apenas clientes da equipe |
| Transferir ficha para outro operador | Sim | Sim | Apenas na equipe da carteira |
| Consultar agentes de IA demonstrativos | Sim | Sim | Apenas clientes da equipe; sem agente gerencial |
| Gerenciar usuários | Sim | Não | Não |
| Relatórios financeiros e analytics | Sim | Sim | Não |
| Configurar sistema | Sim | Não | Não |

O perfil `superadmin` permanece no código legado, mas não pode iniciar sessão, ser criado nem ser atribuído. A demonstração nova cria somente os três perfis ativos por empresa. Contas legadas desse perfil continuam armazenadas, porém sem acesso. O Operador acessa as carteiras ligadas à sua equipe; a transferência altera o operador responsável pela ficha e sua fila de cobrança. A matriz é inicial e fixa: a configuração de permissões adicionais pelo Administrador fica para uma etapa futura.

| Funcionalidade | Estado | Onde conferir |
| --- | --- | --- |
| Layout responsivo do login e das páginas internas | Ajustado para celular, tablet e desktop; login sem rolagem dupla e tabelas com rolagem no próprio painel | `frontend/src/estilos/login.css` e `frontend/src/estilos/responsividade.css` |
| Login, logout e sessão | Implementado para demo | `backend/app/modules/autenticacao.py` e `backend/app/core/seguranca.py` |
| Visual do login inspirado no modelo roxo com efeito de vidro | Implementado com cartão compacto e centralizado; conferido localmente em desktop e celular | `frontend/src/features/autenticacao/TelaLogin.tsx` e `frontend/src/estilos/login.css` |
| Entrada com Microsoft | Removida da interface; integração não implementada | `frontend/src/features/autenticacao/TelaLogin.tsx` |
| Isolamento por tenant e autorização por perfil | Implementado no servidor | `backend/app/domain/comum.py` e dependências de autenticação |
| Tema escuro/claro, sidebar e navegação | Implementado | `frontend/src/estrutura/` e `frontend/src/estilos/` |
| Credores, carteiras, clientes, contratos, títulos, ocorrências e equipes | CRUD básico | `backend/app/modules/cadastros.py` e `frontend/src/features/cadastros/` |
| Fila de cobrança | Implementação básica | `frontend/src/features/cobrancas/` |
| Simulação, desconto, aprovação, aceite e acordo | Implementado | `backend/app/domain/financial.py` e `backend/app/modules/financeiro.py` |
| Pagamento demonstrativo, confirmação, estorno e saldo dos títulos | Implementado | `backend/app/modules/financeiro.py` |
| Dashboard e analytics | Métricas principais e filtros do dashboard implementados | `backend/app/modules/indicadores_ia.py` |
| Quatro agentes determinísticos | Implementados em modo demo | `backend/app/modules/indicadores_ia.py` e `frontend/src/features/agentes_ia/` |
| Relatórios CSV e impressão/PDF do navegador | Parcial | `frontend/src/features/relatorios/` |
| Usuários, perfil, configurações e notificações | Parcial | `backend/app/modules/administracao.py` e respectivas telas |
| Auditoria | Implementação básica | `backend/app/domain/comum.py` |
| Recuperação de senha por e-mail | Indisponível, sinalizado na interface | — |
| Provedor LLM real, bots e integrações externas | Pendente | — |
| PostgreSQL e migrações | Pendente | — |
| Demonstração Cloudflare (FastAPI, React e Durable Object) | Publicada | `cloudflare/` e [guia de publicação](publicacao/cloudflare-demo.md) |

As pastas de testes automatizados foram removidas em 01/11/2026 a pedido do proprietário. O estado funcional acima não mudou; cada fluxo alterado precisa de conferência manual antes de ser considerado pronto.
