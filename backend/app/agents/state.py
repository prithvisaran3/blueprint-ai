"""Shared, typed state for the LangGraph agent pipeline (plan section 5).

Every node reads prior outputs from this state and writes its own. The CTO node
reads everything. Agent outputs are stored as plain ``dict`` (the JSON dump of
the per-agent Pydantic schema) so the state stays serializable and matches what
gets persisted to ``agent_outputs.output``.
"""

from __future__ import annotations

from typing import Annotated, Any, TypedDict


def _take_last(_existing: Any, new: Any) -> Any:
    """Reducer: later writes win (nodes write their own slice exactly once)."""
    return new


class GraphState(TypedDict, total=False):
    """State threaded through the 7-agent sequential graph.

    The ``*_output`` keys hold each agent's structured output as a JSON-able
    dict. ``run_id``/``idea``/``constraints`` are inputs. ``total_tokens`` and
    ``total_duration_ms`` accumulate across nodes for the run summary.
    """

    # --- Inputs --------------------------------------------------------------
    run_id: str
    idea: str
    constraints: dict[str, Any]

    # --- Per-agent structured outputs (JSON dicts) ---------------------------
    architect: dict[str, Any] | None
    planner: dict[str, Any] | None
    backend: dict[str, Any] | None
    frontend: dict[str, Any] | None
    qa: dict[str, Any] | None
    documentation: dict[str, Any] | None
    cto_review: dict[str, Any] | None

    # --- Accumulators --------------------------------------------------------
    total_tokens: Annotated[int, lambda a, b: (a or 0) + (b or 0)]
    total_duration_ms: Annotated[int, lambda a, b: (a or 0) + (b or 0)]
    # Names of agents whose node raised and produced no/partial output.
    failed_agents: Annotated[list[str], lambda a, b: [*(a or []), *(b or [])]]


def initial_state(run_id: str, idea: str, constraints: dict[str, Any] | None = None) -> GraphState:
    """Build the initial graph state for a run."""
    return GraphState(
        run_id=run_id,
        idea=idea,
        constraints=constraints or {},
        architect=None,
        planner=None,
        backend=None,
        frontend=None,
        qa=None,
        documentation=None,
        cto_review=None,
        total_tokens=0,
        total_duration_ms=0,
        failed_agents=[],
    )
