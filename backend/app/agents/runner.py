"""Drives the compiled LangGraph pipeline and streams SSE events.

The graph runs as a background task; nodes push :class:`SSEEvent`s onto the
context queue as they execute. This async generator drains that queue and
yields events to the SSE endpoint in real time. Per-node failures are handled
inside the nodes; only a fatal graph error propagates out of here.
"""

from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator
from typing import Any

from app.agents.context import PipelineContext
from app.agents.graph import build_graph
from app.agents.state import initial_state
from app.core.logging import get_logger
from app.schemas.common import SSEEvent

logger = get_logger(__name__)


async def _run_graph(graph: Any, state: Any, config: dict[str, Any], ctx: PipelineContext) -> None:
    """Run the graph to completion, then signal the drainer with a sentinel."""
    try:
        await graph.ainvoke(state, config)
    finally:
        await ctx.queue.put(None)


async def stream_pipeline(
    ctx: PipelineContext,
    idea: str,
    constraints: dict[str, Any] | None = None,
) -> AsyncIterator[SSEEvent]:
    """Execute the pipeline, yielding SSE events as agents run."""
    graph = build_graph()
    state = initial_state(ctx.run_id, idea, constraints)
    config: dict[str, Any] = {
        "configurable": {"ctx": ctx},
        "recursion_limit": 50,
    }

    task = asyncio.create_task(_run_graph(graph, state, config, ctx))
    try:
        while True:
            event = await ctx.queue.get()
            if event is None:
                break
            yield event
        await task
    finally:
        if not task.done():
            task.cancel()
