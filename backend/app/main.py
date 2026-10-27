from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import DATA_PATH, FRONTEND_ORIGIN
from app.modules import admin, auth, finance, insights, records

CLOUDFLARE_RUNTIME = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not CLOUDFLARE_RUNTIME and not DATA_PATH.exists():
        raise RuntimeError("Dados de demonstração ausentes. Execute python scripts/seed_demo.py")
    yield


app = FastAPI(title="CollectAI API", version="0.1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=[FRONTEND_ORIGIN, "http://127.0.0.1:5173"], allow_credentials=True, allow_methods=["GET", "POST", "PATCH"], allow_headers=["Content-Type"])


@app.middleware("http")
async def protect_origin(request: Request, call_next):
    if request.method in ("POST", "PATCH", "PUT", "DELETE"):
        origin = request.headers.get("origin")
        same_origin = str(request.base_url).rstrip("/")
        if origin and origin not in (FRONTEND_ORIGIN, "http://127.0.0.1:5173", same_origin):
            return JSONResponse({"detail": "Origem não autorizada"}, status_code=403)
    return await call_next(request)


@app.get("/api/v1/health")
def health():
    return {"status": "ok"}


for router in (auth.router, finance.router, insights.router, admin.router, records.router):
    app.include_router(router, prefix="/api/v1")
