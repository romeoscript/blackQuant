# TradingAgents HTTP service

An HTTP API over [TradingAgents](https://github.com/TauricResearch/TradingAgents),
the multi-agent LLM trading framework by **Tauric Research**, used under
Apache-2.0. Upstream paper: [arXiv:2412.20138](https://arxiv.org/abs/2412.20138).

This service is the HTTP surface only. It contains no strategy of its own, and
it places no orders.

## Why it exists

TradingAgents ships as a Python library and a CLI — you import
`TradingAgentsGraph` and call `.propagate(ticker, date)`. That is fine from a
notebook and unusable from anything that is not Python. This wraps it in a
documented HTTP API so the rest of the platform can reach it, and so the
reference can be generated from the code rather than written by hand.

## Why analyses are asynchronous

A single call to `propagate` runs a full multi-agent debate — several analyst
agents, researcher rounds, a trader and a risk pass, each a sequence of LLM
calls. It takes **minutes**.

A synchronous endpoint would sit behind every proxy's read timeout and fail for
reasons unrelated to the analysis. So `POST /v1/analyses` returns `202` with a
job reference, and the result is collected by polling.

## Run it

```bash
python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt

export TA_SERVICE_API_KEY=$(openssl rand -hex 24)
export OPENAI_API_KEY=...            # or the provider you configure below

.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8900
```

Then:

```bash
curl -s localhost:8900/health | jq
```

## Configuration

The wrapper's own settings, all prefixed `TA_SERVICE_`:

| Variable | Default | Notes |
| --- | --- | --- |
| `TA_SERVICE_API_KEY` | unset | Required in `X-API-Key`. Unset disables auth |
| `TA_SERVICE_MAX_CONCURRENT_ANALYSES` | `2` | A spend control as much as a resource one |
| `TA_SERVICE_JOB_RETENTION_HOURS` | `24` | How long finished jobs stay readable |
| `TA_SERVICE_REQUEST_TIMEOUT_SECONDS` | `1800` | Ceiling on one analysis |

> **Leaving `TA_SERVICE_API_KEY` unset is only safe on a loopback bind.** Every
> analysis spends real LLM tokens, so an open instance is a billing hole as much
> as a data one.

The graph's own configuration is read by TradingAgents directly from its
`TRADINGAGENTS_*` variables (`TRADINGAGENTS_LLM_PROVIDER`,
`TRADINGAGENTS_DEEP_THINK_LLM`, `TRADINGAGENTS_MAX_DEBATE_ROUNDS`, …). They are
deliberately **not** mirrored into this service's settings — one copy of a
setting cannot disagree with itself. Read what is actually in force with
`GET /v1/config`.

## Endpoints

| Method | Path | |
| --- | --- | --- |
| `GET` | `/health` | Unauthenticated liveness + dependency check |
| `GET` | `/v1/config` | Effective graph config, credentials removed |
| `POST` | `/v1/analyses` | Start an analysis → `202` + job reference |
| `GET` | `/v1/analyses` | List, newest first |
| `GET` | `/v1/analyses/{id}` | Poll one |
| `DELETE` | `/v1/analyses/{id}` | Stop waiting, free the slot |

## Ratings

A completed analysis carries `Buy`, `Overweight`, `Hold`, `Underweight`, `Sell`
— or `REVIEW`.

**`REVIEW` is not a weak Hold.** It means the run produced no parseable rating,
so there is no opinion to act on. Check `is_review` before reading `rating`. An
unrecognised value from upstream also collapses to `REVIEW`, for the same
reason: inventing a rating from an unparseable answer is worse than reporting
there wasn't one.

## Regenerating the API reference

```bash
.venv/bin/python export_openapi.py ../../../docs/api/openapi.json
```

The published reference is generated from the running app, so it cannot drift
from the code that serves it. Re-run it after any route or model change.

## Known constraints

- **Jobs are in memory.** They do not survive a restart and are not shared
  between replicas. `app/jobs.py` is the only module that knows how jobs are
  stored; swapping it for Redis or Postgres is the intended upgrade path.
- **Cancel is cooperative.** A graph already mid-debate cannot be interrupted.
  `DELETE` marks the job cancelled and frees the concurrency slot; work already
  in flight finishes in the background.
- **The service starts without TradingAgents installed.** It reports
  `not_configured` on `/health` and `503` on analysis creation, rather than
  failing to boot — a wrapper you cannot start is a wrapper you cannot ask
  whether it is configured.

## Licence

This wrapper follows the licence of the repository that contains it.
TradingAgents is © Tauric Research, Apache-2.0, and is used unmodified as a
dependency.
