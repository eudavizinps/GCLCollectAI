from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel

from app.core.security import current_user, end_session, password_matches, public_user, start_session
from app.core.storage import read

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginInput(BaseModel):
    email: str
    password: str
    remember: bool = False


@router.post("/login")
def login(payload: LoginInput, response: Response, request: Request):
    user = next((u for u in read()["users"] if u["email"].casefold() == payload.email.casefold() and u.get("active", True)), None)
    if not user or not password_matches(payload.password, user["password_hash"]):
        raise HTTPException(401, "E-mail ou senha inválidos")
    start_session(response, user, payload.remember, secure=request.url.scheme == "https")
    return public_user(user)


@router.post("/logout")
def logout(request: Request, response: Response, _: dict = Depends(current_user)):
    end_session(request, response)
    return {"ok": True}


@router.get("/me")
def me(user: dict = Depends(current_user)):
    return public_user(user)


@router.post("/recover")
def recover():
    return {"message": "Recuperação por e-mail indisponível no modo local. Solicite ao administrador a redefinição da senha."}
