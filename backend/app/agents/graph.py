"""LangGraph wiring for the sequential 7-agent pipeline (plan section 5).

``Architect → Planner → Backend → Frontend → QA → Documentation → CTO Review``
over the shared :class:`GraphState`. Each node reads prior outputs and writes
its own slice; the CTO node reads everything. The compiled graph is cached so
it is built once per process.
"""

from __future__ import annotations

from functools import lru_cache
from typing import TYPE_CHECKING

from app.models.enums import AgentName

from .nodes import NODES
from .state import GraphState

if TYPE_CHECKING:
    from langgraph.graph.state import CompiledStateGraph

# Canonical execution order (mirrors stubs.AGENT_SEQUENCE).
AGENT_SEQUENCE: tuple[AgentName, ...] = (
    AgentName.ARCHITECT,
    AgentName.PLANNER,
    AgentName.BACKEND,
    AgentName.FRONTEND,
    AgentName.QA,
    AgentName.DOCUMENTATION,
    AgentName.CTO_REVIEW,
)


@lru_cache(maxsize=1)
def build_graph() -> CompiledStateGraph:
    """Build and compile the sequential agent ``StateGraph`` (cached)."""
    from langgraph.graph import END, START, StateGraph

    builder: StateGraph = StateGraph(GraphState)

    for agent in AGENT_SEQUENCE:
        builder.add_node(agent.value, NODES[agent])

    builder.add_edge(START, AGENT_SEQUENCE[0].value)
    for current, nxt in zip(AGENT_SEQUENCE, AGENT_SEQUENCE[1:], strict=False):
        builder.add_edge(current.value, nxt.value)
    builder.add_edge(AGENT_SEQUENCE[-1].value, END)

    return builder.compile()
