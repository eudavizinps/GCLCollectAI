from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.core.security import current_user, password_hash, password_matches, public_user, require
from app.core.storage import change, read
from app.domain.common import audit, get_scoped, new_id, now, scoped

router = APIRouter(tags=["administration"])


class UserInput(BaseModel):
    name: str = Field(min_length=2)
    email: str
    role: str
    password: str = Field(min_length=8)
    team_id: str | None = None


class UserPatchInput(BaseModel):
    name: str | None = Field(default=None, min_length=2)
    role: str | None = None
    team_id: str | None = None


@router.get("/users")
def users(user: dict = Depends(require("admin", "supervisor"))):
    return [public_user(u) for u in read()["users"] if u["tenant_id"] == user["tenant_id"]]


@router.post("/users")
def create_user(payload: UserInput, user: dict = Depends(require("admin"))):
    if payload.role not in ("superadmin", "admin", "supervisor", "operator", "analyst"):
        raise HTTPException(422, "Perfil inválido")
    if payload.role == "superadmin" and user["role"] != "superadmin":
        raise HTTPException(403, "Somente superadministradores podem criar este perfil")
    def operation(db):
        if any(u["email"].casefold() == payload.email.casefold() for u in db["users"]):
            raise HTTPException(409, "E-mail já cadastrado")
        if payload.team_id:
            get_scoped(db, "teams", payload.team_id, user["tenant_id"])
        item = {"id": new_id(), "tenant_id": user["tenant_id"], "name": payload.name, "email": payload.email, "role": payload.role, "team_id": payload.team_id, "password_hash": password_hash(payload.password), "active": True}
        db["users"].append(item)
        audit(db, user, "create", "users", item["id"])
        return public_user(item)
    return change(operation)


@router.post("/users/{item_id}/toggle")
def toggle_user(item_id: str, user: dict = Depends(require("admin"))):
    if item_id == user["id"]:
        raise HTTPException(422, "Não é possível inativar a própria conta")
    def operation(db):
        item = next((u for u in db["users"] if u["id"] == item_id and u["tenant_id"] == user["tenant_id"]), None)
        if not item:
            raise HTTPException(404, "Usuário não encontrado")
        if item["role"] == "superadmin" and user["role"] != "superadmin":
            raise HTTPException(403, "Somente superadministradores podem alterar este perfil")
        if item["role"] in ("superadmin", "admin") and item.get("active", True) and sum(u["tenant_id"] == user["tenant_id"] and u["role"] in ("superadmin", "admin") and u.get("active", True) for u in db["users"]) <= 1:
            raise HTTPException(409, "A empresa precisa manter um administrador ativo")
        item["active"] = not item.get("active", True)
        audit(db, user, "toggle", "users", item_id)
        return public_user(item)
    return change(operation)


@router.patch("/users/{item_id}")
def edit_user(item_id: str, payload: UserPatchInput, user: dict = Depends(require("admin"))):
    if payload.role and payload.role not in ("superadmin", "admin", "supervisor", "operator", "analyst"):
        raise HTTPException(422, "Perfil inválido")
    if payload.role == "superadmin" and user["role"] != "superadmin":
        raise HTTPException(403, "Somente superadministradores podem atribuir este perfil")
    def operation(db):
        item = next((u for u in db["users"] if u["id"] == item_id and u["tenant_id"] == user["tenant_id"]), None)
        if not item:
            raise HTTPException(404, "Usuário não encontrado")
        if item["role"] == "superadmin" and user["role"] != "superadmin":
            raise HTTPException(403, "Somente superadministradores podem alterar este perfil")
        if item_id == user["id"] and payload.role and payload.role != item["role"]:
            raise HTTPException(409, "Não é possível remover o próprio perfil administrativo")
        if item["role"] in ("superadmin", "admin") and payload.role and payload.role not in ("superadmin", "admin") and sum(u["tenant_id"] == user["tenant_id"] and u["role"] in ("superadmin", "admin") and u.get("active", True) for u in db["users"]) <= 1:
            raise HTTPException(409, "A empresa precisa manter um administrador ativo")
        if payload.team_id:
            get_scoped(db, "teams", payload.team_id, user["tenant_id"])
        item.update(payload.model_dump(exclude_unset=True))
        audit(db, user, "update", "users", item_id)
        return public_user(item)
    return change(operation)


@router.get("/settings")
def settings(user: dict = Depends(current_user)):
    return next((s for s in scoped(read(), "settings", user["tenant_id"])), {"tenant_id": user["tenant_id"], "organization": "", "theme": "dark", "notifications": True, "max_discount_pct": 20})


class SettingsInput(BaseModel):
    organization: str | None = None
    theme: str | None = None
    notifications: bool | None = None


@router.patch("/settings")
def update_settings(payload: SettingsInput, user: dict = Depends(require("admin"))):
    if payload.theme and payload.theme not in ("dark", "light"):
        raise HTTPException(422, "Tema inválido")
    def operation(db):
        items = db["records"].setdefault("settings", [])
        item = next((s for s in items if s["tenant_id"] == user["tenant_id"]), None)
        if item is None:
            item = {"id": new_id(), "tenant_id": user["tenant_id"]}
            items.append(item)
        item.update(payload.model_dump(exclude_none=True))
        audit(db, user, "update", "settings", item["id"])
        return item
    return change(operation)


class ProfileInput(BaseModel):
    name: str = Field(min_length=2)


@router.patch("/profile")
def update_profile(payload: ProfileInput, user: dict = Depends(current_user)):
    def operation(db):
        item = next(u for u in db["users"] if u["id"] == user["id"])
        item["name"] = payload.name
        audit(db, user, "update", "profile", item["id"])
        return public_user(item)
    return change(operation)


class PasswordInput(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)


@router.post("/profile/password")
def update_password(payload: PasswordInput, user: dict = Depends(current_user)):
    if not password_matches(payload.current_password, user["password_hash"]):
        raise HTTPException(422, "Senha atual incorreta")
    def operation(db):
        item = next(u for u in db["users"] if u["id"] == user["id"])
        item["password_hash"] = password_hash(payload.new_password)
        audit(db, user, "password_change", "profile", item["id"])
        return {"ok": True}
    return change(operation)


@router.post("/notifications/{item_id}/read")
def read_notification(item_id: str, user: dict = Depends(current_user)):
    def operation(db):
        item = get_scoped(db, "notifications", item_id, user["tenant_id"])
        item["read"] = True
        return item
    return change(operation)


@router.post("/notifications/read-all")
def read_all(user: dict = Depends(current_user)):
    def operation(db):
        for item in scoped(db, "notifications", user["tenant_id"]):
            item["read"] = True
        return {"ok": True}
    return change(operation)
