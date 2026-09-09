"""Wire types.

Field descriptions here are the API reference — FastAPI puts them straight into
the OpenAPI document, which is what Mintlify renders. Writing them anywhere else
means writing them twice.
"""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class AssetType(str, Enum):
    """Which pipeline the graph runs. The CLI infers this; callers state it."""

    stock = "stock"
    crypto = "crypto"


class Analyst(str, Enum):
    """The analyst agents available to a run."""

    market = "market"
    social = "social"
    news = "news"
    fundamentals = "fundamentals"


class Rating(str, Enum):
    """
    The five-tier rating, plus `REVIEW`.

    `REVIEW` is not a weak Hold. It means the decision text carried no parseable
    rating, so the run produced no opinion at all — treat it as missing data and
    never map it onto the buy/sell axis.
    """

    buy = "Buy"
    overweight = "Overweight"
    hold = "Hold"
    underweight = "Underweight"
    sell = "Sell"
    review = "REVIEW"


class JobStatus(str, Enum):
    queued = "queued"
    running = "running"
    succeeded = "succeeded"
    failed = "failed"
    cancelled = "cancelled"


class AnalysisRequest(BaseModel):
    ticker: str = Field(
        ...,
        min_length=1,
        max_length=32,
        description="Instrument symbol, e.g. `NVDA` or `BTC`.",
        examples=["NVDA"],
    )
    trade_date: str = Field(
        ...,
        pattern=r"^\d{4}-\d{2}-\d{2}$",
        description=(
            "The as-of date, `YYYY-MM-DD`. The graph reasons as though standing "
            "on this date, so a future one yields nothing useful."
        ),
        examples=["2024-05-10"],
    )
    asset_type: AssetType = Field(
        default=AssetType.stock,
        description="Selects the stock or crypto pipeline.",
    )
    analysts: list[Analyst] = Field(
        default_factory=lambda: list(Analyst),
        min_length=1,
        description=(
            "Analyst agents to include. Fewer analysts is cheaper and faster, "
            "and narrows what the debate can consider."
        ),
    )
    max_debate_rounds: int | None = Field(
        default=None,
        ge=1,
        le=10,
        description=(
            "Overrides `TRADINGAGENTS_MAX_DEBATE_ROUNDS` for this run. Cost "
            "scales roughly linearly with it."
        ),
    )


class AnalysisResult(BaseModel):
    rating: Rating = Field(description="The run's rating, or `REVIEW`.")
    is_review: bool = Field(
        description=(
            "True when the run produced no parseable rating. Check this before "
            "reading `rating` as an opinion."
        )
    )
    decision: str | None = Field(
        default=None, description="The trader agent's decision text."
    )
    reports: dict[str, Any] = Field(
        default_factory=dict,
        description="Per-agent reports from the final graph state, keyed by agent.",
    )


class Job(BaseModel):
    id: str = Field(description="Opaque job identifier.")
    status: JobStatus
    request: AnalysisRequest
    created_at: datetime
    started_at: datetime | None = None
    finished_at: datetime | None = None
    result: AnalysisResult | None = Field(
        default=None, description="Present only when `status` is `succeeded`."
    )
    error: str | None = Field(
        default=None, description="Present only when `status` is `failed`."
    )


class JobRef(BaseModel):
    """What creating an analysis returns — the run itself is asynchronous."""

    id: str
    status: JobStatus
    poll: str = Field(description="URL to poll for completion.")


class JobList(BaseModel):
    jobs: list[Job]
    total: int


class ComponentHealth(BaseModel):
    status: str = Field(description="`up`, `down`, or `not_configured`.")
    detail: str | None = None


class Health(BaseModel):
    status: str = Field(description="`ok`, `degraded`, or `down`.")
    version: str
    checks: dict[str, ComponentHealth]


class EffectiveConfig(BaseModel):
    """
    The graph configuration actually in force, with credentials removed.

    Exposed because a run's cost and behaviour are decided almost entirely by
    these values, and reading them from a running service beats inferring them
    from whichever `.env` you think is loaded.
    """

    llm_provider: str | None = None
    deep_think_llm: str | None = None
    quick_think_llm: str | None = None
    max_debate_rounds: int | None = None
    max_risk_discuss_rounds: int | None = None
    online_tools: bool | None = None


class Error(BaseModel):
    detail: str
