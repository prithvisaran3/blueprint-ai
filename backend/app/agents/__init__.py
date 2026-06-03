"""LangGraph agent pipeline package (plan section 5).

The 7-agent sequential pipeline — ``Architect → Planner → Backend → Frontend →
QA → Documentation → CTO Review`` — runs over the shared typed
:class:`~app.agents.state.GraphState`. Each node makes one Gemini 2.5 Flash call
with structured output bound to the agent's Pydantic schema, streams progress +
token events over SSE, and persists its output.

Public surface:

* :func:`~app.agents.graph.build_graph` — compile the LangGraph pipeline.
* :func:`~app.agents.runner.stream_pipeline` — run it and stream SSE events.
* :class:`~app.agents.context.PipelineContext` — per-run emit/persist wiring.

When ``GEMINI_API_KEY`` is unset the LLM layer falls back to the deterministic
stub, so the whole pipeline still imports and runs end-to-end without a key.
"""

from __future__ import annotations

from app.agents.context import PipelineContext
from app.agents.graph import AGENT_SEQUENCE, build_graph
from app.agents.runner import stream_pipeline
from app.agents.state import GraphState, initial_state

__all__ = [
    "AGENT_SEQUENCE",
    "GraphState",
    "PipelineContext",
    "build_graph",
    "initial_state",
    "stream_pipeline",
]
