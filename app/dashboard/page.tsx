"use client";

import { useEffect, useState } from "react";
import {
  Wallet,
  Package,
  RefreshCw,
  TrendingUp,
  Calendar,
  Clock,
  Plus,
  CircleDollarSign,
  CircleAlert,
  ArrowRight,
  Coins,
  LineChart,
  Percent,
  Sparkles,
  UserPlus,
  ShieldOff,
  CircleX,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const OVERVIEW: { label: string; value: string; sub: string; icon: LucideIcon; positive?: boolean }[] = [
  { label: "Available Balance", value: "$0.00", sub: "Last updated just now", icon: Wallet },
  { label: "Active Subscription", value: "0", sub: "No active license", icon: Package },
  { label: "Working Capital", value: "$0", sub: "Team capital: $0.00", icon: RefreshCw },
  { label: "Revenue", value: "$0", sub: "+0% Growth", icon: TrendingUp, positive: true },
];

const REPORT_STATS: { label: string; value: string; icon: LucideIcon }[] = [
  { label: "Capital", value: "$0", icon: Coins },
  { label: "Revenue", value: "$0", icon: LineChart },
  { label: "Growth Rate", value: "0%", icon: Percent },
];

const BARS = [22, 30, 18, 26, 20, 14, 24, 100, 28, 16, 22, 30, 18, 26];
const DAYS = ["M", "T", "W", "T", "F", "S", "S", "M", "T", "W", "T", "F", "S", "S"];
const PEAK = 7;

const TABS = ["Weekly", "Monthly", "All time"] as const;

const ACTIVITY: { title: string; time: string; icon: LucideIcon; dot: string }[] = [
  { title: "Account created", time: "Just now", icon: UserPlus, dot: "bg-primary" },
  { title: "2FA not configured", time: "2 mins ago", icon: ShieldOff, dot: "bg-[#ff3b5c]" },
  { title: "Verification pending", time: "5 mins ago", icon: Clock, dot: "bg-bq-dim" },
  { title: "No active subscription", time: "10 mins ago", icon: CircleX, dot: "bg-bq-dim" },
  { title: "Balance: $0.00", time: "15 mins ago", icon: Wallet, dot: "bg-bq-dim" },
];

const notWired = (label: string) =>
  toast(label, { description: "This action isn't wired up in the demo yet." });

export default function ControlCenter() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Weekly");
  const [time, setTime] = useState("11:58:41");

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Control Center</h1>
          <p className="mt-1 flex items-center gap-1 text-[13px] text-bq-muted">
            BlackQuant <ChevronRight className="size-3.5" /> Control Center
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="flex items-center gap-2 rounded-lg border border-bq-border px-3 py-2 font-plex text-[12px] text-bq-muted">
            <Calendar className="size-3.5" /> Jun 19, 2026
          </span>
          <span className="flex items-center gap-2 rounded-lg border border-bq-border px-3 py-2 font-plex text-[12px] tabular-nums text-bq-muted">
            <Clock className="size-3.5" /> {time}
          </span>
          <button
            onClick={() => notWired("Fund")}
            className="flex items-center gap-2 rounded-lg border border-bq-border px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-white/5"
          >
            <CircleDollarSign className="size-4" /> Fund
          </button>
          <button
            onClick={() => notWired("New Position")}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/85"
          >
            <Plus className="size-4" /> New Position
          </button>
        </div>
      </div>

      {/* fund/subscription alert */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#ff3b5c]/25 bg-[#ff3b5c]/[0.06] px-4 py-3">
        <p className="flex items-center gap-2.5 text-[13px] text-[#ff8496]">
          <CircleAlert className="size-4 shrink-0" />
          Please fund your account and activate a subscription to begin accessing the platform&apos;s
          features and services.
        </p>
        <button
          onClick={() => notWired("Fund Now")}
          className="flex shrink-0 items-center gap-1 text-[13px] font-semibold text-[#ff6a83] transition-colors hover:text-[#ff8496]"
        >
          Fund Now <ArrowRight className="size-3.5" />
        </button>
      </div>

      {/* overview */}
      <div>
        <p className="font-plex text-[11px] uppercase tracking-[1.5px] text-bq-dim">Overview</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {OVERVIEW.map((c) => (
            <div key={c.label} className="rounded-xl border border-bq-border bg-bq-surface p-5">
              <div className="flex items-center justify-between">
                <span className="font-plex text-[11px] uppercase tracking-[1px] text-bq-muted">
                  {c.label}
                </span>
                <span className="flex size-8 items-center justify-center rounded-lg bg-bq-bg text-bq-muted">
                  <c.icon className="size-4" />
                </span>
              </div>
              <p className="mt-3 text-[28px] font-bold leading-none text-white">{c.value}</p>
              <p className={cn("mt-2 text-[12px]", c.positive ? "text-primary" : "text-bq-dim")}>
                {c.sub}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* report + side column */}
      <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        {/* positions report */}
        <div className="rounded-xl border border-bq-border bg-bq-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-white">Positions Report</h2>
              <p className="text-[12px] text-bq-dim">0 Orders</p>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-bq-border bg-bq-bg p-1">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors",
                    tab === t ? "bg-bq-surface text-white" : "text-bq-muted hover:text-bq-text",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            {REPORT_STATS.map((s) => (
              <div key={s.label} className="rounded-lg border border-bq-border bg-bq-bg p-4">
                <p className="text-[11px] text-bq-dim">{s.label}</p>
                <p className="mt-1.5 flex items-center gap-1.5 text-lg font-bold text-white">
                  <s.icon className="size-4 text-bq-muted" /> {s.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <p className="text-[14px] font-semibold text-white">Weekly Performance: $0.00</p>
            <p className="text-[12px] text-bq-dim">Gains &amp; activity across 2 weeks</p>

            <div className="mt-5">
              <div className="flex h-36 items-end gap-2">
                {BARS.map((h, i) => (
                  <div
                    key={i}
                    className={cn("flex-1 rounded-[3px]", i === PEAK ? "bg-white" : "bg-white/[0.09]")}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                {DAYS.map((d, i) => (
                  <span key={i} className="flex-1 text-center font-plex text-[10px] text-bq-dim">
                    {d}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-bq-dim">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-white" /> Peak day
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-white/[0.12]" /> Regular activity
                </span>
              </div>
              <span>$0.00 total this period</span>
            </div>
          </div>
        </div>

        {/* side column: subscription + activity */}
        <div className="space-y-6">
          <div className="rounded-xl border border-bq-border bg-bq-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">Subscription</h2>
              <span className="rounded-md bg-[#ff3b5c]/15 px-2 py-0.5 text-[11px] font-medium text-[#ff6a83]">
                Inactive
              </span>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-bq-muted">
              Activate a license to unlock all platform features and signals.
            </p>
            <button
              onClick={() => notWired("Activate License")}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-bq-border py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-white/5"
            >
              <Sparkles className="size-4" /> Activate License
            </button>
          </div>

          <div className="rounded-xl border border-bq-border bg-bq-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">Recent Activity</h2>
              <button
                onClick={() => notWired("Activity log")}
                className="text-[12px] text-primary transition-opacity hover:opacity-80"
              >
                View all
              </button>
            </div>
            <ul className="mt-3">
              {ACTIVITY.map((a) => (
                <li
                  key={a.title}
                  className="flex items-center gap-3 border-b border-bq-border-soft py-3 last:border-0 last:pb-0"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-bq-bg text-bq-muted">
                    <a.icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] text-bq-text">{a.title}</p>
                    <p className="font-plex text-[11px] text-bq-dim">{a.time}</p>
                  </div>
                  <span className={cn("size-1.5 shrink-0 rounded-full", a.dot)} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
