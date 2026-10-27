import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi import Depends, HTTPException, Request, Response

from app.core.storage import change, read


def password_hash(password: str, salt: str | None = None) -> str:
    salt = salt or secrets.token_hex(16)
    if not hasattr(hashlib, "scrypt"):
        return demo_password_hash(password, salt)
    digest = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=2**14, r=8, p=1)
    return f"{salt}:{digest.hex()}"


def demo_password_hash(password: str, salt: str | None = None) -> str:
    """Portable hash for public fictional credentials in Python Workers."""
    salt = salt or secrets.token_hex(16)
    digest = bytes.fromhex(salt) + password.encode()
    for _ in range(500):
        digest = hashlib.sha256(digest).digest()
    return f"demo-sha256:{salt}:{digest.hex()}"


def password_matches(password: str, stored: str) -> bool:
    try:
        if stored.startswith("demo-sha256:"):
            _, salt, _ = stored.split(":", 2)
            return hmac.compare_digest(demo_password_hash(password, salt), stored)
        salt, _ = stored.split(":", 1)
        return hmac.compare_digest(password_hash(password, salt), stored)
    except ValueError:
        return False


def start_session(response: Response, user: dict, persistent: bool = False, secure: bool = False) -> None:
    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(days=7 if persistent else 1)
    change(lambda db: db["sessions"].append({"id": str(uuid4()), "hash": hashlib.sha256(token.encode()).hexdigest(), "user_id": user["id"], "expires": expires.isoformat()}))
    response.set_cookie("collectai_session", token, httponly=True, secure=secure, samesite="lax", max_age=(7 if persistent else 1) * 86400, path="/")


def current_user(request: Request) -> dict:
    token = request.cookies.get("collectai_session", "")
    digest = hashlib.sha256(token.encode()).hexdigest()
    db = read()
    session = next((s for s in db["sessions"] if token and hmac.compare_digest(s["hash"], digest) and datetime.fromisoformat(s["expires"]) > datetime.now(timezone.utc)), None)
    user = next((u for u in db["users"] if session and u["id"] == session["user_id"] and u.get("active", True)), None)
    if not user:
        raise HTTPException(401, "Sessão inválida ou expirada")
    return user


def require(*roles: str):
    def dependency(user: dict = Depends(current_user)) -> dict:
        if user["role"] not in roles and not (user["role"] == "superadmin" and "admin" in roles):
            raise HTTPException(403, "Permissão insuficiente")
        return user
    return dependency


def public_user(user: dict) -> dict:
    return {k: user.get(k) for k in ("id", "tenant_id", "name", "email", "role", "team_id", "active")}


def end_session(request: Request, response: Response) -> None:
    token = request.cookies.get("collectai_session", "")
    digest = hashlib.sha256(token.encode()).hexdigest()
    change(lambda db: db.__setitem__("sessions", [s for s in db["sessions"] if s["hash"] != digest]))
    response.delete_cookie("collectai_session", path="/")
