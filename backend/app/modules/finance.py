from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.core.security import current_user, require
from app.core.storage import change, read
from app.domain.common import audit, get_scoped, new_id, notify, now, scoped
from app.domain.financial import money, simulate

router = APIRouter(tags=["finance"])


class SimulationInput(BaseModel):
    customer_id: str
    receivable_ids: list[str]
    discount_pct: Decimal = Decimal("0")
    down_payment: Decimal = Decimal("0")
    installments: int = Field(1, ge=1, le=12)
    first_due: date


@router.post("/negotiations/simulate")
def simulate_api(payload: SimulationInput, user: dict = Depends(current_user)):
    return simulate(read(), user["tenant_id"], **payload.model_dump())


@router.post("/negotiations")
def create_negotiation(payload: SimulationInput, user: dict = Depends(require("admin", "supervisor", "operator"))):
    def operation(db):
        result = simulate(db, user["tenant_id"], **payload.model_dump())
        busy = {title for n in scoped(db, "negotiations", user["tenant_id"]) if n["status"] in ("draft", "pending_approval", "approved", "accepted") for title in n["receivable_ids"]}
        if busy.intersection(payload.receivable_ids):
            raise HTTPException(409, "Título já possui negociação ativa")
        item = {"id": new_id(), "tenant_id": user["tenant_id"], **result, "status": "pending_approval" if result["requires_approval"] else "draft", "created_at": now(), "created_by": user["id"]}
        db["records"].setdefault("negotiations", []).append(item)
        audit(db, user, "create", "negotiations", item["id"])
        if result["requires_approval"]:
            notify(db, user["tenant_id"], "Negociação aguarda aprovação", "/app/negociacoes")
        return item
    return change(operation)


class DecisionInput(BaseModel):
    reason: str = ""


@router.post("/negotiations/{item_id}/approve")
def approve(item_id: str, user: dict = Depends(require("admin", "supervisor"))):
    def operation(db):
        item = get_scoped(db, "negotiations", item_id, user["tenant_id"])
        if item["status"] != "pending_approval":
            raise HTTPException(409, "Negociação não aguarda aprovação")
        item["status"] = "approved"
        audit(db, user, "approve", "negotiations", item_id)
        return item
    return change(operation)


@router.post("/negotiations/{item_id}/reject")
def reject(item_id: str, payload: DecisionInput, user: dict = Depends(require("admin", "supervisor"))):
    if not payload.reason.strip():
        raise HTTPException(422, "Informe o motivo")
    def operation(db):
        item = get_scoped(db, "negotiations", item_id, user["tenant_id"])
        if item["status"] != "pending_approval":
            raise HTTPException(409, "Negociação não aguarda aprovação")
        item["status"] = "rejected"
        item["rejection_reason"] = payload.reason
        audit(db, user, "reject", "negotiations", item_id, payload.reason)
        return item
    return change(operation)


@router.post("/negotiations/{item_id}/accept")
def accept(item_id: str, user: dict = Depends(require("admin", "supervisor", "operator"))):
    def operation(db):
        item = get_scoped(db, "negotiations", item_id, user["tenant_id"])
        if item["status"] not in ("draft", "approved"):
            raise HTTPException(409, "Negociação não pode ser aceita")
        item["status"] = "accepted"
        titles = [get_scoped(db, "receivables", title_id, user["tenant_id"]) for title_id in item["receivable_ids"]]
        original = money(item["original"])
        total = money(item["total"])
        remaining_due = total
        allocations = []
        for index, title in enumerate(titles):
            old_balance = money(title["balance"])
            due = (old_balance * total / original).quantize(Decimal("0.01")) if index < len(titles)-1 else remaining_due
            remaining_due -= due
            title["discount"] = str(money(title.get("discount", "0")) + old_balance - due)
            title["balance"] = str(due)
            title["status"] = "in_agreement"
            allocations.append({"receivable_id": title["id"], "original_balance": str(old_balance), "settlement_due": str(due)})
        agreement = {"id": new_id(), "tenant_id": user["tenant_id"], "number": f"AC-{len(scoped(db, 'agreements', user['tenant_id']))+1:05d}", "negotiation_id": item_id, "customer_id": item["customer_id"], "receivable_ids": item["receivable_ids"], "title_allocations": allocations, "total": item["total"], "paid": "0.00", "balance": item["total"], "status": "active", "schedule": [{**s, "paid": "0.00"} for s in item["schedule"]], "created_at": now()}
        db["records"].setdefault("agreements", []).append(agreement)
        item["agreement_id"] = agreement["id"]
        audit(db, user, "accept", "negotiations", item_id)
        notify(db, user["tenant_id"], "Novo acordo criado", f"/app/acordos/{agreement['id']}")
        return agreement
    return change(operation)


class PaymentInput(BaseModel):
    agreement_id: str
    amount: Decimal
    method: str
    reference: str = ""


@router.post("/payments")
def create_payment(payload: PaymentInput, user: dict = Depends(require("admin", "supervisor", "operator"))):
    def operation(db):
        agreement = get_scoped(db, "agreements", payload.agreement_id, user["tenant_id"])
        amount = money(payload.amount)
        if agreement["status"] != "active" or amount <= 0 or amount > money(agreement["balance"]):
            raise HTTPException(422, "Pagamento excede o saldo ou acordo está inativo")
        if payload.method not in ("pix", "boleto", "transferencia", "cartao", "dinheiro", "outro"):
            raise HTTPException(422, "Método inválido")
        item = {"id": new_id(), "tenant_id": user["tenant_id"], "agreement_id": payload.agreement_id, "customer_id": agreement["customer_id"], "amount": str(amount), "method": payload.method, "reference": payload.reference, "status": "pending", "created_at": now()}
        db["records"].setdefault("payments", []).append(item)
        audit(db, user, "create", "payments", item["id"], "Pagamento demonstrativo")
        return item
    return change(operation)


@router.post("/payments/{item_id}/confirm")
def confirm_payment(item_id: str, user: dict = Depends(require("admin", "supervisor"))):
    def operation(db):
        payment = get_scoped(db, "payments", item_id, user["tenant_id"])
        if payment["status"] == "confirmed":
            return payment
        if payment["status"] != "pending":
            raise HTTPException(409, "Pagamento não pode ser confirmado")
        agreement = get_scoped(db, "agreements", payment["agreement_id"], user["tenant_id"])
        amount = money(payment["amount"])
        if amount > money(agreement["balance"]):
            raise HTTPException(409, "Saldo insuficiente para confirmação")
        agreement["paid"] = str(money(agreement["paid"]) + amount)
        agreement["balance"] = str(money(agreement["balance"]) - amount)
        agreement["status"] = "paid" if money(agreement["balance"]) == 0 else "active"
        remaining = amount
        installment_allocations = []
        for installment in agreement["schedule"]:
            due = money(installment["amount"]) - money(installment["paid"])
            allocated = min(remaining, due)
            installment["paid"] = str(money(installment["paid"]) + allocated)
            if allocated:
                installment_allocations.append({"number": installment["number"], "amount": str(allocated)})
            remaining -= allocated
            if remaining == 0:
                break
        remaining = amount
        allocations = []
        for title_id in agreement["receivable_ids"]:
            title = get_scoped(db, "receivables", title_id, user["tenant_id"])
            allocated = min(remaining, money(title["balance"]))
            title["balance"] = str(money(title["balance"]) - allocated)
            title["status"] = "paid" if money(title["balance"]) == 0 else "in_agreement"
            if allocated:
                allocations.append({"receivable_id": title_id, "amount": str(allocated)})
            remaining -= allocated
            if remaining == 0:
                break
        payment["allocations"] = allocations
        payment["installment_allocations"] = installment_allocations
        payment["status"] = "confirmed"
        payment["confirmed_at"] = now()
        audit(db, user, "confirm", "payments", item_id)
        notify(db, user["tenant_id"], "Pagamento demonstrativo confirmado", "/app/pagamentos")
        return payment
    return change(operation)


@router.post("/payments/{item_id}/reverse")
def reverse_payment(item_id: str, user: dict = Depends(require("admin", "supervisor"))):
    def operation(db):
        payment = get_scoped(db, "payments", item_id, user["tenant_id"])
        if payment["status"] != "confirmed":
            raise HTTPException(409, "Somente pagamento confirmado pode ser estornado")
        agreement = get_scoped(db, "agreements", payment["agreement_id"], user["tenant_id"])
        amount = money(payment["amount"])
        agreement["paid"] = str(money(agreement["paid"]) - amount)
        agreement["balance"] = str(money(agreement["balance"]) + amount)
        agreement["status"] = "active"
        for allocation in payment.get("installment_allocations", []):
            installment = next(part for part in agreement["schedule"] if part["number"] == allocation["number"])
            installment["paid"] = str(money(installment["paid"]) - money(allocation["amount"]))
        for allocation in payment.get("allocations", []):
            title = get_scoped(db, "receivables", allocation["receivable_id"], user["tenant_id"])
            title["balance"] = str(money(title["balance"]) + money(allocation["amount"]))
            title["status"] = "in_agreement"
        payment["status"] = "reversed"
        payment["reversed_at"] = now()
        audit(db, user, "reverse", "payments", item_id)
        return payment
    return change(operation)
