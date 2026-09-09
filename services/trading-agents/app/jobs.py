"""In-process job store and worker pool.

Analyses are minutes long, so the API is asynchronous: create a job, poll it.
A synchronous endpoint would sit behind every proxy's read timeout and fail for
reasons that have nothing to do with the analysis.

The store is in memory, which is a real constraint and is stated plainly in the
service README: jobs do not survive a restart, and two replicas do not share
them. Swapping this module for Redis or Postgres is the intended upgrade path —
nothing outside it knows how jobs are stored.
"""

from __future__ import annotations

import asyncio
import logging
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone

from . import runner
from .models import AnalysisRequest, Job, JobStatus
from .settings import get_settings

log = logging.getLogger(__name__)

_now = lambda: datetime.now(timezone.utc)  # noqa: E731

#: Once a job reaches one of these it is settled, and nothing may move it again.
#: Without this, cancelling a job whose analysis is already failing is a race:
#: `cancel` writes `cancelled`, the in-flight failure then writes `failed` over
#: it, and the caller is told their cancel did not take.
TERMINAL = (JobStatus.succeeded, JobStatus.failed, JobStatus.cancelled)


class JobStore:
    def __init__(self) -> None:
        settings = get_settings()
        self._jobs: dict[str, Job] = {}
        self._tasks: dict[str, asyncio.Task] = {}
        self._lock = asyncio.Lock()
        self._slots = asyncio.Semaphore(settings.max_concurrent_analyses)
        # The graph is synchronous and CPU/IO-bound in equal measure; running it
        # in a thread keeps the event loop free to answer polls while it works.
        self._pool = ThreadPoolExecutor(
            max_workers=settings.max_concurrent_analyses,
            thread_name_prefix="analysis",
        )

    async def create(self, req: AnalysisRequest) -> Job:
        job = Job(
            id=uuid.uuid4().hex,
            status=JobStatus.queued,
            request=req,
            created_at=_now(),
        )
        async with self._lock:
            self._jobs[job.id] = job
        self._tasks[job.id] = asyncio.create_task(self._run(job.id))
        return job

    async def get(self, job_id: str) -> Job | None:
        async with self._lock:
            return self._jobs.get(job_id)

    async def list(self, limit: int, offset: int) -> tuple[list[Job], int]:
        async with self._lock:
            ordered = sorted(
                self._jobs.values(), key=lambda j: j.created_at, reverse=True
            )
            return ordered[offset : offset + limit], len(ordered)

    async def cancel(self, job_id: str) -> Job | None:
        async with self._lock:
            job = self._jobs.get(job_id)
            if job is None:
                return None
            if job.status in TERMINAL:
                return job

        task = self._tasks.get(job_id)
        if task is not None:
            task.cancel()

        async with self._lock:
            job = self._jobs[job_id]
            # Re-check under the lock: the analysis may have settled on its own
            # between the read above and this write, and a finished job must not
            # be relabelled as cancelled.
            if job.status in TERMINAL:
                return job
            # A running analysis cannot actually be interrupted mid-graph; this
            # stops the result being awaited and frees the slot, which is what
            # "cancel" can honestly mean here.
            job.status = JobStatus.cancelled
            job.finished_at = _now()
            return job

    async def _run(self, job_id: str) -> None:
        settings = get_settings()
        async with self._slots:
            async with self._lock:
                job = self._jobs[job_id]
                job.status = JobStatus.running
                job.started_at = _now()
                request = job.request

            try:
                result = await asyncio.wait_for(
                    asyncio.get_running_loop().run_in_executor(
                        self._pool, runner.run_analysis, request
                    ),
                    timeout=settings.request_timeout_seconds,
                )
            except asyncio.CancelledError:
                raise
            except asyncio.TimeoutError:
                await self._fail(job_id, "analysis exceeded the configured timeout")
                return
            except runner.TradingAgentsUnavailable as exc:
                await self._fail(job_id, f"tradingagents unavailable: {exc}")
                return
            except Exception as exc:  # noqa: BLE001 - surfaced to the caller
                log.exception("analysis %s failed", job_id)
                await self._fail(job_id, f"{type(exc).__name__}: {exc}")
                return

            async with self._lock:
                job = self._jobs[job_id]
                if job.status in TERMINAL:
                    return
                job.status = JobStatus.succeeded
                job.result = result
                job.finished_at = _now()

    async def _fail(self, job_id: str, message: str) -> None:
        async with self._lock:
            job = self._jobs.get(job_id)
            # A job cancelled while its analysis was already failing is
            # cancelled, not failed — whichever outcome landed first stands.
            if job is None or job.status in TERMINAL:
                return
            job.status = JobStatus.failed
            job.error = message
            job.finished_at = _now()

    async def evict_expired(self) -> int:
        cutoff = _now() - timedelta(hours=get_settings().job_retention_hours)
        async with self._lock:
            stale = [
                jid
                for jid, job in self._jobs.items()
                if job.finished_at is not None and job.finished_at < cutoff
            ]
            for jid in stale:
                self._jobs.pop(jid, None)
                self._tasks.pop(jid, None)
        return len(stale)

    def shutdown(self) -> None:
        self._pool.shutdown(wait=False, cancel_futures=True)


store = JobStore()
