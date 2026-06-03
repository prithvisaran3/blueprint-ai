"""Planner agent structured output (Epics / Stories / Tasks)."""

from __future__ import annotations

from pydantic import Field

from app.schemas.agents.common import AgentSchema


class Task(AgentSchema):
    """A concrete task under a story."""

    title: str
    description: str = ""
    estimate_hours: float = Field(default=0, ge=0)
    labels: list[str] = Field(default_factory=list)


class Story(AgentSchema):
    """A user story containing tasks."""

    title: str
    as_a: str | None = None
    i_want: str | None = None
    so_that: str | None = None
    acceptance_criteria: list[str] = Field(default_factory=list)
    story_points: int = Field(default=0, ge=0)
    tasks: list[Task] = Field(default_factory=list)


class Epic(AgentSchema):
    """An epic grouping related stories."""

    title: str
    goal: str = ""
    stories: list[Story] = Field(default_factory=list)


class Milestone(AgentSchema):
    """A delivery milestone referencing epics."""

    name: str
    epics: list[str] = Field(default_factory=list)


class PlannerOutput(AgentSchema):
    """Structured output for the Planner agent."""

    summary: str
    epics: list[Epic] = Field(default_factory=list)
    milestones: list[Milestone] = Field(default_factory=list)
