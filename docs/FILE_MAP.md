# Mapa de arquivos

| Área | Arquivos |
| --- | --- |
| Entrada e rotas da API | `backend/app/main.py`, `backend/app/modules/*.py` |
| Sessões, hash e autorização | `backend/app/core/security.py` |
| Persistência JSON atômica | `backend/app/core/storage.py` |
| Cálculos financeiros | `backend/app/domain/financial.py` |
| Tenant, auditoria e avisos | `backend/app/domain/common.py` |
| Seed e inicialização | `scripts/seed_demo.py`, `scripts/run_api.py` |
| Rotas e sessão do front-end | `frontend/src/app/App.tsx`, `frontend/src/app/AuthContext.tsx` |
| Navegação e layout | `frontend/src/app/navigation.ts`, `frontend/src/layouts/DashboardLayout.tsx` |
| Marca e estilo | `frontend/src/components/branding/BrandLogo.tsx`, `frontend/src/styles/` |
| Cadastros | `frontend/src/features/records/` |
| Cobrança e financeiro | `frontend/src/features/collections/`, `frontend/src/features/finance/` |
| Dashboard e IA | `frontend/src/features/dashboard/`, `frontend/src/features/ai/` |
| Gestão e sistema | `frontend/src/features/management/`, `settings/`, `profile/`, `notifications/` |
| Cliente HTTP e CSV | `frontend/src/services/api.ts` |
| Testes HTTP | `tests/test_api.py` |
