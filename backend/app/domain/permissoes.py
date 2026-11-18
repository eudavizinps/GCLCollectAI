"""Initial role rules and operator visibility within an organization."""

from fastapi import HTTPException

from app.domain.comum import get_scoped, scoped


ACTIVE_ROLES = frozenset({"admin", "supervisor", "operator"})


def operator_team_id(db: dict, user: dict) -> str | None:
    if user["role"] != "operator":
        return None
    if user.get("team_id"):
        return user["team_id"]
    # Existing fictional demo accounts predate team assignment.
    if user.get("email", "").endswith("@demo.collectai.local"):
        teams = scoped(db, "teams", user["tenant_id"])
        return teams[0]["id"] if teams else None
    return None


def operator_portfolio_ids(db: dict, user: dict) -> set[str]:
    team_id = operator_team_id(db, user)
    if not team_id:
        return set()
    return {
        item["id"]
        for item in scoped(db, "portfolios", user["tenant_id"])
        if item.get("team_id") == team_id
    }


def require_customer_access(db: dict, user: dict, customer_id: str) -> dict:
    customer = get_scoped(db, "customers", customer_id, user["tenant_id"])
    if (
        user["role"] == "operator"
        and customer.get("portfolio_id") not in operator_portfolio_ids(db, user)
    ):
        raise HTTPException(404, "Cliente não encontrado")
    return customer


def visible_records(db: dict, resource: str, user: dict) -> list[dict]:
    items = scoped(db, resource, user["tenant_id"])
    if resource == "customers":
        return items
    if user["role"] != "operator":
        return items
    portfolios = operator_portfolio_ids(db, user)
    team_id = operator_team_id(db, user)
    customers = {
        item["id"]
        for item in scoped(db, "customers", user["tenant_id"])
        if item.get("portfolio_id") in portfolios
    }
    if resource == "portfolios":
        return [item for item in items if item["id"] in portfolios]
    if resource == "creditors":
        creditor_ids = {
            item.get("creditor_id")
            for item in scoped(db, "portfolios", user["tenant_id"])
            if item["id"] in portfolios
        }
        return [item for item in items if item["id"] in creditor_ids]
    if resource == "teams":
        return [item for item in items if item["id"] == team_id]
    if resource in ("contracts", "receivables"):
        return [
            item
            for item in items
            if item.get("customer_id") in customers
            and (not item.get("portfolio_id") or item.get("portfolio_id") in portfolios)
        ]
    if resource in ("occurrences", "negotiations", "agreements", "payments"):
        return [item for item in items if item.get("customer_id") in customers]
    if resource == "ai_executions":
        return [
            item
            for item in items
            if item.get("customer_id") in customers
            and item.get("user_id") == user["id"]
        ]
    if resource == "notifications":
        agreements = {
            item["id"]
            for item in scoped(db, "agreements", user["tenant_id"])
            if item.get("customer_id") in customers
        }
        return [
            item
            for item in items
            if not str(item.get("path", "")).startswith("/app/dashboard")
            and (
                not str(item.get("path", "")).startswith("/app/acordos/")
                or str(item["path"]).split("/")[-1] in agreements
            )
        ]
    return items


def require_record_access(db: dict, resource: str, item_id: str, user: dict) -> dict:
    item = get_scoped(db, resource, item_id, user["tenant_id"])
    if resource != "customers" and user["role"] == "operator" and item not in visible_records(db, resource, user):
        raise HTTPException(404, "Registro não encontrado")
    return item
