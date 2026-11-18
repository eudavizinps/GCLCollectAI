"""Busca de clientes com filtros aplicados somente aos registros visíveis na sessão."""

from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, Query

from app.core.seguranca import current_user
from app.core.storage import read
from app.domain.permissoes import visible_records

router = APIRouter(tags=["customers"])


def digits(value: str) -> str:
    return "".join(char for char in value if char.isdigit())


@router.get("/customers/search")
def search_customers(
    q: str = "",
    name: str = "",
    document: str = "",
    contract: str = "",
    phone: str = "",
    creditor_id: str = "",
    portfolio_id: str = "",
    collection_status: str = "",
    agreement_status: str = "",
    due_from: date | None = None,
    due_to: date | None = None,
    amount_from: Decimal | None = Query(None, ge=0),
    amount_to: Decimal | None = Query(None, ge=0),
    delay_from: int | None = Query(None, ge=0),
    delay_to: int | None = Query(None, ge=0),
    sort: str = Query("due_asc", pattern="^(due_asc|due_desc|name|amount_desc|delay_desc)$"),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    user: dict = Depends(current_user),
):
    db = read()
    customers = visible_records(db, "customers", user)
    portfolios = {item["id"]: item for item in visible_records(db, "portfolios", user)}
    creditors = {item["id"]: item for item in visible_records(db, "creditors", user)}
    contracts = visible_records(db, "contracts", user)
    receivables = visible_records(db, "receivables", user)
    agreements = visible_records(db, "agreements", user)
    today = date.today()
    results = []

    for customer in customers:
        portfolio = portfolios.get(customer.get("portfolio_id"), {})
        creditor = creditors.get(portfolio.get("creditor_id"), {})
        customer_contracts = [item for item in contracts if item.get("customer_id") == customer["id"]]
        customer_titles = [item for item in receivables if item.get("customer_id") == customer["id"]]
        open_titles = [item for item in customer_titles if Decimal(str(item.get("balance", "0"))) > 0]
        due_dates = [date.fromisoformat(item["due_date"]) for item in open_titles if item.get("due_date")]
        due_date = min(due_dates) if due_dates else None
        amount = sum((Decimal(str(item.get("balance", "0"))) for item in open_titles), Decimal("0"))
        delay = max((today - due_date).days, 0) if due_date else 0
        customer_agreements = [item for item in agreements if item.get("customer_id") == customer["id"]]
        agreement = "active" if any(item.get("status") == "active" for item in customer_agreements) else (
            "paid" if any(item.get("status") == "paid" for item in customer_agreements) else "none"
        )
        status = (
            "agreement" if agreement == "active" else
            "paid" if not open_titles else
            "overdue" if due_date and due_date < today else
            "due_today" if due_date == today else "collection"
        )

        searchable = " ".join((
            str(customer.get("name", "")), str(customer.get("document", "")),
            str(customer.get("phone", "")),
            " ".join(str(item.get("number", "")) for item in customer_contracts),
        ))
        numeric_match = len(digits(q)) >= 6 and any(
            digits(q) in digits(str(customer.get(key, ""))) for key in ("document", "phone")
        )
        if q and q.casefold() not in searchable.casefold() and not numeric_match:
            continue
        if name and name.casefold() not in str(customer.get("name", "")).casefold():
            continue
        if document and digits(document) not in digits(str(customer.get("document", ""))):
            continue
        if contract and not any(contract.casefold() in str(item.get("number", "")).casefold() for item in customer_contracts):
            continue
        if phone and digits(phone) not in digits(str(customer.get("phone", ""))):
            continue
        if creditor_id and creditor.get("id") != creditor_id:
            continue
        if portfolio_id and portfolio.get("id") != portfolio_id:
            continue
        if collection_status and status != collection_status:
            continue
        if agreement_status and agreement != agreement_status:
            continue
        if due_from and (not due_date or due_date < due_from):
            continue
        if due_to and (not due_date or due_date > due_to):
            continue
        if amount_from is not None and amount < amount_from:
            continue
        if amount_to is not None and amount > amount_to:
            continue
        if delay_from is not None and delay < delay_from:
            continue
        if delay_to is not None and delay > delay_to:
            continue

        results.append({
            "id": customer["id"],
            "name": customer.get("name", ""),
            "document": customer.get("document", ""),
            "phone": customer.get("phone", ""),
            "contract": next(
                (item.get("number", "") for item in customer_contracts if contract.casefold() in str(item.get("number", "")).casefold()),
                customer_contracts[0].get("number", "") if customer_contracts else "",
            ),
            "creditor": creditor.get("name", ""),
            "portfolio": portfolio.get("name", ""),
            "amount": str(amount.quantize(Decimal("0.01"))),
            "due_date": due_date.isoformat() if due_date else None,
            "delay_days": delay,
            "status": status,
            "agreement_status": agreement,
        })

    if sort == "name":
        results.sort(key=lambda item: item["name"].casefold())
    elif sort == "amount_desc":
        results.sort(key=lambda item: Decimal(item["amount"]), reverse=True)
    elif sort == "delay_desc":
        results.sort(key=lambda item: item["delay_days"], reverse=True)
    else:
        results.sort(key=lambda item: item["due_date"] or ("0000-00-00" if sort == "due_desc" else "9999-12-31"), reverse=sort == "due_desc")

    return {"items": results[(page - 1) * size : page * size], "total": len(results), "page": page, "size": size}
