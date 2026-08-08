"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Headset, Loader2, MessageCircle } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { Panel } from "@/components/dashboard/panel";
import { StatPill } from "@/components/dashboard/widgets";
import { listDeposits, type DepositView } from "@/app/deposit-actions";
import { DEPOSIT_STATUS_UI, isPendingStatus } from "@/lib/deposit";
import { CoinLogo } from "./coin-logo";

export function RecentDepositsCard() {
  const queryClient = useQueryClient();
  const { data: deposits = [], isPending } = useQuery({
    queryKey: ["deposits"],
    queryFn: () => listDeposits(),
    // Fast while something is in flight, slow when nothing can change. A
    // confirmation counter that only moves once a minute reads as broken.
    refetchInterval: (query) =>
      (query.state.data ?? []).some((d) => isPendingStatus(d.status))
        ? 15_000
        : 60_000,
  });

  // This poll is the only thing watching a deposit land, and the balance shown
  // beside it comes from a different query that nothing else would refresh —
  // the client is configured not to refetch on window focus.
  const confirmedCount = deposits.filter((d) => d.status === "CONFIRMED").length;
  const previousConfirmed = useRef(confirmedCount);
  useEffect(() => {
    if (confirmedCount > previousConfirmed.current) {
      queryClient.invalidateQueries({ queryKey: ["balance"] });
      queryClient.invalidateQueries({ queryKey: ["control-center"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
    previousConfirmed.current = confirmedCount;
  }, [confirmedCount, queryClient]);

  return (
    <Panel className="p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[13px] font-medium text-bq-heading">Recent Deposits</h2>
        <Link
          href="/dashboard/treasury"
          className="text-[11px] text-bq-dim transition-colors hover:text-bq-heading"
        >
          View all
        </Link>
      </div>

      {isPending ? (
        <p className="flex items-center gap-2 py-6 text-[12px] text-bq-muted">
          <Loader2 className="size-3.5 animate-spin" /> Loading…
        </p>
      ) : deposits.length === 0 ? (
        <p className="py-6 text-[12px] text-bq-muted">
          No deposits yet. Send crypto to the address on the left and it will
          appear here as soon as the network sees it.
        </p>
      ) : (
        <div className="mt-2 divide-y divide-bq-border-soft">
          {deposits.map((deposit) => (
            <DepositRow key={deposit.id} deposit={deposit} />
          ))}
        </div>
      )}
    </Panel>
  );
}

function DepositRow({ deposit }: { deposit: DepositView }) {
  const ui = DEPOSIT_STATUS_UI[deposit.status];
  const credited = deposit.status === "CONFIRMED";

  return (
    <div className="flex items-start gap-3 py-3.5">
      <CoinLogo symbol={deposit.symbol} className="mt-0.5 size-7" />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-[13px] font-medium",
            credited ? "text-bq-mint" : "text-bq-heading",
          )}
        >
          {credited ? "+" : ""}
          {deposit.payAmount} {deposit.symbol}
        </p>
        {/* Only a confirmed deposit is money, so only it shows a dollar value. */}
        <p className="mt-0.5 text-[11px] text-bq-dim">
          {credited ? `$${deposit.usdCredited} credited` : (ui.note ?? "Not yet credited")}
        </p>
        <p className="mt-1 text-[11px] text-bq-dim">
          {formatDate(deposit.createdAt)}
        </p>
      </div>
      <div className="flex flex-col items-end gap-3">
        <StatPill tone={ui.tone}>{ui.label}</StatPill>
        {isPendingStatus(deposit.status) && deposit.requiredConfirmations > 0 && (
          <span className="font-plex text-[10px] text-bq-dim">
            {Math.min(deposit.confirmations, deposit.requiredConfirmations)}/
            {deposit.requiredConfirmations} conf.
          </span>
        )}
      </div>
    </div>
  );
}

export function HelpCard() {
  return (
    <Panel className="p-5">
      <span className="flex size-8 items-center justify-center rounded-full bg-bq-surface text-bq-heading">
        <Headset className="size-3.5" />
      </span>
      <h2 className="mt-3 text-[13px] font-medium text-bq-heading">Need Help?</h2>
      <p className="mt-1 text-[11px] text-bq-dim">
        Having trouble? Our support team is available 24/7.
      </p>
      <Link
        href="/dashboard/help"
        className="mt-4 flex items-center justify-center gap-2 rounded-[14px] border border-bq-border py-2.5 text-[11px] font-medium text-bq-heading transition-colors hover:bg-bq-surface"
      >
        <MessageCircle className="size-3" /> Contact Support
      </Link>
    </Panel>
  );
}
