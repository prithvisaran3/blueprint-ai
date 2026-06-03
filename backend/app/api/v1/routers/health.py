"""Health/liveness endpoint (also keeps the Render instance warm)."""

from __future__ import annotations

from fastapi import APIRouter

from app import __version__
from app.core.deps import SettingsDep

router = APIRouter(tags=["health"])


@router.get("/health", summary="Liveness probe")
def health(settings: SettingsDep) -> dict[str, str]:
    """Return basic liveness info. Does not touch the database."""
    return {
        "status": "ok",
        "app": settings.app_name,
        "env": settings.app_env,
        "version": __version__,
    }
