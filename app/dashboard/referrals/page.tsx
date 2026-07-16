"use client";

import { useState } from "react";
import { Users, UserCheck, Link2, Gift, Share2, MessageCircle, Mail, Copy } from "lucide-react";
import { toast } from "sonner";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { Card, StatCard, StatPill, HeaderActions, notify } from "@/components/dashboard/widgets";
import { AreaLineChart } from "@/components/dashboard/charts";
import { cn } from "@/lib/utils";

const EARNINGS = [
  { label: "J", value: 1.2 },
  { label: "F", value: 1.9 },
  { label: "M", value: 1.5 },
  { label: "A", value: 2.6 },
  { label: "M", value: 2.2 },
  { label: "J", value: 3.4 },
  { label: "J", value: 2.9 },
  { label: "A", value: 3.8 },
  { label: "S", value: 3.3 },
  { label: "O", value: 4.4 },
  { label: "N", value: 4.0 },
  { label: "D", value: 4.9 },
];

const SHARE = [
  { label: "Twitter / X", icon: Share2 },
  { label: "WhatsApp", icon: MessageCircle },
  { label: "Email", icon: Mail },
  { label: "Copy Link", icon: Link2 },
];

const DOWNLINE: { name: string; joined: string; status: "Active" | "Inactive"; earned: string }[] = [
  { name: "Kolade Adewale", joined: "Jun 14, 2026", status: "Active", earned: "$12.40" },
  { name: "Amara Nwosu", joined: "Jun 10, 2026", status: "Active", earned: "$8.70" },
  { name: "Tunde Bakare", joined: "Jun 07, 2026", status: "Inactive", earned: "$0.00" },
  { name: "Fatima Al-Hassan", joined: "May 29, 2026", status: "Active", earned: "$21.00" },
  { name: "Emeka Okafor", joined: "May 22, 2026", status: "Active", earned: "$15.60" },
];

const REF_LINK = "BlackQuant.io/ref/wazobia";
const FILTERS = ["All", "Active", "Inactive"] as const;

export default function ReferralsPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const rows = DOWNLINE.filter((d) => (filter === "All" ? true : d.status === filter));

  const copyLink = () => {
    navigator.clipboard?.writeText(REF_LINK).catch(() => {});
    toast("Link copied", { description: REF_LINK });
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Referral Hub" actions={<HeaderActions />} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Referrals" value="5" sub="All time" icon={Users} />
        <StatCard label="Active Referrals" value="4" sub="1 inactive" icon={UserCheck} />
        <StatCard label="Total Earned" value="$57.70" sub="From commissions" icon={Link2} green />
        <StatCard label="Pending Rewards" value="$0.00" sub="Awaiting payout" icon={Gift} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <h2 className="font-semibold text-white">Referral Earnings</h2>
          <p className="text-[12px] text-bq-dim">Monthly commission income (USD) · Last 12 months</p>
          <div className="mt-5">
            <AreaLineChart data={EARNINGS} color="var(--primary)" height={200} />
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-bq-border-soft pt-3 text-[12px]">
            <span className="text-bq-dim">12-month total</span>
            <span className="font-bold text-primary">$57.70</span>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-white">Your Referral Link</h2>
          <p className="text-[12px] text-bq-dim">Share and earn 5% on every active referral.</p>
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-bq-border bg-bq-bg px-3 py-2.5">
            <span className="flex-1 truncate font-plex text-[12px] text-bq-text">{REF_LINK}</span>
            <button
              onClick={copyLink}
              className="flex shrink-0 items-center gap-1 text-[12px] font-semibold text-primary hover:opacity-80"
            >
              <Copy className="size-3.5" /> Copy
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {SHARE.map((s) => (
              <button
                key={s.label}
                onClick={() => (s.label === "Copy Link" ? copyLink() : notify(s.label))}
                className="flex items-center justify-center gap-2 rounded-lg border border-bq-border py-2.5 text-[12px] font-medium text-bq-text transition-colors hover:bg-white/[0.03]"
              >
                <s.icon className="size-3.5" /> {s.label}
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-bq-border bg-bq-bg p-4">
            <p className="text-[13px] font-semibold text-white">Commission Tiers</p>
            <div className="mt-2 flex items-center justify-between text-[12px]">
              <span className="text-bq-muted">Tier 1 (Direct)</span>
              <span className="font-bold text-primary">5%</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[12px]">
              <span className="text-bq-muted">Tier 2 (Indirect)</span>
              <span className="font-bold text-primary">2%</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-3">
          <div>
            <h2 className="font-semibold text-white">My Downline</h2>
            <p className="text-[12px] text-bq-dim">5 referred users · 4 active</p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-bq-border bg-bq-bg p-1">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors",
                  filter === f ? "bg-bq-surface text-white" : "text-bq-muted hover:text-bq-text",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
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
              {rows.map((d) => (
                <tr key={d.name} className="border-b border-bq-border-soft last:border-0">
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-3">
                      <span className="flex size-8 items-center justify-center rounded-full bg-bq-bg text-[11px] font-bold text-bq-text">
                        {d.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                      </span>
                      <span className="font-medium text-white">{d.name}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-bq-muted">{d.joined}</td>
                  <td className="px-5 py-3.5">
                    <StatPill tone={d.status === "Active" ? "green" : "neutral"}>{d.status}</StatPill>
                  </td>
                  <td className="px-5 py-3.5 font-medium text-white">{d.earned}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
