"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CirclePlus, CircleArrowOutUpRight, ChevronRight } from "lucide-react";
import { LoadError } from "@/components/dashboard/load-error";
import { StatCards } from "@/components/dashboard/treasury/stat-cards";
import { DepositsByAssetCard } from "@/components/dashboard/treasury/holdings-card";
import { AllocationCard } from "@/components/dashboard/treasury/allocation-card";
import { BalanceHistoryCard } from "@/components/dashboard/treasury/balance-history-card";
import { TransactionsCard } from "@/components/dashboard/treasury/transactions-card";
import { getTreasurySummary } from "@/app/treasury-actions";
import { DEFAULT_BALANCE_RANGE, type BalanceRange } from "@/lib/treasury";

export default function TreasuryPage() {
  const [range, setRange] = useState<BalanceRange>(DEFAULT_BALANCE_RANGE);

  const {
    data: summary,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["treasury", range],
    queryFn: () => getTreasurySummary(range),
    // Switching ranges keeps the current figures on screen rather than
    // flashing zeroes at someone reading their balance.
    placeholderData: (previous) => previous,
    refetchInterval: (query) => (query.state.data?.pendingCount ? 15_000 : 60_000),
  });

  // Null is the action reporting failure; isError covers the request never
  // arriving at all.
  const unavailable = isError || summary === null;

  return (
    <div className="space-y-4 lg:space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-bq-heading">Treasury</h1>
          <p className="mt-1 flex items-center gap-1 text-[13px] text-bq-muted">
            BlackQuant <ChevronRight className="size-3.5" />{" "}
            <span className="text-bq-text">Treasury</span>
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/fund"
            className="flex items-center gap-2 rounded-full bg-bq-contrast px-4 py-2 text-[13px] font-semibold text-bq-on-fill transition-transform hover:scale-[1.02] active:translate-y-px"
          >
            <CirclePlus className="size-4" /> Fund
          </Link>
          <Link
            href="/dashboard/withdrawals"
            className="flex items-center gap-2 rounded-full border border-bq-border px-4 py-2 text-[13px] font-semibold text-bq-heading transition-colors hover:bg-bq-surface"
          >
            <CircleArrowOutUpRight className="size-4" /> Withdraw
          </Link>
        </div>
      </div>

      {unavailable ? (
        <LoadError
          message="We couldn't load your treasury. Your balance is safe — this is only the view."
          onRetry={() => refetch()}
        />
      ) : (
        <>
          <StatCards summary={summary ?? undefined} />

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-5">
            <DepositsByAssetCard
              assets={summary?.byAsset ?? []}
              totalUsd={summary?.totalDepositedUsd ?? "0.00"}
            />
            <AllocationCard
              assets={summary?.byAsset ?? []}
              totalUsd={summary?.totalDepositedUsd ?? "0.00"}
            />
          </div>

          <BalanceHistoryCard
            history={summary?.history ?? []}
            range={range}
            onRangeChange={setRange}
          />
        </>
      )}
      <TransactionsCard />
    </div>
  );
}
