"""API v1 aggregate router."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.routers import (
    agents,
    documents,
    executions,
    export,
    generate,
    health,
    history,
    projects,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(projects.router)
api_router.include_router(generate.router)
api_router.include_router(executions.router)
api_router.include_router(history.router)
api_router.include_router(agents.router)
api_router.include_router(documents.router)
api_router.include_router(export.router)

__all__ = ["api_router"]
