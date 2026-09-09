"""HTTP wrapper around the TradingAgents multi-agent graph.

Upstream is TradingAgents by Tauric Research, Apache-2.0:
https://github.com/TauricResearch/TradingAgents

This service is the HTTP surface only. It runs no strategy of its own, and it
places no orders — it starts analyses, reports their state, and returns what the
graph decided.
"""

from __future__ import annotations

import asyncio
import contextlib
import logging
from typing import Annotated

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Response, status
from fastapi.responses import JSONResponse

from . import runner
from .jobs import store
from .models import (
    AnalysisRequest,
    ComponentHealth,
    EffectiveConfig,
    Error,
    Health,
    Job,
    JobList,
    JobRef,
    JobStatus,
)
from .settings import get_settings

VERSION = "0.1.0"

logging.basicConfig(level=logging.INFO)

DESCRIPTION = """
An HTTP API over the [TradingAgents](https://github.com/TauricResearch/TradingAgents)
multi-agent LLM trading framework by Tauric Research, used under Apache-2.0.

## Analyses are asynchronous

A single analysis runs a full multi-agent debate and takes **minutes**, not
seconds. `POST /v1/analyses` therefore returns a job reference immediately and
the result is collected by polling `GET /v1/analyses/{id}`.

## Ratings

A completed analysis carries one of `Buy`, `Overweight`, `Hold`, `Underweight`,
`Sell` — or `REVIEW`.

`REVIEW` is **not** a weak Hold. It means the run produced no parseable rating,
so there is no opinion to act on. Check `is_review` before reading `rating`.

## This API places no orders

Nothing here can move money. It starts analyses and returns what they decided.
"""


@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    async def reap() -> None:
        while True:
            await asyncio.sleep(600)
            with contextlib.suppress(Exception):
                await store.evict_expired()

    task = asyncio.create_task(reap())
    try:
        yield
    finally:
        task.cancel()
        store.shutdown()


app = FastAPI(
    title="BlackQuant TradingAgents API",
    version=VERSION,
    description=DESCRIPTION,
    lifespan=lifespan,
    servers=[
        {"url": "http://127.0.0.1:8900", "description": "Local"},
    ],
    openapi_tags=[
        {"name": "Analyses", "description": "Start, poll and cancel analyses."},
        {"name": "Service", "description": "Health and effective configuration."},
    ],
)


async def require_api_key(
    x_api_key: Annotated[str | None, Header(alias="X-API-Key")] = None,
) -> None:
    """
    Shared-secret auth.

    Unset `TA_SERVICE_API_KEY` disables it, which is only safe on a loopback
    bind — every analysis spends real LLM tokens, so an open instance is a
    billing hole as much as a data one.
    """
    configured = get_settings().api_key
    if configured is None:
        return
    if x_api_key != configured:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid or missing API key")


@app.get(
    "/health",
    response_model=Health,
    tags=["Service"],
    summary="Liveness and dependency check",
)
async def health() -> Health:
    """
    Unauthenticated, so a monitor with no credentials can reach it.

    `not_configured` is distinct from `down`: the first means TradingAgents was
    never installed here, the second that it is present and broken. Only the
    second is an incident.
    """
    if runner.is_available():
        engine = ComponentHealth(status="up")
        overall = "ok"
    else:
        engine = ComponentHealth(
            status="not_configured",
            detail="tradingagents is not installed in this environment",
        )
        overall = "degraded"

    return Health(status=overall, version=VERSION, checks={"tradingagents": engine})


@app.get(
    "/v1/config",
    response_model=EffectiveConfig,
    tags=["Service"],
    dependencies=[Depends(require_api_key)],
    responses={503: {"model": Error, "description": "TradingAgents unavailable"}},
    summary="Effective graph configuration",
)
async def config() -> EffectiveConfig:
    """The configuration in force, with anything credential-shaped removed."""
    try:
        return runner.effective_config()
    except runner.TradingAgentsUnavailable as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc)) from exc


@app.post(
    "/v1/analyses",
    response_model=JobRef,
    status_code=status.HTTP_202_ACCEPTED,
    tags=["Analyses"],
    dependencies=[Depends(require_api_key)],
    responses={401: {"model": Error}, 503: {"model": Error}},
    summary="Start an analysis",
)
async def create_analysis(req: AnalysisRequest) -> JobRef:
    """
    Queue an analysis and return immediately with **202 Accepted**.

    The response is a job reference, not a result — poll `poll` until `status`
    leaves `queued`/`running`.
    """
    if not runner.is_available():
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "tradingagents is not installed in this environment",
        )
    job = await store.create(req)
    return JobRef(id=job.id, status=job.status, poll=f"/v1/analyses/{job.id}")


@app.get(
    "/v1/analyses",
    response_model=JobList,
    tags=["Analyses"],
    dependencies=[Depends(require_api_key)],
    summary="List analyses",
)
async def list_analyses(
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> JobList:
    """Newest first. Finished jobs are evicted after the retention window."""
    jobs, total = await store.list(limit, offset)
    return JobList(jobs=jobs, total=total)


@app.get(
    "/v1/analyses/{job_id}",
    response_model=Job,
    tags=["Analyses"],
    dependencies=[Depends(require_api_key)],
    responses={404: {"model": Error, "description": "Unknown or evicted job"}},
    summary="Get an analysis",
)
async def get_analysis(job_id: str) -> Job:
    """
    Poll for completion.

    `result` is populated only on `succeeded`; `error` only on `failed`. A 404
    means the id was never issued, or the job has aged out of retention.
    """
    job = await store.get(job_id)
    if job is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "no such analysis")
    return job


@app.delete(
    "/v1/analyses/{job_id}",
    response_model=Job,
    tags=["Analyses"],
    dependencies=[Depends(require_api_key)],
    responses={404: {"model": Error}},
    summary="Cancel an analysis",
)
async def cancel_analysis(job_id: str) -> Job:
    """
    Stop waiting on a run and free its slot.

    A graph already mid-debate cannot truly be interrupted, so this marks the
    job `cancelled` and releases the concurrency slot rather than claiming to
    have killed work that is still finishing.
    """
    job = await store.cancel(job_id)
    if job is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "no such analysis")
    return job


@app.exception_handler(HTTPException)
async def http_exception_handler(_, exc: HTTPException) -> Response:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
