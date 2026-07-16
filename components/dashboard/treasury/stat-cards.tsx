import { Wallet, ArrowUpRight, ArrowDownToLine, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATS, type StatIcon } from "./data";
import { Panel } from "./panel";

const ICONS: Record<StatIcon, LucideIcon> = {
  balance: Wallet,
  withdraw: ArrowUpRight,
  deposit: ArrowDownToLine,
  withdrawn: TrendingUp,
};

export function StatCards() {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {STATS.map((s) => {
        const Icon = ICONS[s.icon];
        return (
          <Panel key={s.label} className="p-5">
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-medium uppercase tracking-[1px] text-bq-muted">
                {s.label}
              </span>
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg bg-bq-surface",
                  s.accent ? "text-bq-mint" : "text-bq-muted",
                )}
              >
                <Icon className="size-4" />
              </span>
            </div>
            <p className="mt-4 text-[26px] font-bold leading-none text-white">{s.value}</p>
            <p className="mt-2 text-[12px] text-bq-dim">{s.note}</p>
          </Panel>
        );
      })}
    </div>
  );
}
