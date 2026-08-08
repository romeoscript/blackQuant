"use client";

import { cn } from "@/lib/utils";
import { Panel } from "@/components/dashboard/panel";
import { AreaLineChart } from "@/components/dashboard/charts";
import {
  BALANCE_RANGES,
  type BalancePoint,
  type BalanceRange,
} from "@/lib/treasury";

export function BalanceHistoryCard({
  history,
  range,
  onRangeChange,
}: {
  history: BalancePoint[];
  range: BalanceRange;
  onRangeChange: (range: BalanceRange) => void;
}) {
  // Every point equal means a flat line pinned to the top of the chart, which
  // reads as data. An account that has never moved should say so.
  const hasMovement = new Set(history.map((p) => p.balanceUsd)).size > 1;

  return (
    <Panel className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-bq-heading">
            Balance history
          </h2>
          <p className="text-[12px] text-bq-dim">
            Your balance at the close of each period
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-bq-border bg-bq-bg p-1">
          {BALANCE_RANGES.map((option) => (
            <button
              key={option.id}
              onClick={() => onRangeChange(option.id)}
              className={cn(
                "rounded-md px-3 py-1 text-[12px] font-medium transition-colors",
                range === option.id
                  ? "bg-bq-surface text-bq-heading"
                  : "text-bq-muted hover:text-bq-text",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        {hasMovement ? (
          <AreaLineChart
            data={history.map((point) => ({
              label: point.label,
              value: point.balanceUsd,
            }))}
          />
        ) : (
          <p className="flex h-40 items-center justify-center text-[13px] text-bq-muted">
            No balance changes in this period.
          </p>
        )}
      </div>
    </Panel>
  );
}
