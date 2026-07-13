from contextlib import asynccontextmanager

from fastapi import FastAPI

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


app = FastAPI(title="Content Suite API", version=__version__, lifespan=lifespan)
app.include_router(auth_router)
app.include_router(brand_router)
app.include_router(content_router)
app.include_router(governance_router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "version": __version__}
