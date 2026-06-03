"""Frontend agent structured output."""

from __future__ import annotations

from pydantic import Field

from app.schemas.agents.common import AgentSchema


class Route(AgentSchema):
    """A frontend route/page."""

    path: str
    name: str
    description: str = ""


class UIComponent(AgentSchema):
    """A frontend component."""

    name: str
    responsibility: str = ""
    props: list[str] = Field(default_factory=list)


class CodeArtifact(AgentSchema):
    """A representative frontend code snippet/file."""

    path: str
    language: str = "tsx"
    description: str = ""
    snippet: str | None = None


class FrontendOutput(AgentSchema):
    """Structured output for the Frontend agent."""

    summary: str
    framework: str = ""
    routes: list[Route] = Field(default_factory=list)
    components: list[UIComponent] = Field(default_factory=list)
    state_management: str = ""
    styling: str = ""
    code_artifacts: list[CodeArtifact] = Field(default_factory=list)
    dependencies: list[str] = Field(default_factory=list)
