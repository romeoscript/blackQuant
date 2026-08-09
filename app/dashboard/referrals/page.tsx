"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Check,
  Copy,
  Gift,
  Link2,
  Loader2,
  Mail,
  MessageCircle,
  Share2,
  UserCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { Card, StatCard, StatPill } from "@/components/dashboard/widgets";
import { AreaLineChart } from "@/components/dashboard/charts";
import { LoadError } from "@/components/dashboard/load-error";
import {
  getReferralSummary,
  type DownlineRow,
  type ReferralSummary,
} from "@/app/referral-actions";
import { cn, formatDate } from "@/lib/utils";

const FILTERS = ["All", "Active", "Inactive"] as const;

export default function ReferralsPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const {
    data: summary,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["referrals"],
    queryFn: () => getReferralSummary(),
  });

  // Null is the action reporting failure; isError covers the request never
  // arriving at all. Neither is an account with no referrals.
  if (isError || summary === null) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Referral Hub" />
        <LoadError
          message="We couldn't load your referrals. Your earnings are safe — this is only the view."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const rows = (summary?.downline ?? []).filter((row) =>
    filter === "All" ? true : filter === "Active" ? row.active : !row.active,
  );

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Referral Hub" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Referrals"
          value={summary ? String(summary.totalReferrals) : "—"}
          sub="All time"
          icon={Users}
        />
        <StatCard
          label="Active Referrals"
          value={summary ? String(summary.activeReferrals) : "—"}
          sub={
            summary
              ? `${summary.totalReferrals - summary.activeReferrals} without a live plan`
              : undefined
          }
          icon={UserCheck}
        />
        <StatCard
          label="Total Earned"
          value={summary ? `$${summary.totalEarnedUsd}` : "—"}
          sub="Credited to your balance"
          icon={Link2}
          green
        />
        <StatCard
          label="Last 30 Days"
          value={summary ? `$${summary.last30DaysUsd}` : "—"}
          sub="Commission earned"
          icon={Gift}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <h2 className="font-semibold text-bq-heading">Referral Earnings</h2>
          <p className="text-[12px] text-bq-dim">
            Monthly commission income (USD) · Last 12 months
          </p>
          <div className="mt-5">
            {/* An empty series has no minimum or maximum to scale against, so
                the chart waits for one rather than drawing a flat lie. */}
            {summary ? (
              <AreaLineChart
                data={summary.earnings}
                color="var(--primary)"
                height={200}
              />
            ) : (
              <div className="flex h-[200px] items-center justify-center text-[13px] text-bq-muted">
                <Loader2 className="mr-2 size-3.5 animate-spin" /> Loading…
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-bq-border-soft pt-3 text-[12px]">
            <span className="text-bq-dim">12-month total</span>
            <span className="font-bold text-primary">
              $
              {(summary?.earnings ?? [])
                .reduce((total, point) => total + point.value, 0)
                .toFixed(2)}
            </span>
          </div>
        </Card>

        <ShareCard summary={summary} />
      </div>

      <Card className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-3">
          <div>
            <h2 className="font-semibold text-bq-heading">My Downline</h2>
            <p className="text-[12px] text-bq-dim">
              {summary
                ? `${summary.totalReferrals} referred · ${summary.activeReferrals} active`
                : "Loading…"}
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-bq-border bg-bq-bg p-1">
            {FILTERS.map((option) => (
              <button
                key={option}
                onClick={() => setFilter(option)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors",
                  filter === option
                    ? "bg-bq-surface text-bq-heading"
                    : "text-bq-muted hover:text-bq-text",
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {isPending ? (
          <p className="flex items-center gap-2 px-5 py-10 text-[13px] text-bq-muted">
            <Loader2 className="size-3.5 animate-spin" /> Loading your
            referrals…
          </p>
        ) : rows.length === 0 ? (
          <p className="px-5 py-10 text-[13px] text-bq-muted">
            {summary && summary.totalReferrals === 0
              ? "Nobody has signed up through your link yet. Share it above to start earning."
              : `No ${filter.toLowerCase()} referrals.`}
          </p>
        ) : (
          <DownlineTable rows={rows} />
        )}

        {summary && summary.hiddenCount > 0 && (
          <p className="border-t border-bq-border-soft px-5 py-3 text-[12px] text-bq-dim">
            Showing your {summary.downline.length} most recent referrals.{" "}
            {summary.hiddenCount} older{" "}
            {summary.hiddenCount === 1 ? "one is" : "ones are"} not listed —
            every one of them still earns.
          </p>
        )}
      </Card>
    </div>
  );
}

/**
 * The link, and the ways to send it.
 *
 * Real destinations rather than a toast: the share row is the only thing on
 * this screen with a job, and a button that opens nothing teaches people not to
 * press it.
 */
function ShareCard({ summary }: { summary: ReferralSummary | undefined }) {
  const [copied, setCopied] = useState(false);
  const link = summary?.link ?? "";

  const copyLink = () => {
    if (!link) return;
    navigator.clipboard?.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied", { description: link });
  };

  const pitch = "Trade with BlackQuant — automated signals and live execution.";
  const encoded = encodeURIComponent(link);
  const shares = [
    {
      label: "Twitter / X",
      icon: Share2,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(pitch)}&url=${encoded}`,
    },
    {
      label: "WhatsApp",
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodeURIComponent(`${pitch} ${link}`)}`,
    },
    {
      label: "Email",
      icon: Mail,
      href: `mailto:?subject=${encodeURIComponent("Join me on BlackQuant")}&body=${encodeURIComponent(`${pitch}\n\n${link}`)}`,
    },
  ];

  return (
    <Card>
      <h2 className="font-semibold text-bq-heading">Your Referral Link</h2>
      <p className="text-[12px] text-bq-dim">
        {summary
          ? `Earn ${summary.tiers[0]?.rate ?? "5%"} on everything the people you refer buy.`
          : "Loading your link…"}
      </p>

      <div className="mt-4 flex items-center gap-2 rounded-lg border border-bq-border bg-bq-bg px-3 py-2.5">
        <span className="flex-1 truncate font-plex text-[12px] text-bq-text">
          {link || "—"}
        </span>
        <button
          onClick={copyLink}
          disabled={!link}
          className="flex shrink-0 items-center gap-1 text-[12px] font-semibold text-primary transition-opacity hover:opacity-80 disabled:opacity-40"
        >
          {copied ? (
            <>
              <Check className="size-3.5" /> Copied
            </>
          ) : (
            <>
              <Copy className="size-3.5" /> Copy
            </>
          )}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {shares.map((share) => (
          <a
            key={share.label}
            href={link ? share.href : undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!link}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg border border-bq-border py-2.5 text-[12px] font-medium text-bq-text transition-colors hover:bg-bq-overlay/[0.03]",
              !link && "pointer-events-none opacity-40",
            )}
          >
            <share.icon className="size-3.5" /> {share.label}
          </a>
        ))}
        <button
          onClick={copyLink}
          disabled={!link}
          className="flex items-center justify-center gap-2 rounded-lg border border-bq-border py-2.5 text-[12px] font-medium text-bq-text transition-colors hover:bg-bq-overlay/[0.03] disabled:opacity-40"
        >
          <Link2 className="size-3.5" /> Copy Link
        </button>
      </div>

      <div className="mt-4 rounded-lg border border-bq-border bg-bq-bg p-4">
        <p className="text-[13px] font-semibold text-bq-heading">
          Commission Tiers
        </p>
        {(summary?.tiers ?? []).map((tier) => (
          <div
            key={tier.label}
            className="mt-2 flex items-center justify-between text-[12px]"
          >
            <span className="text-bq-muted">{tier.label}</span>
            <span className="font-bold text-primary">{tier.rate}</span>
          </div>
        ))}
        <p className="mt-3 text-[11px] leading-relaxed text-bq-dim">
          Paid on plans and add-ons your referrals buy, credited to your balance
          as soon as the purchase completes.
        </p>
      </div>
    </Card>
  );
}

function DownlineTable({ rows }: { rows: DownlineRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-[13px]">
        <thead>
          <tr className="border-y border-bq-border-soft font-plex text-[10px] uppercase tracking-[1px] text-bq-dim">
            <th className="px-5 py-2.5 font-medium">User</th>
            <th className="px-5 py-2.5 font-medium">Joined</th>
            <th className="px-5 py-2.5 font-medium">Status</th>
            <th className="px-5 py-2.5 font-medium">Commission Earned</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-bq-border-soft last:border-0"
            >
              <td className="px-5 py-3.5">
                <span className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-full bg-bq-bg text-[11px] font-bold text-bq-text">
                    {row.initials}
                  </span>
                  <span className="font-medium text-bq-heading">{row.name}</span>
                </span>
              </td>
              <td className="px-5 py-3.5 text-bq-muted">
                {formatDate(row.joinedAt)}
              </td>
              <td className="px-5 py-3.5">
                <StatPill tone={row.active ? "green" : "neutral"}>
                  {row.active ? "Active" : "Inactive"}
                </StatPill>
              </td>
              <td className="px-5 py-3.5 font-medium text-bq-heading">
                ${row.earnedUsd}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
