"""Agent structured-output schemas (plan section 5).

A registry maps each :class:`~app.models.enums.AgentName` to its output schema
so the Phase 5 LangGraph pipeline can resolve the correct Pydantic model for
Gemini structured output, and Phase 3 stubs can validate placeholder data.
"""

from __future__ import annotations

from app.models.enums import AgentName
from app.schemas.agents.architect import ArchitectOutput
from app.schemas.agents.backend import BackendOutput
from app.schemas.agents.common import (
    CostEstimation,
    DeliveryEstimation,
    HealthScore,
    Risk,
    TeamEstimation,
)
from app.schemas.agents.cto_review import CTOReviewOutput
from app.schemas.agents.documentation import DocumentationOutput
from app.schemas.agents.frontend import FrontendOutput
from app.schemas.agents.planner import PlannerOutput
from app.schemas.agents.qa import QAOutput

AGENT_OUTPUT_SCHEMAS: dict[AgentName, type] = {
    AgentName.ARCHITECT: ArchitectOutput,
    AgentName.PLANNER: PlannerOutput,
    AgentName.BACKEND: BackendOutput,
    AgentName.FRONTEND: FrontendOutput,
    AgentName.QA: QAOutput,
    AgentName.DOCUMENTATION: DocumentationOutput,
    AgentName.CTO_REVIEW: CTOReviewOutput,
}

__all__ = [
    "AGENT_OUTPUT_SCHEMAS",
    "ArchitectOutput",
    "PlannerOutput",
    "BackendOutput",
    "FrontendOutput",
    "QAOutput",
    "DocumentationOutput",
    "CTOReviewOutput",
    "HealthScore",
    "CostEstimation",
    "TeamEstimation",
    "DeliveryEstimation",
    "Risk",
]
