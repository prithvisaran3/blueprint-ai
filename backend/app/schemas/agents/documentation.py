"""Documentation agent structured output."""

from __future__ import annotations

from pydantic import Field

from app.models.enums import DocType
from app.schemas.agents.common import AgentSchema


class DocumentDraft(AgentSchema):
    """A single generated document draft."""

    doc_type: DocType
    title: str
    content_md: str


class DocumentationOutput(AgentSchema):
    """Structured output for the Documentation agent."""

    summary: str
    documents: list[DocumentDraft] = Field(default_factory=list)
