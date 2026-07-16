"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { BALANCE_HISTORY } from "./data";
import { Panel } from "./panel";
import { AreaLineChart } from "./charts";

const RANGES = { "12M": 12, "6M": 6, "1M": 3 } as const;
type Range = keyof typeof RANGES;

export function BalanceHistoryCard() {
  const [range, setRange] = useState<Range>("12M");
  const data = BALANCE_HISTORY.slice(-RANGES[range]);

  return (
    <Panel className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-white">Balance History</h2>
          <p className="text-[12px] text-bq-dim">Total portfolio value over the last 12 months</p>
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
        <AreaLineChart data={data} />
      </div>
    </Panel>
  );
}
