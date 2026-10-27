# Regras de negócio implementadas

- Toda entidade operacional pertence a um tenant e é acessada pelo tenant da sessão.
- Perfis `superadmin`, `admin`, `supervisor`, `operator` e `analyst` são verificados no servidor. O superadministrador continua restrito à própria empresa. Operadores não aprovam descontos nem confirmam pagamentos. Usuários comuns não editam auditoria.
- Valores financeiros são calculados com `Decimal`, arredondados a centavos.
- Desconto até 20% é regular; acima de 20% e até 30% requer aprovação. Máximo de 12 parcelas e mínimo de R$ 50 por parcela.
- Títulos precisam pertencer ao cliente, ter saldo positivo e não estar pagos ou contestados. Uma negociação ativa conflitante é rejeitada.
- Aceite cria acordo e distribui o desconto entre os títulos. Confirmação de pagamento reduz saldo do acordo, parcelas e títulos; segunda confirmação retorna o mesmo registro. Estorno autorizado restaura esses valores e preserva o pagamento como histórico.
- Comunicações da IA são rascunhos respeitosos, nunca enviadas automaticamente. O provedor demonstrativo é explicitamente identificado.
- Ações operacionais e financeiras relevantes geram auditoria. Notificações internas obedecem à preferência da empresa.

## Pendências de domínio

Quebra automática de acordos, contestação com suspensão, renegociação de acordos ativos, conciliação externa, política financeira editável por empresa, pagamentos bancários reais, regras completas de privacidade e retenção, e permissões granulares ainda exigem implementação e testes adicionais.
