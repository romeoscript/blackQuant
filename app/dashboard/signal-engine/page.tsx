"use client";

import { useState } from "react";
import { Zap, Globe, ShieldCheck, SlidersHorizontal, Sparkles } from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { Card, StatCard, StatPill, Toggle, HeaderActions } from "@/components/dashboard/widgets";
import { BarChart } from "@/components/dashboard/charts";
import { cn } from "@/lib/utils";

const SIGNAL_BARS = Array.from({ length: 22 }, (_, i) => {
  const hour = i + 1;
  const label = i % 3 === 0 ? String(hour).padStart(2, "0") : "";
  if (hour === 22) return { label, value: 100, color: "var(--primary)" };
  if (hour >= 20) return { label, value: 46, color: "#ffffff" };
  return { label, value: 8 + ((i * 7) % 26), color: "rgba(255,255,255,0.08)" };
});

const STRATEGIES = [
  { name: "Momentum", stat: "142 signals · 72% win rate", on: true },
  { name: "RSI Divergence", stat: "98 signals · 62% win rate", on: true },
  { name: "Breakout", stat: "61 signals · 65% win rate", on: true },
  { name: "MACD Cross", stat: "45 signals · 58% win rate", on: false },
];

type Side = "BUY" | "SELL";
const FEED: { time: string; pair: string; signal: Side; conf: number; entry: string; tp: string; sl: string; strat: string }[] = [
  { time: "11:58:32", pair: "BTC/USDT", signal: "BUY", conf: 94, entry: "$64,850", tp: "$66,400", sl: "$63,900", strat: "Momentum" },
  { time: "11:57:10", pair: "ETH/USDT", signal: "SELL", conf: 81, entry: "$3,042", tp: "$2,980", sl: "$3,080", strat: "RSI Divergence" },
  { time: "11:55:44", pair: "AVAX/USDT", signal: "BUY", conf: 76, entry: "$41.20", tp: "$43.80", sl: "$39.90", strat: "Breakout" },
  { time: "11:53:18", pair: "SOL/USDT", signal: "BUY", conf: 88, entry: "$143.10", tp: "$149.00", sl: "$140.50", strat: "Momentum" },
  { time: "11:51:02", pair: "BNB/USDT", signal: "SELL", conf: 69, entry: "$418.00", tp: "$408.00", sl: "$424.00", strat: "MACD Cross" },
  { time: "11:48:56", pair: "ADA/USDT", signal: "BUY", conf: 73, entry: "$0.60", tp: "$0.64", sl: "$0.58", strat: "Support Bounce" },
];

const FILTERS = ["All", "BUY", "SELL"] as const;

export default function SignalEnginePage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const rows = FEED.filter((f) => (filter === "All" ? true : f.signal === filter));

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Signal Engine" actions={<HeaderActions />} />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-bq-mint/25 bg-bq-mint/[0.06] px-4 py-3">
        <p className="flex items-center gap-2.5 text-[13px] text-bq-text">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-2 animate-ping rounded-full bg-bq-mint opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-bq-mint" />
          </span>
          Signal Engine is live and actively scanning 47 markets across 4 strategies.
        </p>
        <span className="flex items-center gap-1.5 text-[12px] font-semibold text-bq-mint">
          <Sparkles className="size-3.5" /> All systems operational
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Signals Today" value="38" sub="+12 from yesterday" icon={Zap} />
        <StatCard label="Markets Scanned" value="47" sub="Across 4 strategies" icon={Globe} />
        <StatCard label="Avg Confidence" value="80.2%" sub="Above 70% threshold" icon={ShieldCheck} green />
        <StatCard label="Active Strategies" value="3 / 4" sub="1 paused" icon={SlidersHorizontal} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white">Signal Volume</h2>
              <p className="text-[12px] text-bq-dim">Signals generated per hour today</p>
            </div>
            <StatPill tone="green">Live</StatPill>
          </div>
          <div className="mt-5">
            <BarChart bars={SIGNAL_BARS} height={160} />
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-bq-border-soft pt-3 text-[11px] text-bq-dim">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary" /> Current hour
            </span>
            <span>Total today: 346 signals</span>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-white">Strategy Engine</h2>
          <p className="text-[12px] text-bq-dim">Toggle and monitor active strategies.</p>
          <div className="mt-4 space-y-2">
            {STRATEGIES.map((s) => (
              <div
                key={s.name}
                className="flex items-center gap-3 rounded-lg border border-bq-border bg-bq-bg px-3 py-2.5"
              >
                <span className={cn("size-1.5 shrink-0 rounded-full", s.on ? "bg-primary" : "bg-bq-dim")} />
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-white">{s.name}</p>
                  <p className="text-[11px] text-bq-dim">{s.stat}</p>
                </div>
                <Toggle defaultOn={s.on} />
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-bq-border-soft pt-3 text-[12px]">
            <span className="text-bq-muted">Engine uptime</span>
            <span className="font-bold text-white">99.8%</span>
          </div>
        </Card>
      </div>

      <Card className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-3">
          <div>
            <h2 className="font-semibold text-white">Live Signal Feed</h2>
            <p className="text-[12px] text-bq-dim">Most recent signals fired by the engine</p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-bq-border bg-bq-bg p-1">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors",
                  filter === f ? "bg-bq-surface text-white" : "text-bq-muted hover:text-bq-text",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[13px]">
            <thead>
              <tr className="border-y border-bq-border-soft font-plex text-[10px] uppercase tracking-[1px] text-bq-dim">
                <th className="px-5 py-2.5 font-medium">Time</th>
                <th className="px-5 py-2.5 font-medium">Pair</th>
                <th className="px-5 py-2.5 font-medium">Signal</th>
                <th className="px-5 py-2.5 font-medium">Confidence</th>
                <th className="px-5 py-2.5 font-medium">Entry</th>
                <th className="px-5 py-2.5 font-medium">Take Profit</th>
                <th className="px-5 py-2.5 font-medium">Stop Loss</th>
                <th className="px-5 py-2.5 font-medium">Strategy</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-bq-border-soft last:border-0">
                  <td className="px-5 py-3.5 font-plex text-bq-muted">{r.time}</td>
                  <td className="px-5 py-3.5 font-medium text-white">{r.pair}</td>
                  <td className="px-5 py-3.5">
                    <span className={cn("font-bold", r.signal === "BUY" ? "text-primary" : "text-[#ff6a83]")}>
                      {r.signal}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-bq-border">
                        <span className="block h-full rounded-full bg-primary" style={{ width: `${r.conf}%` }} />
                      </span>
                      <span className="tabular-nums text-bq-text">{r.conf}%</span>
                    </span>
                  </td>
                  <td className="px-5 py-3.5 tabular-nums text-white">{r.entry}</td>
                  <td className="px-5 py-3.5 tabular-nums text-primary">{r.tp}</td>
                  <td className="px-5 py-3.5 tabular-nums text-[#ff6a83]">{r.sl}</td>
                  <td className="px-5 py-3.5">
                    <StatPill tone="neutral">{r.strat}</StatPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
