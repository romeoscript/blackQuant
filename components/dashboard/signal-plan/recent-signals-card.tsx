"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Panel } from "@/components/dashboard/panel";
import { RECENT_SIGNALS, type SignalStatus } from "./data";
import { SignalDetailDialog } from "./signal-detail-dialog";

function StatusBadge({ status }: { status: SignalStatus }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-medium",
        status === "Active" && "bg-bq-mint/10 text-bq-mint",
        status === "Closed" && "bg-bq-surface text-bq-dim",
        status === "Pending" && "bg-amber-500/10 text-amber-400",
      )}
    >
      {status}
    </span>
  );
}

export function RecentSignalsCard() {
  const [open, setOpen] = useState(false);

  return (
    <Panel className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-white">Recent Signals</h2>
          <p className="text-[12px] text-bq-dim">Latest automated trade signals</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-bq-mint/12 px-2.5 py-1 text-[11px] font-medium text-bq-mint">
          <span className="size-1.5 rounded-full bg-bq-mint" /> Engine Live
        </span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] text-[13px]">
          <thead>
            <tr className="text-[10px] uppercase tracking-[1px] text-bq-dim">
              <th className="py-2 text-left font-medium">Type</th>
              <th className="py-2 text-left font-medium">Pair</th>
              <th className="py-2 text-left font-medium">Entry</th>
              <th className="py-2 text-left font-medium">TP / SL</th>
              <th className="py-2 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {RECENT_SIGNALS.map((s, i) => (
              <tr
                key={i}
                onClick={() => setOpen(true)}
                className="cursor-pointer border-t border-bq-border-soft transition-colors hover:bg-bq-surface/30"
              >
                <td className="py-3 font-semibold text-[#ff6a83]">{s.type}</td>
                <td className="py-3 font-medium text-white">{s.pair}</td>
                <td className="py-3 text-bq-text tabular-nums">{s.entry}</td>
                <td className="py-3 text-bq-muted tabular-nums">{s.tpsl}</td>
                <td className="py-3"><StatusBadge status={s.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SignalDetailDialog open={open} onOpenChange={setOpen} />
    </Panel>
  );
}
