"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Panel } from "@/components/dashboard/panel";
import { AreaLineChart } from "@/components/dashboard/charts";
import { EQUITY, EQUITY_SUMMARY } from "./data";

const RANGES = { "1W": 4, "1M": 7, All: 10 } as const;
type Range = keyof typeof RANGES;

export function EquityCurve() {
  const [range, setRange] = useState<Range>("All");
  const data = EQUITY.slice(-RANGES[range]);

  return (
    <Panel className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-white">Equity Curve</h2>
          <p className="text-[12px] text-bq-dim">Portfolio value over time</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-bq-border bg-bq-bg p-1">
          {(Object.keys(RANGES) as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "rounded-md px-3 py-1 text-[12px] font-medium transition-colors",
                range === r ? "bg-bq-surface text-white" : "text-bq-muted hover:text-bq-text",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <AreaLineChart data={data} color="#00e5aa" showLabels={false} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-bq-border-soft pt-4">
        <Metric label="Starting capital" value={EQUITY_SUMMARY.starting} />
        <Metric label="Current value" value={EQUITY_SUMMARY.current} valueClass="text-bq-mint" />
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-bq-dim">Change</span>
          <span className="flex items-center gap-1 text-[13px] font-semibold text-bq-mint tabular-nums">
            <ArrowUpRight className="size-3.5" /> {EQUITY_SUMMARY.change} ({EQUITY_SUMMARY.changePct})
          </span>
        </div>
      </div>
    </Panel>
  );
}

function Metric({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-bq-dim">{label}</span>
      <span className={cn("text-[13px] font-semibold text-white tabular-nums", valueClass)}>{value}</span>
    </div>
  );
}
