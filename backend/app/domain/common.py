from datetime import datetime, timezone
from uuid import uuid4

from fastapi import HTTPException


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid4())


def scoped(db: dict, resource: str, tenant_id: str) -> list[dict]:
    return [item for item in db["records"].get(resource, []) if item["tenant_id"] == tenant_id]


def get_scoped(db: dict, resource: str, item_id: str, tenant_id: str) -> dict:
    item = next((item for item in scoped(db, resource, tenant_id) if item["id"] == item_id), None)
    if not item:
        raise HTTPException(404, "Registro não encontrado")
    return item


def audit(db: dict, user: dict, action: str, entity: str, entity_id: str, details: str = "") -> None:
    db["records"].setdefault("audit", []).append({"id": new_id(), "tenant_id": user["tenant_id"], "user_id": user["id"], "user_name": user["name"], "action": action, "entity": entity, "entity_id": entity_id, "details": details, "at": now()})


def notify(db: dict, tenant_id: str, title: str, path: str) -> None:
    setting = next((item for item in scoped(db, "settings", tenant_id)), None)
    if setting and setting.get("notifications") is False:
        return
    db["records"].setdefault("notifications", []).append({"id": new_id(), "tenant_id": tenant_id, "title": title, "path": path, "read": False, "at": now()})
