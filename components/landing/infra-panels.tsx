"use client";

import { useEffect, useRef, useState } from "react";
import { Zap, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";
import { NEXUS_TRADES, ARBOR_POOLS, ARBOR_LOG, type TradeRow, type Pool } from "./data";

// --- simulation helpers -----------------------------------------------------

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const clamp = (min: number, max: number, v: number) => Math.min(max, Math.max(min, v));
const round1 = (n: number) => Math.round(n * 10) / 10;
const usd1 = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const usd0 = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });
const numOf = (s: string) => parseFloat(s.replace(/[^0-9.]/g, "")) || 0;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Run `tick` on an interval, but only after mount and never while the tab is
 *  hidden or the user prefers reduced motion. */
function useSimLoop(tick: () => void, ms: number) {
  const saved = useRef(tick);
  saved.current = tick;
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = setInterval(() => {
      if (!document.hidden) saved.current();
    }, ms);
    return () => clearInterval(id);
  }, [ms]);
}

// --- Nexus (MEV) simulation -------------------------------------------------

const PAIRS = ["ETH/USDC", "WBTC/ETH", "ARB/USDT", "SOL/USDC", "OP/USDT", "MATIC/USDC", "LINK/ETH", "AVAX/USDT"];
const ROUTES = [
  "3-hop · Uni→Sushi→Curve",
  "Cross-chain · Arb→ETH",
  "Statistical · GMX→Camel",
  "Liquidity shift detected",
  "Multi-hop · 4 exchanges",
  "2-hop · Uni→Balancer",
];
const TYPES = ["Type A", "Type B"] as const;

// Deterministic seed (no randomness) so server and client render identically.
const INITIAL_SERIES = Array.from({ length: 30 }, (_, i) => 12 + Math.sin(i / 2.5) * 5 + i * 0.25);

type LiveTrade = TradeRow & { id: string };

function makeTrade(id: number): LiveTrade {
  return {
    id: `t-${id}`,
    pair: pick(PAIRS),
    route: pick(ROUTES),
    type: pick(TYPES),
    latency: `${Math.round(rand(80, 340))}ms`,
    profit: `+$${rand(4, 30).toFixed(1)}`,
    active: true,
  };
}

function useNexusSim() {
  const [trades, setTrades] = useState<LiveTrade[]>(() =>
    NEXUS_TRADES.map((t, i) => ({ ...t, id: `t-init-${i}`, active: false })),
  );
  const [count, setCount] = useState(1842);
  const [latency, setLatency] = useState(4);
  const [winRate, setWinRate] = useState(96.2);
  const [profit, setProfit] = useState(2974.3);
  const [series, setSeries] = useState(INITIAL_SERIES);
  const [scan, setScan] = useState(14);
  const nextId = useRef(0);

  // Trade feed + stats: a new trade every ~2.2s.
  useSimLoop(() => {
    const trade = makeTrade(nextId.current++);
    setTrades((prev) => [trade, ...prev.map((t) => ({ ...t, active: false }))].slice(0, 5));
    setCount((c) => c + 1);
    setLatency(round1(rand(3, 6)));
    setWinRate((w) => round1(clamp(95.5, 97.5, w + rand(-0.25, 0.25))));
    setProfit((v) => round1(v + numOf(trade.profit)));
    setScan(Math.round(rand(12, 19)));
  }, 2200);

  // Profit curve: faster, independent up/down walk so the line visibly moves —
  // oldest point drops off the left as a new one enters the right.
  useSimLoop(() => {
    setSeries((s) => [...s.slice(1), clamp(4, 40, s[s.length - 1] + rand(-4, 5))]);
  }, 900);

  return { trades, count, latency, winRate, profit, series, scan };
}

// --- Arbor (yield) simulation -----------------------------------------------

type LogEntry = { id: string; time: string; text: string };
const CYCLE_SECONDS = 2 * 3600 + 14 * 60;

function driftPools(pools: Pool[]): Pool[] {
  const jittered = pools.map((p) => ({
    pool: p,
    alloc: clamp(20, 45, p.allocation + rand(-1.5, 1.5)),
  }));
  const total = jittered.reduce((sum, j) => sum + j.alloc, 0);
  return jittered.map(({ pool, alloc }) => ({
    ...pool,
    allocation: Math.round((alloc / total) * 100),
    apy: `${clamp(8, 25, numOf(pool.apy) + rand(-0.3, 0.3)).toFixed(1)}% APY`,
    profit: `+$${Math.round(numOf(pool.profit) + rand(0, 4))}`,
  }));
}

function useArborSim() {
  const [yield24h, setYield] = useState(1847);
  const [seconds, setSeconds] = useState(CYCLE_SECONDS);
  const [lastCycle, setLastCycle] = useState(1042);
  const [pools, setPools] = useState<Pool[]>(ARBOR_POOLS);
  const [log, setLog] = useState<LogEntry[]>(() =>
    ARBOR_LOG.map((l, i) => ({ ...l, id: `l-init-${i}` })),
  );
  const nextId = useRef(0);
  const tick = useRef(0);

  useSimLoop(() => {
    tick.current += 1;

    setSeconds((s) => {
      if (s > 1) return s - 1;
      // Compound cycle complete: bank the gain, log it, reset the timer.
      const gain = Math.round(rand(900, 1100));
      setYield((y) => y + gain);
      setLastCycle(gain);
      setLog((prev) =>
        [
          { id: `l-${nextId.current++}`, time: "just now", text: `Compound cycle complete · +$${gain.toLocaleString()}` },
          ...prev,
        ].slice(0, 3),
      );
      return CYCLE_SECONDS + Math.round(rand(-300, 300));
    });

    // Slower drifts: base-yield accrual + pool rebalancing every 5s.
    if (tick.current % 5 === 0) {
      setYield((y) => y + Math.round(rand(1, 6)));
      setPools(driftPools);
    }
  }, 1000);

  return { yield24h, seconds, lastCycle, pools, log };
}

function splitTime(total: number) {
  return {
    h: Math.floor(total / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
}

// --- presentational ---------------------------------------------------------

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full rounded-2xl border border-bq-border bg-bq-panel p-6 md:p-7">
      {children}
    </div>
  );
}

function PanelHead({
  icon,
  name,
  sub,
}: {
  icon: React.ReactNode;
  name: string;
  sub: string;
}) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl border border-bq-border bg-bq-card text-white">
          {icon}
        </span>
        <div>
          <p className="font-satoshi text-[15px] font-bold text-white">{name}</p>
          <p className="text-[12px] text-bq-muted">{sub}</p>
        </div>
      </div>
      <span className="flex items-center gap-1.5 rounded-full border border-bq-green/30 bg-bq-green/5 px-2.5 py-1">
        <span className="size-1.5 animate-pulse rounded-full bg-bq-green" />
        <span className="font-plex text-[10px] uppercase tracking-[1px] text-bq-green">
          Live
        </span>
      </span>
    </div>
  );
}

function StatRow({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="mt-6 grid grid-cols-3 border-y border-bq-border py-4">
      {items.map((s) => (
        <div key={s.label}>
          <p className="font-plex text-[10px] uppercase tracking-[1px] text-bq-muted">
            {s.label}
          </p>
          <p className="mt-1.5 font-satoshi text-2xl font-bold tabular-nums text-white">
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function Sparkline({ points }: { points: number[] }) {
  const w = 100;
  const h = 24;
  // Normalize to the live min/max so small movements fill the height and read
  // as motion; the window rescales each tick, adding to the "alive" feel.
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const line = points
    .map((p, i) => `${(i / (points.length - 1)) * w},${h - ((p - min) / range) * h}`)
    .join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="mt-3 h-12 w-full">
      <defs>
        <linearGradient id="bq-spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ade80" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#bq-spark)" />
      <polyline
        points={line}
        fill="none"
        stroke="#4ade80"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function TradeRowItem({ t }: { t: LiveTrade }) {
  return (
    <tr className={cn("text-[12px] text-bq-text", t.active && "bq-in bg-white/[0.03]")}>
      <td className="py-2.5 font-medium text-white">{t.pair}</td>
      <td className="py-2.5 text-bq-muted">{t.route}</td>
      <td className="py-2.5">
        <span className="rounded border border-bq-border px-1.5 py-0.5 font-plex text-[9px] text-bq-muted">
          {t.type}
        </span>
      </td>
      <td className="py-2.5 text-right font-plex tabular-nums text-bq-muted">{t.latency}</td>
      <td className="py-2.5 text-right font-medium tabular-nums text-bq-green">{t.profit}</td>
    </tr>
  );
}

function PoolRow({ pool }: { pool: Pool }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-white">{pool.name}</p>
        <div className="flex items-center gap-3 text-[13px] tabular-nums">
          <span className="text-bq-text">{pool.apy}</span>
          <span className="text-bq-muted">{pool.profit}</span>
        </div>
      </div>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-bq-border">
        <div
          className="h-full rounded-full bg-bq-text/50 transition-[width] duration-700 ease-out"
          style={{ width: `${pool.allocation}%` }}
        />
      </div>
      <p className="mt-1.5 font-plex text-[10px] tabular-nums text-bq-dim">
        {pool.allocation}% allocation
      </p>
    </div>
  );
}

// --- panels -----------------------------------------------------------------

export function NexusPanel() {
  const { trades, count, latency, winRate, profit, series, scan } = useNexusSim();

  return (
    <Panel>
      <PanelHead
        icon={<Zap className="size-4.5" />}
        name="Nexus Bot"
        sub="Dual Execution Engine · MEV Arbitrage"
      />
      <StatRow
        items={[
          { label: "Trades Today", value: usd0(count) },
          { label: "Avg Latency", value: `${latency}ms` },
          { label: "Win Rate", value: `${winRate.toFixed(1)}%` },
        ]}
      />

      <div className="mt-5 flex items-center justify-between">
        <p className="font-plex text-[10px] uppercase tracking-[1px] text-bq-muted">
          Live Trade Feed
        </p>
        <p className="font-plex text-[10px] tabular-nums text-bq-dim">
          scanning {scan} DEXs
        </p>
      </div>

      <table className="mt-3 w-full text-left">
        <thead>
          <tr className="font-plex text-[9px] uppercase tracking-[1px] text-bq-dim">
            <th className="pb-2 font-normal">Pair</th>
            <th className="pb-2 font-normal">Route</th>
            <th className="pb-2 font-normal">Type</th>
            <th className="pb-2 text-right font-normal">Latency</th>
            <th className="pb-2 text-right font-normal">Profit</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t) => (
            <TradeRowItem key={t.id} t={t} />
          ))}
        </tbody>
      </table>

      <div className="mt-6 border-t border-bq-border pt-4">
        <div className="flex items-center justify-between">
          <p className="font-plex text-[10px] uppercase tracking-[1px] text-bq-muted">
            Profit (24h)
          </p>
          <p className="font-satoshi text-lg font-bold tabular-nums text-bq-green">
            +${usd1(profit)}
          </p>
        </div>
        <Sparkline points={series} />
      </div>
    </Panel>
  );
}

export function ArborPanel() {
  const { yield24h, seconds, lastCycle, pools, log } = useArborSim();
  const { h, m, s } = splitTime(seconds);

  return (
    <Panel>
      <PanelHead
        icon={<Sprout className="size-4.5" />}
        name="Arbor Bot"
        sub="Yield Farming Engine · Passive Base Yield"
      />
      <StatRow
        items={[
          { label: "24h Yield", value: `$${usd0(yield24h)}` },
          { label: "Positions", value: `${pools.length * 4}` },
          { label: "Next Cycle", value: `${h}h ${m}m` },
        ]}
      />

      <div className="mt-5 flex items-center justify-between">
        <p className="font-plex text-[10px] uppercase tracking-[1px] text-bq-muted">
          Active Pools — Highest APY
        </p>
        <p className="font-plex text-[10px] tabular-nums text-bq-dim">
          auto-compound in {h}h {String(m).padStart(2, "0")}m {String(s).padStart(2, "0")}s
        </p>
      </div>

      <div className="mt-4 space-y-5">
        {pools.map((p) => (
          <PoolRow key={p.name} pool={p} />
        ))}
      </div>

      <div className="mt-6 border-t border-bq-border pt-4">
        <div className="flex items-center justify-between">
          <p className="font-plex text-[10px] uppercase tracking-[1px] text-bq-muted">
            Activity Log
          </p>
          <p className="font-satoshi text-lg font-bold tabular-nums text-white">
            +${usd0(lastCycle)}
          </p>
        </div>
        <ul className="mt-3 space-y-2.5">
          {log.map((l) => (
            <li key={l.id} className="flex items-center gap-3 text-[12px]">
              <span className="font-plex text-[10px] text-bq-dim">{l.time}</span>
              <span className="text-bq-muted">{l.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}
