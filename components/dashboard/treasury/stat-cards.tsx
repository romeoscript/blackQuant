"use client";

import { Wallet, ArrowUpRight, ArrowDownToLine, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Panel } from "@/components/dashboard/panel";
import type { TreasurySummary } from "@/app/treasury-actions";

export function StatCards({ summary }: { summary?: TreasurySummary }) {
  const stats: {
    label: string;
    value: string;
    note: string;
    icon: LucideIcon;
    accent?: boolean;
  }[] = [
    {
      label: "Total Balance",
      value: `$${summary?.balanceUsd ?? "0.00"}`,
      note: "Available to spend",
      icon: Wallet,
    },
    {
      label: "Total Deposited",
      value: `$${summary?.totalDepositedUsd ?? "0.00"}`,
      note: "All time",
      icon: ArrowDownToLine,
    },
    {
      label: "Total Withdrawn",
      value: `$${summary?.totalWithdrawnUsd ?? "0.00"}`,
      // Named for why it is zero, rather than implying nobody has withdrawn.
      note: "Withdrawals aren't live yet",
      icon: ArrowUpRight,
    },
    {
      label: "Pending Deposits",
      value: String(summary?.pendingCount ?? 0),
      note: summary?.pendingCount
        ? "Awaiting confirmation"
        : "Nothing in flight",
      icon: Clock,
      accent: Boolean(summary?.pendingCount),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {stats.map((stat) => (
        <Panel key={stat.label} className="p-5">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-medium uppercase tracking-[1px] text-bq-muted">
              {stat.label}
            </span>
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-lg bg-bq-surface",
                stat.accent ? "text-bq-warn-text" : "text-bq-muted",
              )}
            >
              <stat.icon className="size-4" />
            </span>
          </div>
          <p className="mt-4 text-[26px] font-bold leading-none text-bq-heading tabular-nums">
            {stat.value}
          </p>
          <p className="mt-2 text-[12px] text-bq-dim">{stat.note}</p>
        </Panel>
      ))}
    </div>
  );
}
