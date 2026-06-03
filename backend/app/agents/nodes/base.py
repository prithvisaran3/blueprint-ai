"""Generic LangGraph node factory shared by all seven agents.

Each node: emits ``agent_started`` → calls Gemini (structured output) → streams
a few ``agent_token`` events → persists the output + log → emits
``agent_completed``. On failure it marks the agent failed, persists the partial
result, and returns gracefully so downstream nodes still run.
"""

from __future__ import annotations

import time
from collections.abc import Awaitable, Callable
from typing import Any

from langchain_core.runnables import RunnableConfig

from app.agents.context import PipelineContext
from app.agents.llm import generate_structured
from app.core.logging import get_logger
from app.models.enums import AgentName, AgentOutputStatus, LogLevel

logger = get_logger(__name__)

# How many representative token events to stream from an agent's summary.
_TOKEN_CHUNKS = 6

NodeFn = Callable[[dict[str, Any], RunnableConfig], Awaitable[dict[str, Any]]]


def _get_ctx(config: RunnableConfig) -> PipelineContext:
    ctx = (config or {}).get("configurable", {}).get("ctx")
    if not isinstance(ctx, PipelineContext):  # pragma: no cover - defensive
        raise RuntimeError("PipelineContext missing from run config")
    return ctx


def _summary_chunks(output: dict[str, Any]) -> list[str]:
    """Split an agent's summary into a few chunks for representative streaming."""
    summary = str(output.get("summary") or "").strip()
    if not summary:
        return []
    words = summary.split()
    if len(words) <= _TOKEN_CHUNKS:
        return words
    size = max(1, len(words) // _TOKEN_CHUNKS)
    return [" ".join(words[i : i + size]) for i in range(0, len(words), size)]


def make_node(agent: AgentName) -> NodeFn:
    """Build the async LangGraph node callable for ``agent``."""

    async def node(state: dict[str, Any], config: RunnableConfig) -> dict[str, Any]:
        ctx = _get_ctx(config)
        await ctx.agent_started(agent)
        started = time.monotonic()
        try:
            output, tokens = await generate_structured(agent, state, ctx.settings)
        except Exception as exc:  # noqa: BLE001 - isolate per-node failures
            duration_ms = int((time.monotonic() - started) * 1000)
            logger.exception("Agent %s failed", agent.value)
            ctx.persist_output(agent, AgentOutputStatus.FAILED, None, 0, duration_ms)
            await ctx.agent_failed(agent, str(exc))
            await ctx.agent_completed(
                agent,
                status=AgentOutputStatus.FAILED,
                output=None,
                tokens=0,
                duration_ms=duration_ms,
            )
            return {
                agent.value: None,
                "failed_agents": [agent.value],
                "total_duration_ms": duration_ms,
            }

        duration_ms = int((time.monotonic() - started) * 1000)
        for chunk in _summary_chunks(output):
            await ctx.agent_token(agent, chunk + " ")
        ctx.persist_output(agent, AgentOutputStatus.COMPLETED, output, tokens, duration_ms)
        ctx.persist_log(
            agent, f"Agent '{agent.value}' completed", LogLevel.INFO, {"tokens": tokens}
        )
        await ctx.agent_completed(
            agent,
            status=AgentOutputStatus.COMPLETED,
            output=output,
            tokens=tokens,
            duration_ms=duration_ms,
        )
        return {
            agent.value: output,
            "total_tokens": tokens,
            "total_duration_ms": duration_ms,
        }

    node.__name__ = f"{agent.value}_node"
    return node
