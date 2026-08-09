"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, Loader2 } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Panel } from "@/components/dashboard/panel";
import { StatPill } from "@/components/dashboard/widgets";
import { LoadError } from "@/components/dashboard/load-error";
import { CoinLogo } from "@/components/dashboard/fund/coin-logo";
import { listTransactions, type TransactionView } from "@/app/treasury-actions";
import { DEPOSIT_STATUS_UI, isPendingStatus } from "@/lib/deposit";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "in", label: "Money in" },
  { id: "out", label: "Money out" },
] as const;

const TH = "h-9 px-0 text-[10px] font-medium uppercase tracking-[1px] text-bq-dim";

/**
 * Every movement of money, not only deposits.
 *
 * A purchase leaves the balance as surely as a deposit enters it, and a screen
 * showing one but not the other turns spending into an unexplained drop in the
 * balance curve above it.
 */
export function TransactionsCard() {
  const [filter, setFilter] = useState<string>("all");

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => listTransactions(),
    refetchInterval: (query) =>
      (query.state.data ?? []).some(
        (row) => row.type === "deposit" && isPendingStatus(row.status),
      )
        ? 15_000
        : 60_000,
  });

  // Split by the direction the money actually moved, not by which arm of the
  // union a row came from: a referral commission is a ledger entry that pays in.
  const rows = (data ?? []).filter((row) => {
    if (filter === "all") return true;
    const incoming = row.type === "deposit" || Number(row.amountUsd) > 0;
    return filter === "in" ? incoming : !incoming;
  });

  return (
    <Panel className="p-5">
      <Tabs value={filter} onValueChange={setFilter}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-bq-heading">
              Account activity
            </h2>
            <p className="text-[12px] text-bq-dim">
              Everything that moved your balance
            </p>
          </div>
          <TabsList className="h-auto gap-1 rounded-lg border border-bq-border bg-bq-bg p-1">
            {FILTERS.map((option) => (
              <TabsTrigger
                key={option.id}
                value={option.id}
                className="rounded-md px-3 py-1 text-[12px] text-bq-muted data-[state=active]:bg-bq-surface data-[state=active]:text-bq-heading"
              >
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {isError || data === null ? (
          <LoadError
            className="mt-4"
            message="We couldn't load your activity."
            onRetry={() => refetch()}
          />
        ) : isPending ? (
          <p className="flex items-center gap-2 py-8 text-[13px] text-bq-muted">
            <Loader2 className="size-3.5 animate-spin" /> Loading…
          </p>
        ) : rows.length === 0 ? (
          <p className="py-8 text-[13px] text-bq-muted">
            Nothing here yet. Deposits and purchases both appear in this list.
          </p>
        ) : (
          <>
            <div className="mt-4 hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-bq-border-soft hover:bg-transparent">
                    <TableHead className={TH}>Transaction</TableHead>
                    <TableHead className={TH}>Detail</TableHead>
                    <TableHead className={TH}>Amount</TableHead>
                    <TableHead className={TH}>Date</TableHead>
                    <TableHead className={TH}>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="border-bq-border-soft hover:bg-bq-surface/30"
                    >
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-3">
                          <RowIcon row={row} />
                          <div>
                            <p className="text-[13px] font-medium text-bq-heading">
                              {row.type === "deposit"
                                ? `${row.symbol} deposit`
                                : row.title}
                            </p>
                            <p className="text-[11px] capitalize text-bq-dim">
                              {row.type === "deposit" ? row.symbol : row.kind}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-plex text-[13px] text-bq-muted tabular-nums">
                        {row.type === "deposit"
                          ? `${row.payAmount} ${row.symbol}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Amount row={row} />
                      </TableCell>
                      <TableCell className="text-[12px] text-bq-muted">
                        {formatDate(row.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Status row={row} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex flex-col md:hidden">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center gap-3 border-b border-bq-border-soft py-3 last:border-0"
                >
                  <RowIcon row={row} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-bq-heading">
                      {row.type === "deposit"
                        ? `${row.symbol} deposit`
                        : row.title}
                    </p>
                    <p className="font-plex text-[11px] text-bq-dim">
                      {formatDate(row.createdAt)}
                    </p>
                  </div>
                  <Amount row={row} />
                </div>
              ))}
            </div>
          </>
        )}
      </Tabs>
    </Panel>
  );
}

function RowIcon({ row }: { row: TransactionView }) {
  if (row.type === "deposit") {
    return <CoinLogo symbol={row.symbol} className="size-9" />;
  }
  const credit = Number(row.amountUsd) > 0;
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full bg-bq-surface",
        credit ? "text-bq-mint" : "text-bq-muted",
      )}
    >
      {credit ? (
        <ArrowDownLeft className="size-4" />
      ) : (
        <ArrowUpRight className="size-4" />
      )}
    </span>
  );
}

/** Signed and coloured, so money in and money out differ at a glance. */
function Amount({ row }: { row: TransactionView }) {
  if (row.type === "ledger") {
    // The sign comes off the entry rather than the row type. A commission and a
    // purchase are both ledger entries; only the amount says which is which.
    const amount = Number(row.amountUsd);
    return (
      <span
        className={cn(
          "text-[13px] font-medium tabular-nums",
          amount > 0 ? "text-bq-mint" : "text-bq-heading",
        )}
      >
        {amount > 0 ? "+" : "−"}${Math.abs(amount).toFixed(2)}
      </span>
    );
  }
  // Only a confirmed deposit is money, so only it shows a dollar figure.
  if (row.status !== "CONFIRMED") {
    return <span className="text-[13px] text-bq-dim">—</span>;
  }
  return (
    <span className="text-[13px] font-medium text-bq-mint tabular-nums">
      +${row.usdCredited}
    </span>
  );
}

function Status({ row }: { row: TransactionView }) {
  if (row.type === "ledger") {
    return Number(row.amountUsd) > 0 ? (
      <StatPill tone="green">Credited</StatPill>
    ) : (
      <StatPill tone="neutral">Paid</StatPill>
    );
  }

  const ui = DEPOSIT_STATUS_UI[row.status];
  const showConfirmations =
    isPendingStatus(row.status) && row.requiredConfirmations > 0;

  return (
    <StatPill tone={ui.tone}>
      {showConfirmations
        ? `${Math.min(row.confirmations, row.requiredConfirmations)}/${row.requiredConfirmations}`
        : ui.label}
    </StatPill>
  );
}
