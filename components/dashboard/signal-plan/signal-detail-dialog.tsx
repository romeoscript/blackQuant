"use client";

import { Activity, ExternalLink, Settings, Zap, ShieldCheck, BarChart3, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AreaLineChart } from "@/components/dashboard/charts";
import { SIGNAL_DETAIL } from "./data";

const STAT_ICONS: LucideIcon[] = [Zap, ShieldCheck, BarChart3, Clock];

export function SignalDetailDialog({
  trigger,
  open,
  onOpenChange,
}: {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}) {
  const d = SIGNAL_DETAIL;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[92vh] gap-5 overflow-y-auto rounded-2xl border-bq-border bg-bq-card p-6 font-satoshi text-white sm:max-w-[680px]">
        <DialogHeader className="flex-row items-start gap-3 space-y-0">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bq-surface text-bq-mint">
            <Activity className="size-4" />
          </span>
          <div className="flex-1">
            <DialogTitle className="flex items-center gap-2 text-[16px] font-bold text-white">
              {d.name}
              <span className="flex items-center gap-1 rounded-full bg-bq-mint/12 px-2 py-0.5 text-[10px] font-medium text-bq-mint">
                <span className="size-1.5 rounded-full bg-bq-mint" /> Active
              </span>
            </DialogTitle>
            <p className="mt-0.5 text-[12px] text-bq-dim">{d.desc}</p>
          </div>
          <button
            onClick={() => toast("Full View", { description: "Strategy full view coming soon." })}
            className="mr-6 flex shrink-0 items-center gap-1.5 rounded-lg border border-bq-border px-3 py-1.5 text-[12px] text-white transition-colors hover:bg-bq-surface"
          >
            <ExternalLink className="size-3.5" /> Full View
          </button>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {d.stats.map((s, i) => {
            const Icon = STAT_ICONS[i];
            return (
              <div key={s.label} className="rounded-xl border border-bq-border bg-bq-surface/40 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.5px] text-bq-dim">{s.label}</span>
                  <Icon className="size-3.5 text-bq-muted" />
                </div>
                <p className={cn("mt-2 text-[22px] font-bold", s.accent ? "text-bq-mint" : "text-white")}>
                  {s.value}
                </p>
              </div>
            );
          })}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-bq-border bg-bq-surface/40 p-4">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold text-white">Win Rate Trend</p>
              <span className="text-[12px] font-medium text-bq-mint">85% current</span>
            </div>
            <div className="mt-3">
              <AreaLineChart data={d.trend} color="#00e5aa" height={90} showLabels={false} />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-bq-dim">Baseline 72%</span>
              <span className="text-bq-mint">+13pp vs baseline</span>
            </div>
          </div>

          <div className="rounded-xl border border-bq-border bg-bq-surface/40 p-4">
            <p className="text-[13px] font-semibold text-white">By Pair</p>
            <div className="mt-3 space-y-2.5">
              {d.byPair.map((p) => (
                <div key={p.pair} className="flex items-center gap-2.5 text-[12px]">
                  <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="w-20 shrink-0 text-bq-text">{p.pair}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bq-border">
                    <div className="h-full rounded-full" style={{ width: `${p.pct}%`, backgroundColor: p.color }} />
                  </div>
                  <span className="w-8 shrink-0 text-right font-medium text-white tabular-nums">{p.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[13px] font-semibold text-white">Recent Signals</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-[12px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-[1px] text-bq-dim">
                  <th className="py-2 text-left font-medium">Time</th>
                  <th className="py-2 text-left font-medium">Pair</th>
                  <th className="py-2 text-left font-medium">Dir</th>
                  <th className="py-2 text-left font-medium">Entry</th>
                  <th className="py-2 text-left font-medium">TP</th>
                  <th className="py-2 text-left font-medium">SL</th>
                  <th className="py-2 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {d.recent.map((s, i) => (
                  <tr key={i} className="border-t border-bq-border-soft">
                    <td className="py-2.5 text-bq-muted tabular-nums">{s.time}</td>
                    <td className="py-2.5 font-medium text-white">{s.pair}</td>
                    <td className={cn("py-2.5 font-semibold", s.dir === "BUY" ? "text-bq-mint" : "text-red-400")}>
                      {s.dir}
                    </td>
                    <td className="py-2.5 text-white tabular-nums">{s.entry}</td>
                    <td className="py-2.5 text-bq-mint tabular-nums">{s.tp}</td>
                    <td className="py-2.5 text-red-400 tabular-nums">{s.sl}</td>
                    <td className="py-2.5 text-right">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium",
                          s.status === "Active" && "bg-bq-mint/10 text-bq-mint",
                          s.status === "TP Hit" && "bg-bq-surface text-bq-muted",
                          s.status === "SL Hit" && "bg-red-500/10 text-red-400",
                        )}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <DialogClose asChild>
            <Button
              variant="outline"
              className="h-auto flex-1 rounded-xl border-bq-border bg-transparent py-2.5 text-[13px] font-semibold text-white hover:bg-bq-surface dark:border-bq-border dark:bg-transparent dark:hover:bg-bq-surface"
            >
              Close
            </Button>
          </DialogClose>
          <Button
            variant="outline"
            onClick={() => toast("Edit Settings", { description: "Strategy settings coming soon." })}
            className="h-auto flex-1 gap-2 rounded-xl border-bq-border bg-transparent py-2.5 text-[13px] font-semibold text-white hover:bg-bq-surface dark:border-bq-border dark:bg-transparent dark:hover:bg-bq-surface"
          >
            <Settings className="size-4" /> Edit Settings
          </Button>
          <Button
            onClick={() => toast("Open Full View", { description: "Strategy full view coming soon." })}
            className="h-auto flex-[1.2] gap-2 rounded-xl bg-white py-2.5 text-[13px] font-semibold text-black hover:bg-white/90"
          >
            <ExternalLink className="size-4" /> Open Full View
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
