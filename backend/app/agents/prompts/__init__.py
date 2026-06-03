"""Per-agent prompt templates for the LangGraph pipeline (one module per agent).

Each agent module exposes:

* ``SYSTEM`` — the system instruction for that agent.
* ``build(state)`` — builds the human prompt from the shared ``GraphState``,
  including a compact summary of the relevant prior agent outputs.

A ``PROMPTS`` registry maps each :class:`~app.models.enums.AgentName` to its
``(SYSTEM, build)`` pair so the nodes can resolve prompts generically.
"""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from app.models.enums import AgentName

from . import (
    architect,
    backend,
    cto_review,
    documentation,
    frontend,
    planner,
    qa,
)
from ._util import summarize

PromptPair = tuple[str, Callable[[dict[str, Any]], str]]

PROMPTS: dict[AgentName, PromptPair] = {
    AgentName.ARCHITECT: (architect.SYSTEM, architect.build),
    AgentName.PLANNER: (planner.SYSTEM, planner.build),
    AgentName.BACKEND: (backend.SYSTEM, backend.build),
    AgentName.FRONTEND: (frontend.SYSTEM, frontend.build),
    AgentName.QA: (qa.SYSTEM, qa.build),
    AgentName.DOCUMENTATION: (documentation.SYSTEM, documentation.build),
    AgentName.CTO_REVIEW: (cto_review.SYSTEM, cto_review.build),
}

__all__ = ["PROMPTS", "PromptPair", "summarize"]
