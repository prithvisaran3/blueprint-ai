"""Pydantic schemas: API request/response models and agent structured outputs."""

from app.schemas.common import APIModel, Page, PaginationParams, SSEEvent
from app.schemas.document import GeneratedDocumentRead
from app.schemas.project import (
    ProjectCreate,
    ProjectDetail,
    ProjectRead,
    ProjectUpdate,
    RunSummary,
)
from app.schemas.run import (
    AgentOutputRead,
    AgentRerunRequest,
    AgentRunRead,
    ExecutionLogRead,
    ExecutionRead,
    GenerateRequest,
    GenerateResponse,
)
from app.schemas.user import UserRead, UserUpsert

__all__ = [
    "APIModel",
    "Page",
    "PaginationParams",
    "SSEEvent",
    "UserRead",
    "UserUpsert",
    "ProjectCreate",
    "ProjectUpdate",
    "ProjectRead",
    "ProjectDetail",
    "RunSummary",
    "GenerateRequest",
    "GenerateResponse",
    "AgentRunRead",
    "AgentOutputRead",
    "ExecutionRead",
    "ExecutionLogRead",
    "AgentRerunRequest",
    "GeneratedDocumentRead",
]
