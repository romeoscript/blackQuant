"""The adapter onto TradingAgents.

Every import of the upstream package is confined to this module and is done
lazily, so the service starts, serves `/health` and serves its OpenAPI document
on a machine where `tradingagents` is not installed. A wrapper that could not
start without its dependency would make "is it configured?" unanswerable over
the very API you would ask it with.

Upstream is TradingAgents by Tauric Research (Apache-2.0):
https://github.com/TauricResearch/TradingAgents
"""

from __future__ import annotations

import logging
from typing import Any

from .models import AnalysisRequest, AnalysisResult, EffectiveConfig, Rating

log = logging.getLogger(__name__)

# Ratings the graph can emit. Anything outside this set is treated as REVIEW
# rather than coerced onto the buy/sell axis.
_KNOWN_RATINGS = {r.value.lower(): r for r in Rating if r is not Rating.review}


class TradingAgentsUnavailable(RuntimeError):
    """Raised when the upstream package is absent or cannot be configured."""


def is_available() -> bool:
    try:
        import tradingagents  # noqa: F401
    except Exception:
        return False
    return True


def effective_config() -> EffectiveConfig:
    """Read the graph config in force, dropping anything credential-shaped."""
    try:
        from tradingagents.default_config import DEFAULT_CONFIG
    except Exception as exc:  # pragma: no cover - depends on the environment
        raise TradingAgentsUnavailable(str(exc)) from exc

    cfg = dict(DEFAULT_CONFIG)
    return EffectiveConfig(
        llm_provider=cfg.get("llm_provider"),
        deep_think_llm=cfg.get("deep_think_llm"),
        quick_think_llm=cfg.get("quick_think_llm"),
        max_debate_rounds=cfg.get("max_debate_rounds"),
        max_risk_discuss_rounds=cfg.get("max_risk_discuss_rounds"),
        online_tools=cfg.get("online_tools"),
    )


def _coerce_rating(signal: Any) -> tuple[Rating, bool]:
    """
    Map the graph's signal onto the rating enum.

    Upstream returns `"REVIEW"` when the decision carried no parseable rating,
    and that is a distinct outcome from a Hold: one is an opinion, the other is
    the absence of one. Unrecognised values collapse to REVIEW for the same
    reason — inventing a rating from an unparseable answer is worse than
    reporting that there wasn't one.
    """
    text = str(signal or "").strip()
    match = _KNOWN_RATINGS.get(text.lower())
    if match is not None:
        return match, False
    if text and text.upper() != "REVIEW":
        log.warning("unrecognised rating from graph: %r", text)
    return Rating.review, True


def run_analysis(req: AnalysisRequest) -> AnalysisResult:
    """
    Run one analysis to completion. Blocking, and slow by nature — a full
    multi-agent debate, not a lookup. Callers reach this through the job queue.
    """
    try:
        from tradingagents.default_config import DEFAULT_CONFIG
        from tradingagents.graph.trading_graph import TradingAgentsGraph
    except Exception as exc:
        raise TradingAgentsUnavailable(
            "tradingagents is not installed in this environment"
        ) from exc

    config = dict(DEFAULT_CONFIG)
    if req.max_debate_rounds is not None:
        config["max_debate_rounds"] = req.max_debate_rounds

    graph = TradingAgentsGraph(
        selected_analysts=tuple(a.value for a in req.analysts),
        debug=False,
        config=config,
    )

    final_state, signal = graph.propagate(
        req.ticker, req.trade_date, asset_type=req.asset_type.value
    )

    rating, is_review = _coerce_rating(signal)
    state = final_state if isinstance(final_state, dict) else {}

    # Only the report-shaped keys. The raw state carries message history and
    # intermediate scratch that has no business in an API response.
    reports = {
        key: value
        for key, value in state.items()
        if key.endswith("_report") and isinstance(value, str)
    }

    return AnalysisResult(
        rating=rating,
        is_review=is_review,
        decision=state.get("final_trade_decision") or state.get("trader_investment_plan"),
        reports=reports,
    )
