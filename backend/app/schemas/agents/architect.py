"""Architect agent structured output."""

from __future__ import annotations

from pydantic import Field

from app.schemas.agents.common import AgentSchema


class TechChoice(AgentSchema):
    """A selected technology with a justification."""

    category: str = Field(description="e.g. frontend, backend, database, infra")
    choice: str
    rationale: str


class Component(AgentSchema):
    """A logical system component."""

    name: str
    responsibility: str
    depends_on: list[str] = Field(default_factory=list)


class DataEntity(AgentSchema):
    """A core data entity in the proposed system."""

    name: str
    description: str
    key_fields: list[str] = Field(default_factory=list)


class ArchitectOutput(AgentSchema):
    """Structured output for the Architect agent."""

    summary: str
    pattern: str = Field(description="e.g. modular monolith, microservices, serverless")
    tech_stack: list[TechChoice] = Field(default_factory=list)
    components: list[Component] = Field(default_factory=list)
    data_model: list[DataEntity] = Field(default_factory=list)
    integrations: list[str] = Field(default_factory=list)
    diagram_mermaid: str | None = Field(
        default=None, description="Optional Mermaid diagram source"
    )
