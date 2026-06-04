"""Shared structured sub-objects produced by agents (esp. the CTO node).

These mirror the LangGraph structured outputs described in plan section 5 so
the Phase 5 AI pipeline can bind Gemini structured-output directly to them.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class AgentSchema(BaseModel):
    """Base for agent structured outputs.

    Uses ``extra="ignore"`` so a slightly off-spec key from a free-tier LLM
    (e.g. ``as_`` instead of ``as_a``) drops that one field instead of failing
    the entire structured-output parse and forcing a stub fallback.
    """

    model_config = ConfigDict(extra="ignore")


class HealthScoreDimension(AgentSchema):
    """A single scored dimension contributing to the overall health score."""

    name: str = Field(description="e.g. architecture, scalability, security, maintainability")
    score: float = Field(ge=0, le=100)
    rationale: str


class HealthScore(AgentSchema):
    """Overall project health score (0-100) with per-dimension breakdown."""

    overall: float = Field(ge=0, le=100)
    grade: str = Field(description="Letter grade, e.g. A, B+, C")
    dimensions: list[HealthScoreDimension] = Field(default_factory=list)
    summary: str = ""


class CostLineItem(AgentSchema):
    """A single recurring/one-off cost line item."""

    label: str
    monthly_usd: float = Field(ge=0)
    notes: str | None = None


class CostEstimation(AgentSchema):
    """Estimated infrastructure / operational cost."""

    currency: str = "USD"
    monthly_total_usd: float = Field(ge=0)
    one_time_usd: float = Field(default=0, ge=0)
    line_items: list[CostLineItem] = Field(default_factory=list)
    assumptions: list[str] = Field(default_factory=list)


class TeamRole(AgentSchema):
    """A recommended team role and allocation."""

    role: str = Field(description="e.g. Backend Engineer, Frontend Engineer, DevOps")
    count: float = Field(ge=0, description="Headcount (fractional allowed)")
    seniority: str = Field(default="mid", description="junior|mid|senior|lead")


class TeamEstimation(AgentSchema):
    """Recommended team composition to deliver the project."""

    total_headcount: float = Field(ge=0)
    roles: list[TeamRole] = Field(default_factory=list)
    notes: str | None = None


class DeliveryPhase(AgentSchema):
    """A delivery phase/milestone with a duration estimate."""

    name: str
    duration_weeks: float = Field(ge=0)
    deliverables: list[str] = Field(default_factory=list)


class DeliveryEstimation(AgentSchema):
    """Projected delivery timeline."""

    total_weeks: float = Field(ge=0)
    confidence: str = Field(default="medium", description="low|medium|high")
    phases: list[DeliveryPhase] = Field(default_factory=list)


class Risk(AgentSchema):
    """An identified risk with severity and mitigation."""

    title: str
    severity: str = Field(description="low|medium|high|critical")
    likelihood: str = Field(default="medium", description="low|medium|high")
    mitigation: str
