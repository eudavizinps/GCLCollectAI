"""Tenant-scoped operational records; financial transitions live in finance.py."""
from decimal import Decimal, InvalidOperation
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.core.security import current_user, require
from app.core.storage import change, read
from app.domain.common import audit, get_scoped, new_id, now, scoped

router = APIRouter(tags=["records"])

SPECS = {
    "creditors": ("name", "document", "email", "phone", "status"),
    "portfolios": ("name", "code", "creditor_id", "description", "responsible", "team_id", "status"),
    "customers": ("name", "kind", "document", "email", "phone", "address", "zip_code", "city", "state", "notes", "portfolio_id", "status"),
    "contracts": ("number", "customer_id", "creditor_id", "portfolio_id", "amount", "date", "description", "status"),
    "receivables": ("customer_id", "contract_id", "portfolio_id", "number", "principal", "interest", "fee", "discount", "due_date", "status"),
    "occurrences": ("customer_id", "type", "channel", "description", "result", "next_action", "at"),
    "teams": ("name", "supervisor_id", "portfolio_ids", "status"),
}
REQUIRED = {
    "creditors": ("name",), "portfolios": ("name", "creditor_id"),
    "customers": ("name", "document"), "contracts": ("number", "customer_id", "amount"),
    "receivables": ("customer_id", "number", "principal", "due_date"),
    "occurrences": ("customer_id", "type", "description"), "teams": ("name",),
}
REFERENCES = {
    "portfolios": {"creditor_id": "creditors"},
    "customers": {"portfolio_id": "portfolios"},
    "contracts": {"customer_id": "customers", "creditor_id": "creditors", "portfolio_id": "portfolios"},
    "receivables": {"customer_id": "customers", "contract_id": "contracts", "portfolio_id": "portfolios"},
    "occurrences": {"customer_id": "customers"},
}


class RecordInput(BaseModel):
    data: dict[str, Any] = Field(default_factory=dict)


def _validate(db: dict, resource: str, data: dict, tenant_id: str, partial: bool = False) -> dict:
    if resource not in SPECS:
        raise HTTPException(404, "Módulo não encontrado")
    unknown = set(data) - set(SPECS[resource])
    if unknown:
        raise HTTPException(422, f"Campos desconhecidos: {', '.join(sorted(unknown))}")
    for key in (() if partial else REQUIRED[resource]):
        if not str(data.get(key, "")).strip():
            raise HTTPException(422, f"Campo obrigatório: {key}")
    for field, target in REFERENCES.get(resource, {}).items():
        if data.get(field):
            get_scoped(db, target, str(data[field]), tenant_id)
    if resource == "portfolios" and data.get("team_id"):
        get_scoped(db, "teams", str(data["team_id"]), tenant_id)
    if resource == "teams" and data.get("supervisor_id"):
        supervisor = next((u for u in db["users"] if u["id"] == data["supervisor_id"] and u["tenant_id"] == tenant_id and u["role"] in ("superadmin", "admin", "supervisor")), None)
        if not supervisor:
            raise HTTPException(422, "Supervisor inválido para esta empresa")
    if resource == "receivables":
        for key in ("principal", "interest", "fee", "discount"):
            if key in data:
                try:
                    amount = Decimal(str(data[key]))
                except InvalidOperation:
                    raise HTTPException(422, f"Valor inválido: {key}")
                if not amount.is_finite() or amount < 0:
                    raise HTTPException(422, f"Valor inválido: {key}")
                data[key] = str(amount.quantize(Decimal("0.01")))
    if resource == "contracts" and "amount" in data:
        try:
            amount = Decimal(str(data["amount"]))
        except InvalidOperation:
            raise HTTPException(422, "Valor inválido")
        if not amount.is_finite() or amount < 0:
            raise HTTPException(422, "Valor inválido")
        data["amount"] = str(amount.quantize(Decimal("0.01")))
    if resource == "customers" and "document" in data:
        digits = "".join(c for c in str(data["document"]) if c.isdigit())
        if len(digits) not in (11, 14):
            raise HTTPException(422, "Documento deve ter 11 ou 14 dígitos")
        data["document"] = digits
    return data


@router.get("/{resource}")
def list_records(resource: str, q: str = "", page: int = Query(1, ge=1), size: int = Query(20, ge=1, le=100), user: dict = Depends(current_user)):
    if resource not in SPECS and resource not in ("agreements", "payments", "negotiations", "audit", "notifications", "ai_executions"):
        raise HTTPException(404, "Módulo não encontrado")
    if resource == "audit" and user["role"] not in ("superadmin", "admin", "supervisor"):
        raise HTTPException(403, "Permissão insuficiente")
    items = scoped(read(), resource, user["tenant_id"])
    if q:
        items = [item for item in items if q.casefold() in " ".join(str(v) for v in item.values() if isinstance(v, (str, int))).casefold()]
    items.sort(key=lambda item: item.get("created_at", item.get("at", "")), reverse=True)
    return {"items": items[(page-1)*size:page*size], "total": len(items), "page": page, "size": size}


@router.get("/{resource}/{item_id}")
def detail(resource: str, item_id: str, user: dict = Depends(current_user)):
    if resource not in SPECS and resource not in ("agreements", "payments", "negotiations", "audit"):
        raise HTTPException(404, "Módulo não encontrado")
    if resource == "audit" and user["role"] not in ("superadmin", "admin", "supervisor"):
        raise HTTPException(403, "Permissão insuficiente")
    return get_scoped(read(), resource, item_id, user["tenant_id"])


@router.post("/{resource}")
def create(resource: str, payload: RecordInput, user: dict = Depends(require("admin", "supervisor", "operator"))):
    if resource in ("creditors", "portfolios", "teams") and user["role"] == "operator":
        raise HTTPException(403, "Permissão insuficiente")
    def operation(db):
        fields = _validate(db, resource, payload.data.copy(), user["tenant_id"])
        item = {"id": new_id(), "tenant_id": user["tenant_id"], **fields, "status": fields.get("status", "active"), "created_at": now(), "updated_at": now()}
        if resource == "receivables":
            item["balance"] = str(sum((Decimal(item.get(k, "0")) * sign for k, sign in (("principal", 1), ("interest", 1), ("fee", 1), ("discount", -1))), Decimal("0")).quantize(Decimal("0.01")))
            if Decimal(item["balance"]) < 0:
                raise HTTPException(422, "Desconto excede o total")
        if resource == "occurrences":
            item["operator_id"] = user["id"]
            item["at"] = fields.get("at") or now()
        db["records"].setdefault(resource, []).append(item)
        audit(db, user, "create", resource, item["id"])
        return item
    return change(operation)


@router.patch("/{resource}/{item_id}")
def update(resource: str, item_id: str, payload: RecordInput, user: dict = Depends(require("admin", "supervisor", "operator"))):
    if resource in ("creditors", "portfolios", "teams") and user["role"] == "operator":
        raise HTTPException(403, "Permissão insuficiente")
    if resource in ("receivables", "occurrences"):
        raise HTTPException(403, "Histórico financeiro e ocorrências são imutáveis")
    def operation(db):
        item = get_scoped(db, resource, item_id, user["tenant_id"])
        fields = _validate(db, resource, payload.data.copy(), user["tenant_id"], partial=True)
        item.update(fields)
        item["updated_at"] = now()
        audit(db, user, "update", resource, item_id)
        return item
    return change(operation)


@router.post("/{resource}/{item_id}/deactivate")
def deactivate(resource: str, item_id: str, user: dict = Depends(require("admin", "supervisor"))):
    if resource not in ("customers", "creditors", "portfolios", "contracts", "teams"):
        raise HTTPException(404, "Ação indisponível")
    def operation(db):
        item = get_scoped(db, resource, item_id, user["tenant_id"])
        item["status"] = "inactive"
        item["updated_at"] = now()
        audit(db, user, "deactivate", resource, item_id)
        return item
    return change(operation)
