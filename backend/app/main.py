import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.config import get_settings
from app.contexts.brand_identity.interfaces.router import router as brand_router
from app.contexts.content_creation.interfaces.router import router as content_router
from app.contexts.governance.interfaces.router import router as governance_router
from app.contexts.identity_access.interfaces.router import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Fail-fast: si falta config obligatoria, revienta al arrancar.
    get_settings()
    yield


# En producción ocultamos Swagger/ReDoc/OpenAPI (no exponer el mapa de la API).
_docs_off = get_settings().app_env == "production"
app = FastAPI(
    title="Content Suite API",
    version=__version__,
    lifespan=lifespan,
    docs_url=None if _docs_off else "/docs",
    redoc_url=None if _docs_off else "/redoc",
    openapi_url=None if _docs_off else "/openapi.json",
)

# CORS: el frontend (Next.js) llama a la API desde el navegador. Orígenes
# permitidos vía CORS_ORIGINS (coma-separado); por defecto, dev local.
_cors = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3123").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _cors if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_API = "/api/v1"
app.include_router(auth_router, prefix=_API)
app.include_router(brand_router, prefix=_API)
app.include_router(content_router, prefix=_API)
app.include_router(governance_router, prefix=_API)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "version": __version__}
