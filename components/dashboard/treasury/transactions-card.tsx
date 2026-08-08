"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownLeft, Loader2 } from "lucide-react";
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
import { CoinLogo } from "@/components/dashboard/fund/coin-logo";
import { listDeposits, type DepositView } from "@/app/deposit-actions";
import { DEPOSIT_STATUS_UI, isPendingStatus } from "@/lib/deposit";

const ALL = "All";

const TH = "h-9 px-0 text-[10px] font-medium uppercase tracking-[1px] text-bq-dim";

/**
 * Every movement into the balance, straight from `DepositEvent`.
 *
 * Withdrawals will join this list when that flow exists; until then every row
 * is incoming, and saying "deposits" is more honest than a filter that implies
 * withdrawals are merely absent.
 */
export function TransactionsCard() {
  const [tab, setTab] = useState<string>(ALL);
  const { data: deposits = [], isPending } = useQuery({
    queryKey: ["deposits"],
    queryFn: () => listDeposits(),
    refetchInterval: (query) =>
      (query.state.data ?? []).some((d) => isPendingStatus(d.status))
        ? 15_000
        : 60_000,
  });

  // Tabs come from what the account has actually used, not a fixed list that
  // can offer a filter matching nothing.
  const symbols = [...new Set(deposits.map((d) => d.symbol))];
  const rows = deposits.filter((d) => tab === ALL || d.symbol === tab);

  return (
    <Panel className="p-5">
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-bq-heading">
              Deposit history
            </h2>
            <p className="text-[12px] text-bq-dim">
              Every deposit credited to your balance
            </p>
          </div>
          {symbols.length > 1 && (
            <TabsList className="h-auto gap-1 rounded-lg border border-bq-border bg-bq-bg p-1">
              {[ALL, ...symbols].map((symbol) => (
                <TabsTrigger
                  key={symbol}
                  value={symbol}
                  className="rounded-md px-3 py-1 text-[12px] text-bq-muted data-[state=active]:bg-bq-surface data-[state=active]:text-bq-heading"
                >
                  {symbol}
                </TabsTrigger>
              ))}
            </TabsList>
          )}
        </div>

        {isPending ? (
          <p className="flex items-center gap-2 py-8 text-[13px] text-bq-muted">
            <Loader2 className="size-3.5 animate-spin" /> Loading…
          </p>
        ) : rows.length === 0 ? (
          <p className="py-8 text-[13px] text-bq-muted">
            No deposits yet. They appear here as soon as the network sees them.
          </p>
        ) : (
          <>
            <div className="mt-4 hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-bq-border-soft hover:bg-transparent">
                    <TableHead className={TH}>Transaction</TableHead>
                    <TableHead className={TH}>Amount</TableHead>
                    <TableHead className={TH}>Credited</TableHead>
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
                          <TxIcon />
                          <div>
                            <p className="text-[13px] font-medium text-bq-heading">
                              {row.symbol} deposit
                            </p>
                            <p className="text-[11px] text-bq-dim">{row.symbol}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-plex text-[13px] text-bq-heading tabular-nums">
                        {row.payAmount} {row.symbol}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-[13px] tabular-nums",
                          row.status === "CONFIRMED"
                            ? "text-bq-mint"
                            : "text-bq-dim",
                        )}
                      >
                        {row.status === "CONFIRMED" ? `+$${row.usdCredited}` : "—"}
                      </TableCell>
                      <TableCell className="text-[12px] text-bq-muted">
                        {formatDate(row.createdAt)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge deposit={row} />
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
                  <CoinLogo symbol={row.symbol} className="size-8" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-bq-heading">
                      {row.symbol} deposit
                    </p>
                    <p className="font-plex text-[11px] text-bq-dim">
                      {row.payAmount} {row.symbol} ·{" "}
                      {formatDate(row.createdAt)}
                    </p>
                  </div>
                  <StatusBadge deposit={row} />
                </div>
              ))}
            </div>
          </>
        )}
      </Tabs>
    </Panel>
  );
}

function TxIcon() {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bq-mint/12 text-bq-mint">
      <ArrowDownLeft className="size-4" />
    </span>
  );
}

function StatusBadge({ deposit }: { deposit: DepositView }) {
  const ui = DEPOSIT_STATUS_UI[deposit.status];
  const showConfirmations =
    isPendingStatus(deposit.status) && deposit.requiredConfirmations > 0;

  return (
    <StatPill tone={ui.tone}>
      {showConfirmations
        ? `${Math.min(deposit.confirmations, deposit.requiredConfirmations)}/${deposit.requiredConfirmations}`
        : ui.label}
    </StatPill>
  );
}
