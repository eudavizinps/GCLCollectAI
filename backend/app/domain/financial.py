"""Authoritative Decimal calculations shared by API and demo agents."""
from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException

from app.domain.common import get_scoped

CENT = Decimal("0.01")


def money(value) -> Decimal:
    try:
        result = Decimal(str(value)).quantize(CENT, rounding=ROUND_HALF_UP)
    except Exception:
        raise HTTPException(422, "Valor monetário inválido")
    if not result.is_finite():
        raise HTTPException(422, "Valor monetário inválido")
    return result


def simulate(db: dict, tenant_id: str, customer_id: str, receivable_ids: list[str], discount_pct: Decimal, down_payment: Decimal, installments: int, first_due: date) -> dict:
    get_scoped(db, "customers", customer_id, tenant_id)
    if not receivable_ids or len(set(receivable_ids)) != len(receivable_ids):
        raise HTTPException(422, "Selecione títulos distintos")
    if not 1 <= installments <= 12:
        raise HTTPException(422, "Parcelamento máximo: 12")
    if first_due < date.today():
        raise HTTPException(422, "Vencimento inicial no passado")
    if discount_pct < 0 or discount_pct > 30:
        raise HTTPException(422, "Desconto permitido até 30%, sujeito a aprovação")
    titles = [get_scoped(db, "receivables", title_id, tenant_id) for title_id in receivable_ids]
    if any(t["customer_id"] != customer_id or t.get("status") in ("paid", "disputed") or money(t["balance"]) <= 0 for t in titles):
        raise HTTPException(422, "Título não elegível")
    original = sum((money(t["balance"]) for t in titles), Decimal("0"))
    discount = (original * discount_pct / 100).quantize(CENT, rounding=ROUND_HALF_UP)
    total = original - discount
    down_payment = money(down_payment)
    if down_payment < 0 or down_payment > total:
        raise HTTPException(422, "Entrada inválida")
    remaining = total - down_payment
    if remaining == 0:
        raise HTTPException(422, "A entrada não pode quitar integralmente uma proposta parcelada")
    if remaining and remaining / installments < Decimal("50"):
        raise HTTPException(422, "Parcela mínima: R$ 50,00")
    base = (remaining / installments).quantize(CENT, rounding=ROUND_HALF_UP)
    amounts = [base] * installments
    amounts[-1] = remaining - sum(amounts[:-1])
    schedule = []
    if down_payment:
        schedule.append({"number": 0, "due_date": first_due.isoformat(), "amount": str(down_payment)})
    for index, amount in enumerate(amounts):
        due = first_due + timedelta(days=30 * (index + (1 if down_payment else 0)))
        schedule.append({"number": index + 1, "due_date": due.isoformat(), "amount": str(amount)})
    return {"customer_id": customer_id, "receivable_ids": receivable_ids, "original": str(original), "discount_pct": str(discount_pct), "discount": str(discount), "total": str(total), "down_payment": str(down_payment), "installments": installments, "schedule": schedule, "requires_approval": discount_pct > 20, "policy": "Até 20% de desconto; até 30% com aprovação; até 12 parcelas; mínimo R$ 50 por parcela."}
