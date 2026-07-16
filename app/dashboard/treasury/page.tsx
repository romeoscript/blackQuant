"use client";

import { CirclePlus, CircleArrowOutUpRight, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { StatCards } from "@/components/dashboard/treasury/stat-cards";
import { HoldingsCard } from "@/components/dashboard/treasury/holdings-card";
import { AllocationCard } from "@/components/dashboard/treasury/allocation-card";
import { BalanceHistoryCard } from "@/components/dashboard/treasury/balance-history-card";
import { TransactionsCard } from "@/components/dashboard/treasury/transactions-card";

export default function TreasuryPage() {
  return (
    <div className="space-y-4 lg:space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Treasury</h1>
          <p className="mt-1 flex items-center gap-1 text-[13px] text-bq-muted">
            BlackQuant <ChevronRight className="size-3.5" />{" "}
            <span className="text-bq-text">Treasury</span>
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => toast("Fund", { description: "Funding flow coming soon." })}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-black transition-transform hover:scale-[1.02] active:translate-y-px"
          >
            <CirclePlus className="size-4" /> Fund
          </button>
          <button
            onClick={() => toast("Withdraw", { description: "Withdrawal flow coming soon." })}
            className="flex items-center gap-2 rounded-full border border-bq-border px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-bq-surface"
          >
            <CircleArrowOutUpRight className="size-4" /> Withdraw
          </button>
        </div>
      </div>

      <StatCards />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-5">
        <HoldingsCard />
        <AllocationCard />
      </div>

      <BalanceHistoryCard />
      <TransactionsCard />
    </div>
  );
}
