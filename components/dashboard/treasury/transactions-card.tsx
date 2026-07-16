"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TRANSACTIONS, type Transaction } from "./data";
import { Panel } from "@/components/dashboard/panel";

const TABS = ["All", "BTC", "ETH", "USDT"] as const;

function TxIcon({ incoming }: { incoming: boolean }) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full",
        incoming ? "bg-bq-mint/12 text-bq-mint" : "bg-bq-surface text-bq-muted",
      )}
    >
      {incoming ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
    </span>
  );
}

function StatusBadge({ status }: { status: Transaction["status"] }) {
  return (
    <Badge
      className={cn(
        "rounded-full font-medium",
        status === "Completed"
          ? "bg-bq-mint/10 text-bq-mint"
          : "bg-amber-500/10 text-amber-400",
      )}
    >
      {status}
    </Badge>
  );
}

const th = "h-9 px-0 text-[10px] font-medium uppercase tracking-[1px] text-bq-dim";

export function TransactionsCard() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const rows = TRANSACTIONS.filter((t) => tab === "All" || t.asset === tab);

  return (
    <Panel className="p-5">
      <Tabs value={tab} onValueChange={(v) => setTab(v as (typeof TABS)[number])}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-white">Transaction History</h2>
            <p className="text-[12px] text-bq-dim">
              Recent deposits and withdrawals across all assets
            </p>
          </div>
          <div className="flex items-center gap-4">
            <TabsList className="h-auto gap-1 rounded-lg border border-bq-border bg-bq-bg p-1">
              {TABS.map((t) => (
                <TabsTrigger
                  key={t}
                  value={t}
                  className="rounded-md px-3 py-1 text-[12px] text-bq-muted data-[state=active]:bg-bq-surface data-[state=active]:text-white"
                >
                  {t}
                </TabsTrigger>
              ))}
            </TabsList>
            <button
              onClick={() => toast("Transactions", { description: "Full history coming soon." })}
              className="shrink-0 text-[12px] text-bq-muted transition-colors hover:text-white"
            >
              View all
            </button>
          </div>
        </div>

        {/* desktop table */}
        <div className="mt-4 hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="border-bq-border-soft hover:bg-transparent">
                <TableHead className={th}>Transaction</TableHead>
                <TableHead className={th}>Amount</TableHead>
                <TableHead className={th}>USD Value</TableHead>
                <TableHead className={th}>Date</TableHead>
                <TableHead className={th}>Status</TableHead>
                <TableHead className={cn(th, "text-right")}> </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t, i) => (
                <TableRow key={i} className="border-bq-border-soft hover:bg-bq-surface/30">
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-3">
                      <TxIcon incoming={t.incoming} />
                      <div>
                        <p className="text-[13px] font-medium text-white">
                          {t.asset} {t.type}
                        </p>
                        <p className="text-[11px] text-bq-dim">{t.asset}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-[13px] font-medium tabular-nums",
                      t.incoming ? "text-bq-mint" : "text-white",
                    )}
                  >
                    {t.amount}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-[13px] tabular-nums",
                      t.incoming ? "text-bq-mint" : "text-white",
                    )}
                  >
                    {t.usd}
                  </TableCell>
                  <TableCell className="text-[12px] text-bq-muted">{t.date}</TableCell>
                  <TableCell>
                    <StatusBadge status={t.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => toast(`${t.asset} ${t.type}`, { description: t.date })}
                      className="inline-flex items-center gap-0.5 text-[12px] text-bq-muted transition-colors hover:text-white"
                    >
                      Details <ChevronRight className="size-3.5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* mobile list */}
        <div className="mt-4 flex flex-col md:hidden">
          {rows.map((t, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-bq-border-soft py-3 last:border-0">
              <TxIcon incoming={t.incoming} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-white">
                  {t.asset} {t.type}
                </p>
                <p className="text-[11px] text-bq-dim">
                  {t.asset} · {t.date}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <p className={cn("text-[12px] font-medium tabular-nums", t.incoming ? "text-bq-mint" : "text-white")}>
                  {t.amount}
                </p>
                <StatusBadge status={t.status} />
              </div>
            </div>
          ))}
        </div>
      </Tabs>
    </Panel>
  );
}
