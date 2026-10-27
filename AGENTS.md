# CollectAI — orientações para continuidade

- Mantenha `frontend/src/features` organizado por domínio. Componentes universais ficam em `frontend/src/components/shared`.
- Rotas HTTP ficam em `backend/app/modules`; cálculo financeiro autoritativo fica em `backend/app/domain/financial.py`; acesso ao JSON fica somente no adapter `backend/app/core/storage.py`.
- Toda leitura ou escrita organizacional deve filtrar `tenant_id` obtido da sessão, jamais do corpo enviado pelo cliente.
- Toda transição financeira deve usar `Decimal`, ocorrer sob `storage.change` e gerar auditoria. Não edite saldo financeiro por CRUD genérico.
- Agentes de IA demonstrativos consultam serviços autorizados e registram execução. Não lhes dê acesso direto à persistência ou permissão para confirmar pagamentos.
- `backend/data` contém apenas dados fictícios locais. `scripts/seed_demo.py --reset` cria backup antes de substituir dados.
- Antes de declarar um recurso pronto, execute `python scripts/run_tests.py` e `npm run build` em `frontend` e atualize `docs/FEATURE_MATRIX.md` e `docs/BUILD_STATUS.md`.
- As imagens em `frontend/public/brand` foram fornecidas pelo proprietário e devem manter as proporções originais.
