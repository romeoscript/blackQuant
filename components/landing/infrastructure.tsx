import { Zap, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";
import {
  INFRA_TAGS,
  NEXUS_TRADES,
  ARBOR_POOLS,
  ARBOR_LOG,
  type TradeRow,
  type Pool,
} from "./data";

export function Infrastructure() {
  return (
    <section id="infrastructure" className="bg-bq-bg px-8 py-28 md:px-16">
      <div className="mx-auto max-w-[1312px]">
        <Reveal className="flex flex-col items-center text-center">
          <span className="flex items-center gap-2 rounded-full border border-bq-green/30 bg-bq-green/5 px-3.5 py-1.5">
            <span className="size-1.5 rounded-full bg-bq-green" />
            <span className="font-plex text-[11px] uppercase tracking-[2px] text-bq-green">
              Infrastructure
            </span>
          </span>
          <h2 className="mt-7 max-w-4xl font-satoshi text-4xl font-bold tracking-tight text-white md:text-[52px]">
            A Distributed Financial Execution Network.
          </h2>
          <p className="mt-6 max-w-2xl font-satoshi text-[15px] leading-relaxed text-bq-muted">
            Human-centric blockchain bound. Decentralized execution
            infrastructure with integrated optional liquidity optimization, both
            engines running simultaneously in real time.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {INFRA_TAGS.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-bq-border px-4 py-2 text-[13px] text-bq-text/70"
              >
                {tag}
              </span>
            ))}
          </div>
        </Reveal>

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <NexusPanel />
          </Reveal>
          <Reveal delay={100}>
            <ArborPanel />
          </Reveal>
        </div>

        <Reveal className="mt-6">
          <div className="grid gap-y-4 rounded-2xl border border-bq-border bg-bq-panel px-8 py-6 text-[13px] md:grid-cols-3 md:divide-x md:divide-bq-border">
            <p className="text-bq-muted md:pr-6">
              <span className="font-semibold text-white">Nexus Bot</span> —
              generates active trading profits via HFT-style MEV
            </p>
            <p className="text-bq-muted md:px-6">
              <span className="font-semibold text-white">Arbor Bot</span> —
              generates passive base yield via liquidity optimization
            </p>
            <p className="text-bq-muted md:pl-6">
              Both running simultaneously in real time.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

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
        <span className="size-1.5 rounded-full bg-bq-green" />
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
          <p className="mt-1.5 font-satoshi text-2xl font-bold text-white">
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function NexusPanel() {
  return (
    <Panel>
      <PanelHead
        icon={<Zap className="size-4.5" />}
        name="Nexus Bot"
        sub="Dual Execution Engine · MEV Arbitrage"
      />
      <StatRow
        items={[
          { label: "Trades Today", value: "1,842" },
          { label: "Avg Latency", value: "4ms" },
          { label: "Win Rate", value: "96.2%" },
        ]}
      />

      <div className="mt-5 flex items-center justify-between">
        <p className="font-plex text-[10px] uppercase tracking-[1px] text-bq-muted">
          Live Trade Feed
        </p>
        <p className="font-plex text-[10px] text-bq-dim">scanning 14 DEXs</p>
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
          {NEXUS_TRADES.map((t) => (
            <TradeRowItem key={t.pair} t={t} />
          ))}
        </tbody>
      </table>

      <div className="mt-6 border-t border-bq-border pt-4">
        <div className="flex items-center justify-between">
          <p className="font-plex text-[10px] uppercase tracking-[1px] text-bq-muted">
            Profit (24h)
          </p>
          <p className="font-satoshi text-lg font-bold text-white">+$2,974.3</p>
        </div>
        <Sparkline />
      </div>
    </Panel>
  );
}

function TradeRowItem({ t }: { t: TradeRow }) {
  return (
    <tr
      className={cn(
        "text-[12px] text-bq-text",
        t.active && "rounded-lg bg-white/[0.03]",
      )}
    >
      <td className="py-2.5 font-medium text-white">{t.pair}</td>
      <td className="py-2.5 text-bq-muted">{t.route}</td>
      <td className="py-2.5">
        <span className="rounded border border-bq-border px-1.5 py-0.5 font-plex text-[9px] text-bq-muted">
          {t.type}
        </span>
      </td>
      <td className="py-2.5 text-right font-plex text-bq-muted">{t.latency}</td>
      <td className="py-2.5 text-right font-medium text-bq-green">{t.profit}</td>
    </tr>
  );
}

function Sparkline() {
  // Upward-trending 24h profit curve.
  const pts = [2, 8, 5, 11, 9, 15, 12, 20, 17, 24, 22, 30];
  const w = 100;
  const h = 22;
  const max = Math.max(...pts);
  const path = pts
    .map((p, i) => `${(i / (pts.length - 1)) * w},${h - (p / max) * h}`)
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="mt-3 h-10 w-full"
    >
      <polyline
        points={path}
        fill="none"
        stroke="#9a9a9a"
        strokeWidth="0.7"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function ArborPanel() {
  return (
    <Panel>
      <PanelHead
        icon={<Sprout className="size-4.5" />}
        name="Arbor Bot"
        sub="Yield Farming Engine · Passive Base Yield"
      />
      <StatRow
        items={[
          { label: "24h Yield", value: "$1,847" },
          { label: "Positions", value: "12" },
          { label: "Next Cycle", value: "2h 14m" },
        ]}
      />

      <div className="mt-5 flex items-center justify-between">
        <p className="font-plex text-[10px] uppercase tracking-[1px] text-bq-muted">
          Active Pools — Highest APY
        </p>
        <p className="font-plex text-[10px] text-bq-dim">auto-compound in 2h 14m</p>
      </div>

      <div className="mt-4 space-y-5">
        {ARBOR_POOLS.map((p) => (
          <PoolRow key={p.name} pool={p} />
        ))}
      </div>

      <div className="mt-6 border-t border-bq-border pt-4">
        <div className="flex items-center justify-between">
          <p className="font-plex text-[10px] uppercase tracking-[1px] text-bq-muted">
            Activity Log
          </p>
          <p className="font-satoshi text-lg font-bold text-white">+$1,042</p>
        </div>
        <ul className="mt-3 space-y-2.5">
          {ARBOR_LOG.map((l) => (
            <li key={l.text} className="flex items-center gap-3 text-[12px]">
              <span className="font-plex text-[10px] text-bq-dim">{l.time}</span>
              <span className="text-bq-muted">{l.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}

function PoolRow({ pool }: { pool: Pool }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-white">{pool.name}</p>
        <div className="flex items-center gap-3 text-[13px]">
          <span className="text-bq-text">{pool.apy}</span>
          <span className="text-bq-muted">{pool.profit}</span>
        </div>
      </div>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-bq-border">
        <div
          className="h-full rounded-full bg-bq-text/50"
          style={{ width: `${pool.allocation}%` }}
        />
      </div>
      <p className="mt-1.5 font-plex text-[10px] text-bq-dim">
        {pool.allocation}% allocation
      </p>
    </div>
  );
}
