"""FastAPI application entrypoint.

Wires configuration, logging, CORS, exception handling, and the v1 API router.
Importing this module never opens a database connection (the engine is lazy),
so ``python -c "import app.main"`` and ``uvicorn app.main:app`` both work with a
placeholder ``DATABASE_URL``.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import __version__
from app.api.v1 import api_router
from app.core.config import get_settings
from app.core.logging import configure_logging, get_logger
from app.exceptions import AppError

settings = get_settings()
configure_logging(settings.log_level)
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Application startup/shutdown. No DB connection is opened here."""
    logger.info(
        "Starting %s (env=%s, version=%s)",
        settings.app_name,
        settings.app_env,
        __version__,
    )
    if settings.auth_dev_bypass:
        logger.warning("AUTH_DEV_BYPASS is enabled — all requests use a fake dev user.")
    yield
    logger.info("Shutting down %s", settings.app_name)


app = FastAPI(
    title=settings.app_name,
    version=__version__,
    description="Blueprint AI backend — multi-agent engineering intelligence platform.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    """Translate domain errors into clean JSON responses."""
    if exc.status_code >= 500:
        logger.exception("Unhandled application error: %s", exc.message)
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.code, "message": exc.message}},
    )


app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/", tags=["root"], summary="Service root")
def root() -> dict[str, str]:
    return {
        "service": settings.app_name,
        "version": __version__,
        "docs": "/docs",
        "api": settings.api_v1_prefix,
    }
