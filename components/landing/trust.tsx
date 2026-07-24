import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";
import { NetworkFlowLazy } from "./network-flow-lazy";
import { LiveMetrics } from "./live-metrics";
import { TRUST_METRICS, TRUST_CARDS, AUDITS } from "./data";

const LEGEND = [
  { label: "Verified execution node", color: "bg-bq-green" },
  { label: "Liquidity venue", color: "bg-white/70" },
  { label: "Blocked MEV bot", color: "bg-red-500" },
  { label: "Live · scanning", color: "bg-bq-green" },
];

const TICKER = [
  "Capital deployed: Wallet → Bot",
  "MEV executed: +$24.3",
  "Block confirmed · profit routed",
  "Yield rebalanced",
  "Profit returned: Bot → Wallet → You",
  "Zero custodial events",
  "ARB/USDC +$8.1",
];

export function Trust() {
  return (
    <section id="security" className="bg-bq-bg px-8 pt-28 md:px-16">
      <div className="mx-auto max-w-[1312px]">
        <Reveal className="grid gap-8 md:grid-cols-2 md:items-start">
          <div>
            <span className="flex w-fit items-center gap-2 rounded-full border border-bq-green/30 bg-bq-green/5 px-3.5 py-1.5">
              <span className="size-1.5 rounded-full bg-bq-green" />
              <span className="font-plex text-[11px] uppercase tracking-[2px] text-bq-green">
                Security &amp; Trust
              </span>
            </span>
            <h2 className="mt-6 font-satoshi text-5xl font-bold tracking-tight md:text-[64px]">
              <span className="text-white">Trust is</span>
              <br />
              <span className="text-bq-muted">Infrastructure.</span>
            </h2>
          </div>
          <div className="md:pt-2">
            <p className="max-w-md font-satoshi text-[15px] leading-relaxed text-bq-muted">
              Every decision at BlackQuant starts with one question: can the user
              verify it? Open, auditable, and fully in your hands. Tools once
              reserved for the elite — now yours.
            </p>
            <div className="mt-8 grid grid-cols-2 rounded-xl border border-bq-border sm:grid-cols-4">
              {TRUST_METRICS.map((m, i) => (
                <div
                  key={m.label}
                  className={cn(
                    "px-5 py-4",
                    i !== 0 && "border-l border-bq-border",
                    i === 2 && "border-l-0 sm:border-l",
                  )}
                >
                  <p className="font-satoshi text-xl font-bold text-white">{m.value}</p>
                  <p className="mt-1 font-plex text-[9px] uppercase tracking-[1px] text-bq-muted">
                    {m.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* network panel */}
        <Reveal className="mt-10">
          <div className="overflow-hidden rounded-2xl border border-bq-border bg-bq-panel">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-bq-border-soft px-6 py-4">
              <span className="flex items-center gap-2 font-plex text-[11px] uppercase tracking-[1.5px] text-bq-muted">
                <span className="size-1.5 rounded-full bg-bq-green" />
                Infrastructure Network
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[12px] text-bq-text">
                  BlackQuant never intercepts your capital.
                </span>
                <span className="flex items-center gap-1 rounded-full border border-bq-border px-2 py-1 font-plex text-[9px] uppercase tracking-[1px]">
                  <span className="text-bq-dim">mainnet</span>
                  <span className="flex items-center gap-1 rounded-full bg-bq-green/10 px-1.5 py-0.5 text-bq-green">
                    <span className="size-1 rounded-full bg-bq-green" /> live
                  </span>
                </span>
              </div>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-[1fr_260px]">
              <div className="flex flex-col">
                <NetworkFlowLazy />
                <p className="mt-3 font-plex text-[11px] uppercase tracking-[1.5px] text-bq-text">
                  Execution Only · No Custody
                </p>
              </div>

              <div className="flex flex-col gap-6">
                <div>
                  <p className="font-plex text-[10px] uppercase tracking-[1.5px] text-bq-muted">
                    Node Legend
                  </p>
                  <ul className="mt-3 space-y-2.5">
                    {LEGEND.map((l) => (
                      <li key={l.label} className="flex items-center gap-2.5 text-[12px] text-bq-text">
                        <span className={cn("size-1.5 rounded-full", l.color)} />
                        {l.label}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-bq-border-soft pt-5">
                  <p className="flex items-center gap-2 font-plex text-[10px] uppercase tracking-[1.5px] text-bq-muted">
                    <span className="bq-live-dot size-1.5 rounded-full bg-bq-green" />
                    Live Metrics
                  </p>
                  <LiveMetrics />
                </div>

                <div className="flex gap-2.5 rounded-xl border border-bq-border bg-bq-card p-4">
                  <Lock className="mt-0.5 size-3.5 shrink-0 text-bq-green" />
                  <p className="text-[12px] leading-relaxed text-bq-muted">
                    Bot has execution permission only. Your wallet remains fully
                    under your control at all times.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden border-t border-bq-border-soft py-3 [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
              <div className="bq-marquee-track flex w-max gap-10 pl-10 font-plex text-[10px] text-bq-dim">
                {[...TICKER, ...TICKER].map((t, i) => (
                  <span key={i} className="flex items-center gap-2.5 whitespace-nowrap">
                    <span className="size-[3px] rounded-full bg-bq-dim" />
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        {/* trust cards */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {TRUST_CARDS.map((c, i) => (
            <Reveal key={c.index} delay={i * 60}>
              <div className="flex h-full gap-5 rounded-2xl border border-bq-border bg-bq-panel p-7">
                <div className="flex shrink-0 flex-col items-center gap-2">
                  <span className="font-plex text-[9px] text-bq-dim">{c.index}</span>
                  <span className="flex size-10 items-center justify-center rounded-xl border border-bq-border bg-bq-card text-bq-green">
                    <c.icon className="size-4.5" />
                  </span>
                </div>
                <div>
                  <h3 className="font-satoshi text-[15px] font-bold text-white">{c.title}</h3>
                  <p className="mt-2 text-[12px] leading-relaxed text-bq-muted">{c.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* audit row */}
        <Reveal className="mt-6">
          <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-bq-border bg-bq-panel sm:grid-cols-4">
            {AUDITS.map((a, i) => (
              <div
                key={a.firm}
                className={cn(
                  "px-6 py-[18px]",
                  i !== 0 && "border-l border-bq-border",
                  i === 2 && "border-l-0 sm:border-l",
                  i >= 2 && "border-t border-bq-border sm:border-t-0",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-satoshi text-[13px] font-bold text-bq-dim">{a.firm}</span>
                  <span className="rounded-full border border-bq-border px-2 py-0.5 font-satoshi text-[9px] text-bq-muted">
                    Audited
                  </span>
                </div>
                <div className="mt-2.5 h-0.5 w-full rounded-full bg-bq-border-soft">
                  <div
                    className="h-0.5 rounded-full bg-white/20"
                    style={{ width: `${parseInt(a.score, 10)}%` }}
                  />
                </div>
                <p className="mt-2 font-satoshi text-[8px] text-bq-dim">Score: {a.score}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
