"""CTO Review agent structured output.

The CTO node reads all prior agent outputs and produces the cross-cutting
estimations (health score, cost, team, delivery) plus a final verdict.
"""

from __future__ import annotations

from pydantic import Field

from app.schemas.agents.common import (
    AgentSchema,
    CostEstimation,
    DeliveryEstimation,
    HealthScore,
    Risk,
    TeamEstimation,
)


class CTOReviewOutput(AgentSchema):
    """Structured output for the CTO Review agent."""

    summary: str
    verdict: str = Field(description="e.g. go, no-go, go-with-changes")
    health_score: HealthScore
    cost_estimation: CostEstimation
    team_estimation: TeamEstimation
    delivery_estimation: DeliveryEstimation
    key_risks: list[Risk] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
