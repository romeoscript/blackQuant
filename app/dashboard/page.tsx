"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Wallet,
  Calendar,
  Clock,
  Plus,
  CircleDollarSign,
  CircleAlert,
  ArrowRight,
  Bell,
  Coins,
  LineChart,
  Percent,
  ShieldCheck,
  Sparkles,
  UserPlus,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { NotificationKind } from "@prisma/client";
import { cn, plainDate, timeAgo } from "@/lib/utils";
import type { VerificationStage } from "@/lib/account-status";
import {
  ACTIVITY_RANGES,
  DEFAULT_ACTIVITY_RANGE,
  type ActivityDay,
  type ActivityRange,
} from "@/lib/dashboard";
import { getControlCenterSummary } from "@/app/dashboard-actions";
import { getBalanceUsd } from "@/app/balance-actions";
import { listNotifications } from "@/app/notification-actions";

const dayLabel = new Intl.DateTimeFormat("en-GB", { weekday: "narrow" });
const fullDate = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});


const VERIFICATION_LABEL: Record<VerificationStage, string> = {
  approved: "Identity verified",
  "in-review": "Verification in review",
  unverified: "Identity unverified",
};

/** Mirrors the notification kinds, so a new kind cannot render without an icon. */
const ACTIVITY_ICONS: Record<NotificationKind, LucideIcon> = {
  WELCOME: UserPlus,
  SECURITY: ShieldCheck,
  SYSTEM: Bell,
};

const notWired = (label: string) =>
  toast(label, { description: "This action isn't wired up in the demo yet." });

const TONE = {
  good: "text-primary",
  warn: "text-bq-warn-text",
} as const;

function Stat({
  label,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  icon: LucideIcon;
  tone?: keyof typeof TONE;
}) {
  return (
    <div className="rounded-xl border border-bq-border bg-bq-surface p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 font-plex text-[10px] uppercase tracking-[1px] text-bq-muted sm:text-[11px]">
          {label}
        </span>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-bq-bg text-bq-muted">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 truncate text-[28px] font-bold leading-none text-bq-heading tabular-nums">
        {value}
      </p>
      <p className={cn("mt-2 truncate text-[12px]", tone ? TONE[tone] : "text-bq-dim")}>
        {sub}
      </p>
    </div>
  );
}

function ReportStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-lg border border-bq-border bg-bq-bg p-4">
      <p className="text-[11px] text-bq-dim">{label}</p>
      <p className="mt-1.5 flex items-center gap-1.5 text-lg font-bold text-bq-heading tabular-nums">
        <Icon className="size-4 shrink-0 text-bq-muted" /> {value}
      </p>
    </div>
  );
}

/**
 * Net movement per day. Bars are scaled against the largest day in the window
 * rather than a fixed ceiling, so a quiet week still reads as a shape — and an
 * empty window says so rather than drawing a flat line that looks like data.
 */
function ActivityChart({ days }: { days: ActivityDay[] }) {
  const peak = Math.max(...days.map((d) => Math.abs(d.netUsd)), 0);

  if (days.length === 0 || peak === 0) {
    return (
      <div className="mt-6 flex h-44 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-bq-border">
        <p className="text-[13px] text-bq-muted">No activity in this period</p>
        <Link
          href="/dashboard/fund"
          className="text-[12px] text-primary transition-opacity hover:opacity-80"
        >
          Make your first deposit
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex h-36 items-end gap-1.5">
        {days.map((day) => {
          const height = (Math.abs(day.netUsd) / peak) * 100;
          return (
            <div
              key={day.date}
              title={`${day.date}: ${day.netUsd >= 0 ? "+" : "−"}$${Math.abs(day.netUsd).toFixed(2)}`}
              className={cn(
                "flex-1 rounded-[3px] transition-colors",
                day.netUsd === 0
                  ? "bg-bq-overlay/[0.06]"
                  : day.netUsd > 0
                    ? "bg-primary"
                    : "bg-bq-loss",
              )}
              // A zero day still gets a sliver, so the axis reads as a row of
              // days rather than a gap.
              style={{ height: `${Math.max(height, 2)}%` }}
            />
          );
        })}
      </div>
      <div className="mt-2 flex gap-1.5">
        {days.map((day) => (
          <span
            key={day.date}
            className="flex-1 text-center font-plex text-[10px] text-bq-dim"
          >
            {days.length > 14 ? "" : dayLabel.format(plainDate(day.date))}
          </span>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-bq-dim">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-primary" /> Credited
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-bq-loss" /> Spent
        </span>
      </div>
    </div>
  );
}

export default function ControlCenter() {
  const [range, setRange] = useState<ActivityRange>(DEFAULT_ACTIVITY_RANGE);
  const [now, setNow] = useState<Date | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: summary } = useQuery({
    queryKey: ["control-center", range],
    queryFn: () => getControlCenterSummary(range),
    // Keeps the previous range on screen while the next one loads, so switching
    // tabs does not blank the panel.
    placeholderData: (previous) => previous,
    // The client is configured not to refetch on focus, so without an interval
    // this screen would never notice a deposit landing while it is open. Slow
    // by default and quick once one is in flight — polling only while pending
    // would never start, since the first pending deposit is itself the thing a
    // refetch has to discover.
    refetchInterval: (query) =>
      query.state.data?.pending.count ? 15_000 : 60_000,
  });
  const { data: balance = "0.00" } = useQuery({
    queryKey: ["balance"],
    queryFn: () => getBalanceUsd(),
  });
  const { data: activity = [], isPending: activityPending } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => listNotifications(),
  });

  // A new confirmed deposit means the balance and the notification list are
  // both stale. Invalidating here rather than polling them keeps one signal —
  // the deposit count — driving everything that depends on it.
  const confirmedDeposits = summary?.depositCount ?? 0;
  const previousConfirmed = useRef(confirmedDeposits);
  useEffect(() => {
    if (confirmedDeposits > previousConfirmed.current) {
      queryClient.invalidateQueries({ queryKey: ["balance"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
    previousConfirmed.current = confirmedDeposits;
  }, [confirmedDeposits, queryClient]);

  // Null until mounted: the clock and today's date differ between server and
  // client by definition, and rendering them during SSR is a hydration error.
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const funded = Number(balance) > 0;

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-bq-heading">Control Center</h1>
          <p className="mt-1 flex items-center gap-1 text-[13px] text-bq-muted">
            BlackQuant <ChevronRight className="size-3.5" /> Control Center
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="flex items-center gap-2 rounded-lg border border-bq-border px-3 py-2 font-plex text-[12px] text-bq-muted">
            <Calendar className="size-3.5" /> {now ? fullDate.format(now) : "—"}
          </span>
          <span className="flex items-center gap-2 rounded-lg border border-bq-border px-3 py-2 font-plex text-[12px] tabular-nums text-bq-muted">
            <Clock className="size-3.5" />{" "}
            {now ? now.toLocaleTimeString("en-GB", { hour12: false }) : "--:--:--"}
          </span>
          <Link
            href="/dashboard/fund"
            className="flex items-center gap-2 rounded-lg border border-bq-border px-4 py-2 text-[13px] font-semibold text-bq-heading transition-colors hover:bg-bq-overlay/5"
          >
            <CircleDollarSign className="size-4" /> Fund
          </Link>
          <button
            onClick={() => notWired("New Position")}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/85"
          >
            <Plus className="size-4" /> New Position
          </button>
        </div>
      </div>

      {/* Only shown when there is something to act on, and it names the one
          thing that matters most — a banner that is always there is furniture. */}
      {summary && !funded && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-bq-loss/25 bg-bq-loss/[0.06] px-4 py-3">
          <p className="flex items-center gap-2.5 text-[13px] text-bq-loss-strong">
            <CircleAlert className="size-4 shrink-0" />
            {summary.pending.count > 0
              ? `Your ${summary.pending.label} deposit is confirming. Your balance updates once the network confirms it.`
              : "Fund your account to start trading. Deposits are credited automatically once confirmed."}
          </p>
          <Link
            href="/dashboard/fund"
            className="flex shrink-0 items-center gap-1 text-[13px] font-semibold text-bq-loss-text transition-colors hover:text-bq-loss-strong"
          >
            {summary.pending.count > 0 ? "View deposit" : "Fund now"}{" "}
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}

      {/* overview */}
      <div>
        <p className="font-plex text-[11px] uppercase tracking-[1.5px] text-bq-dim">Overview</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {/* The balance is real, and updates as soon as a deposit is credited. */}
          <div className="rounded-xl border border-bq-border bg-bq-surface p-4 sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <span className="min-w-0 font-plex text-[10px] uppercase tracking-[1px] text-bq-muted sm:text-[11px]">
                Available Balance
              </span>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-bq-bg text-bq-muted">
                <Wallet className="size-4" />
              </span>
            </div>
            <p className="mt-3 text-[28px] font-bold leading-none text-bq-heading tabular-nums">
              ${balance}
            </p>
            <Link
              href="/dashboard/fund"
              className="mt-2 inline-flex items-center gap-1 text-[12px] text-primary transition-opacity hover:opacity-80"
            >
              Deposit crypto <ArrowRight className="size-3" />
            </Link>
          </div>

          <Stat
            label="Total Deposited"
            icon={CircleDollarSign}
            value={`$${summary?.totalDepositedUsd ?? "0.00"}`}
            sub={
              summary?.depositCount
                ? `${summary.depositCount} deposit${summary.depositCount === 1 ? "" : "s"} credited`
                : "No deposits yet"
            }
          />
          <Stat
            label="Pending Deposits"
            icon={Clock}
            value={String(summary?.pending.count ?? 0)}
            sub={summary?.pending.label ?? "Nothing awaiting confirmation"}
            tone={summary?.pending.count ? "warn" : undefined}
          />
          <Stat
            label="Account Security"
            icon={ShieldCheck}
            value={summary?.twoFactorEnabled ? "Protected" : "At risk"}
            sub={
              summary?.twoFactorEnabled
                ? `Auth Guard on · ${VERIFICATION_LABEL[summary.verification]}`
                : "Auth Guard is off"
            }
            tone={summary?.twoFactorEnabled ? "good" : "warn"}
          />
        </div>
      </div>

      {/* report + side column */}
      <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        {/* positions report */}
        <div className="rounded-xl border border-bq-border bg-bq-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-bq-heading">Account Activity</h2>
              <p className="text-[12px] text-bq-dim">
                Every movement in and out of your balance
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-bq-border bg-bq-bg p-1">
              {ACTIVITY_RANGES.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setRange(option.id)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors",
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

          <div className="mt-5 grid grid-cols-3 gap-3">
            <ReportStat
              label="Balance"
              icon={Coins}
              value={`$${balance}`}
            />
            <ReportStat
              label="Deposited"
              icon={LineChart}
              value={`$${summary?.totalDepositedUsd ?? "0.00"}`}
            />
            <ReportStat
              label="This period"
              icon={Percent}
              value={`$${summary?.activityTotalUsd ?? "0.00"}`}
            />
          </div>

          <ActivityChart days={summary?.activity ?? []} />
          <p className="mt-4 text-[11px] text-bq-dim">
            Positions and subscriptions are not wired up yet, so nothing here
            reflects trading — this is your balance history.
          </p>
        </div>

        {/* side column: subscription + activity */}
        <div className="space-y-6">
          <div className="rounded-xl border border-bq-border bg-bq-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-bq-heading">Subscription</h2>
              <span className="rounded-md bg-bq-loss/15 px-2 py-0.5 text-[11px] font-medium text-bq-loss-text">
                Inactive
              </span>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-bq-muted">
              Activate a license to unlock all platform features and signals.
            </p>
            <button
              onClick={() => router.push("/dashboard/license")}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-bq-border py-2.5 text-[13px] font-semibold text-bq-heading transition-colors hover:bg-bq-overlay/5"
            >
              <Sparkles className="size-4" /> Activate License
            </button>
          </div>

          <div className="rounded-xl border border-bq-border bg-bq-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-bq-heading">Recent Activity</h2>
              <Link
                href="/dashboard/profile"
                className="text-[12px] text-primary transition-opacity hover:opacity-80"
              >
                View all
              </Link>
            </div>
            {activityPending ? (
              <p className="py-6 text-[13px] text-bq-muted">Loading…</p>
            ) : activity.length === 0 ? (
              <p className="py-6 text-[13px] text-bq-muted">
                Nothing yet. Account events will appear here as you use
                BlackQuant.
              </p>
            ) : (
              <ul className="mt-3">
                {activity.slice(0, 5).map((item) => {
                  const Icon = ACTIVITY_ICONS[item.kind];
                  return (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 border-b border-bq-border-soft py-3 last:border-0 last:pb-0"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-bq-bg text-bq-muted">
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] text-bq-text">{item.title}</p>
                        <p className="font-plex text-[11px] text-bq-dim">
                          {timeAgo(item.createdAt)}
                        </p>
                      </div>
                      {/* Unread carries the dot; read events are history. */}
                      {!item.isRead && (
                        <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
