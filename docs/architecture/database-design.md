# Modelo de dados e migração

O JSON contém `tenants`, `users`, `sessions` e `records` por recurso. Cada item de `records` inclui `id` UUID e `tenant_id` UUID. As principais relações são:

```text
Tenant 1—N User, Creditor, Portfolio, Customer, Contract, Receivable
Creditor 1—N Portfolio
Portfolio 1—N Customer, Contract, Receivable
Customer 1—N Contract, Receivable, Occurrence, Negotiation, Agreement
Negotiation 1—1 Agreement
Agreement 1—N Payment
```

Para PostgreSQL, criar tabelas com chaves estrangeiras compostas ou verificações equivalentes que incluam `tenant_id`. Usar transação única para negociação, aceite, alocação, confirmação, estorno e auditoria. Adicionar índices em `(tenant_id, id)`, `(tenant_id, customer_id)`, vencimento, status e data. Migrar campos monetários para `NUMERIC(18,2)` e dados de cronograma/alocação para tabelas normalizadas. `sessions` deve receber expiração e revogação. O adapter JSON deve ser substituído sem mover cálculos para rotas HTTP.

Entidades ainda não normalizadas no MVP: contatos múltiplos, parcelas de títulos, políticas editáveis, itens de negociação, alocações como tabela própria, permissões granulares e mensagens de IA.
