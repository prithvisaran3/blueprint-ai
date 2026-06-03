"""QA agent structured output."""

from __future__ import annotations

from pydantic import Field

from app.schemas.agents.common import AgentSchema, Risk


class TestCase(AgentSchema):
    """A proposed test case."""

    title: str
    type: str = Field(default="unit", description="unit|integration|e2e|load|security")
    given: str = ""
    when: str = ""
    then: str = ""
    priority: str = Field(default="medium", description="low|medium|high")


class QAOutput(AgentSchema):
    """Structured output for the QA agent."""

    summary: str
    strategy: str = ""
    test_cases: list[TestCase] = Field(default_factory=list)
    coverage_targets: dict[str, float] = Field(default_factory=dict)
    risks: list[Risk] = Field(default_factory=list)
    tooling: list[str] = Field(default_factory=list)
