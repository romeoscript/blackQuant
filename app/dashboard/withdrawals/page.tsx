"use client";

import { useState } from "react";
import {
  History,
  Calendar,
  Wallet,
  Clock,
  Landmark,
  Coins,
  DollarSign,
} from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import {
  Card,
  StatCard,
  StatPill,
  BarChart,
  HeaderActions,
  notify,
} from "@/components/dashboard/widgets";
import { cn } from "@/lib/utils";

const MONTHLY = [
  { label: "Jan", value: 320, valueLabel: "$320" },
  { label: "Feb", value: 480, valueLabel: "$480" },
  { label: "Mar", value: 150, valueLabel: "$150" },
  { label: "Apr", value: 620, valueLabel: "$620" },
  { label: "May", value: 390, valueLabel: "$390" },
  { label: "Jun", value: 540, valueLabel: "$540", highlight: true },
];

const METHODS = [
  { id: "bank", name: "Bank Transfer", sub: "1–3 business days", icon: Landmark },
  { id: "trc20", name: "USDT (TRC20)", sub: "~10 minutes", icon: Coins },
  { id: "bep20", name: "USDT (BEP20)", sub: "~5 minutes", icon: Coins },
];

type Status = "Completed" | "Processing" | "Rejected";
const HISTORY: { ref: string; date: string; amount: string; method: string; wallet: string; status: Status }[] = [
  { ref: "WD-0041", date: "Jun 18, 2026", amount: "$320.00", method: "Bank Transfer", wallet: "****4829", status: "Completed" },
  { ref: "WD-0040", date: "Jun 15, 2026", amount: "$150.00", method: "USDT (TRC20)", wallet: "TX9J…t3Qs", status: "Completed" },
  { ref: "WD-0039", date: "Jun 12, 2026", amount: "$500.00", method: "Bank Transfer", wallet: "****4829", status: "Processing" },
  { ref: "WD-0038", date: "Jun 08, 2026", amount: "$80.00", method: "USDT (BEP20)", wallet: "0x3f…a9fc", status: "Completed" },
  { ref: "WD-0037", date: "Jun 03, 2026", amount: "$200.00", method: "Bank Transfer", wallet: "****4829", status: "Rejected" },
  { ref: "WD-0036", date: "May 28, 2026", amount: "$75.00", method: "USDT (TRC20)", wallet: "TX9J…t3Qs", status: "Completed" },
];

const statusTone: Record<Status, "green" | "white" | "red"> = {
  Completed: "green",
  Processing: "white",
  Rejected: "red",
};

const FILTERS = ["All", "Completed", "Pending"] as const;

export default function WithdrawalsPage() {
  const [method, setMethod] = useState("bank");
  const [amount, setAmount] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const rows = HISTORY.filter((r) =>
    filter === "All" ? true : filter === "Completed" ? r.status === "Completed" : r.status === "Processing",
  );

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Withdrawals" actions={<HeaderActions />} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Withdrawn" value="$1,325.00" sub="All time" icon={History} />
        <StatCard label="This Month" value="$500.00" sub="1 pending" icon={Calendar} />
        <StatCard label="Available" value="$0.00" sub="Withdrawable balance" icon={Wallet} />
        <StatCard label="Pending" value="1" sub="In processing" icon={Clock} green />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <h2 className="font-semibold text-white">Monthly Withdrawals</h2>
          <p className="text-[12px] text-bq-dim">Total withdrawn per month (USD) · Last 6 months</p>
          <BarChart data={MONTHLY} height={170} />
          <div className="mt-4 flex items-center justify-between border-t border-bq-border-soft pt-3 text-[11px] text-bq-dim">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-white" /> Current month
            </span>
            <span>6-month total: $2,080.00</span>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-white">Request Withdrawal</h2>
          <p className="text-[12px] text-bq-dim">Funds arrive within 1–3 business days.</p>

          <label className="mt-4 block text-[12px] text-bq-muted">Amount (USD)</label>
          <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-bq-border bg-bq-bg px-3">
            <DollarSign className="size-4 text-bq-dim" />
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="0.00"
              className="w-full bg-transparent py-2.5 text-sm text-white placeholder:text-bq-dim focus:outline-none"
            />
            <button
              onClick={() => setAmount("0")}
              className="text-[11px] font-semibold text-primary hover:opacity-80"
            >
              Max
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-bq-dim">Available: $0.00</p>

          <p className="mt-4 text-[12px] text-bq-muted">Withdrawal Method</p>
          <div className="mt-2 space-y-2">
            {METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                  method === m.id ? "border-primary bg-primary/5" : "border-bq-border hover:bg-white/[0.03]",
                )}
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-bq-bg text-bq-muted">
                  <m.icon className="size-4" />
                </span>
                <span className="flex-1">
                  <span className="block text-[13px] font-medium text-white">{m.name}</span>
                  <span className="block text-[11px] text-bq-dim">{m.sub}</span>
                </span>
                <span
                  className={cn(
                    "size-4 rounded-full border",
                    method === m.id ? "border-[5px] border-primary" : "border-bq-border",
                  )}
                />
              </button>
            ))}
          </div>

          <button
            onClick={() => notify("Submit Request")}
            className="mt-4 w-full rounded-lg bg-white py-2.5 text-[13px] font-semibold text-black transition-transform hover:scale-[1.01] active:translate-y-px"
          >
            Submit Request
          </button>
        </Card>
      </div>

      <Card className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-3">
          <div>
            <h2 className="font-semibold text-white">Withdrawal History</h2>
            <p className="text-[12px] text-bq-dim">6 records · 4 completed · 1 processing · 1 rejected</p>
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
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead>
              <tr className="border-y border-bq-border-soft font-plex text-[10px] uppercase tracking-[1px] text-bq-dim">
                <th className="px-5 py-2.5 font-medium">Reference</th>
                <th className="px-5 py-2.5 font-medium">Date</th>
                <th className="px-5 py-2.5 font-medium">Amount</th>
                <th className="px-5 py-2.5 font-medium">Method</th>
                <th className="px-5 py-2.5 font-medium">Wallet / Account</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.ref} className="border-b border-bq-border-soft last:border-0">
                  <td className="px-5 py-3.5 font-medium text-white">{r.ref}</td>
                  <td className="px-5 py-3.5 text-bq-muted">{r.date}</td>
                  <td className="px-5 py-3.5 font-medium text-white">{r.amount}</td>
                  <td className="px-5 py-3.5 text-bq-muted">{r.method}</td>
                  <td className="px-5 py-3.5 font-plex text-bq-muted">{r.wallet}</td>
                  <td className="px-5 py-3.5">
                    <StatPill tone={statusTone[r.status]}>{r.status}</StatPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
