"""Service configuration.

Everything the wrapper itself needs. TradingAgents reads its own `TRADINGAGENTS_*`
variables directly from the environment, so they are deliberately not mirrored
here — one copy of a setting cannot disagree with itself.
"""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="TA_SERVICE_", env_file=".env")

    api_key: str | None = Field(
        default=None,
        description=(
            "Shared secret required in the X-API-Key header. Unset disables "
            "auth, which is only appropriate on a loopback bind."
        ),
    )

    max_concurrent_analyses: int = Field(
        default=2,
        ge=1,
        le=32,
        description=(
            "Analyses running at once. Each is a full multi-agent debate and "
            "costs real LLM tokens, so the ceiling is a spend control as much "
            "as a resource one."
        ),
    )

    job_retention_hours: int = Field(
        default=24,
        ge=1,
        description="How long finished jobs stay readable before eviction.",
    )

    request_timeout_seconds: int = Field(
        default=1800,
        ge=60,
        description="Hard ceiling on a single analysis before it is failed.",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
