"""Backend agent structured output."""

from __future__ import annotations

from pydantic import Field

from app.schemas.agents.common import AgentSchema


class APIEndpoint(AgentSchema):
    """A proposed REST endpoint."""

    method: str = Field(description="GET|POST|PUT|PATCH|DELETE")
    path: str
    description: str = ""
    auth_required: bool = True


class DataModel(AgentSchema):
    """A backend data model / table."""

    name: str
    fields: list[str] = Field(default_factory=list)
    relationships: list[str] = Field(default_factory=list)


class CodeArtifact(AgentSchema):
    """A representative code snippet/file the backend should contain."""

    path: str
    language: str = "python"
    description: str = ""
    snippet: str | None = None


class BackendOutput(AgentSchema):
    """Structured output for the Backend agent."""

    summary: str
    framework: str = ""
    endpoints: list[APIEndpoint] = Field(default_factory=list)
    models: list[DataModel] = Field(default_factory=list)
    services: list[str] = Field(default_factory=list)
    code_artifacts: list[CodeArtifact] = Field(default_factory=list)
    dependencies: list[str] = Field(default_factory=list)
