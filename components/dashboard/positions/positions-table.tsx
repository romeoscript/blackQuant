"use client";

import { useState } from "react";
import { ArrowUpRight, ArrowDownRight, ChevronRight, Plus } from "lucide-react";
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
import { Panel } from "@/components/dashboard/panel";
import { NewPositionDialog } from "@/components/dashboard/new-position-dialog";
import { POSITIONS, type Position } from "./data";

const TABS = ["All", "Active", "Closed"] as const;
const th = "h-9 px-0 text-[10px] font-medium uppercase tracking-[1px] text-bq-dim";

function StatusBadge({ status }: { status: Position["status"] }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-medium",
        status === "Active" && "bg-bq-surface text-bq-text",
        status === "At Risk" && "bg-amber-500/10 text-amber-400",
        status === "Closed" && "bg-bq-surface text-bq-dim",
      )}
    >
      {status}
    </span>
  );
}

function Pnl({ p }: { p: Position }) {
  const Icon = p.gain ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("inline-flex items-center gap-1 text-[13px] font-medium tabular-nums", p.gain ? "text-bq-mint" : "text-red-400")}>
      <Icon className="size-3.5" /> {p.pnl} ({p.pnlPct})
    </span>
  );
}

export function PositionsTable() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const rows = POSITIONS.filter((p) => tab === "All" || p.status === tab);

  return (
    <Panel className="p-5">
      <Tabs value={tab} onValueChange={(v) => setTab(v as (typeof TABS)[number])}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-white">All Positions</h2>
            <p className="text-[12px] text-bq-dim">6 total · 4 open · 2 closed</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
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
            <NewPositionDialog
              trigger={
                <button className="flex items-center gap-1.5 rounded-lg border border-bq-border px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-bq-surface">
                  <Plus className="size-3.5" /> New Position
                </button>
              }
            />
          </div>
        </div>

        {/* desktop table */}
        <div className="mt-4 hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="border-bq-border-soft hover:bg-transparent">
                <TableHead className={th}>Position</TableHead>
                <TableHead className={th}>Type</TableHead>
                <TableHead className={th}>Capital</TableHead>
                <TableHead className={th}>Entry Price</TableHead>
                <TableHead className={th}>Current</TableHead>
                <TableHead className={th}>P&L</TableHead>
                <TableHead className={th}>Status</TableHead>
                <TableHead className={cn(th, "text-right")}> </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id} className="border-bq-border-soft hover:bg-bq-surface/30">
                  <TableCell className="py-3.5">
                    <p className="text-[13px] font-semibold text-white">{p.pair}</p>
                    <p className="text-[11px] text-bq-dim">{p.id}</p>
                  </TableCell>
                  <TableCell className="text-[13px] font-semibold text-[#ff6a83]">{p.type}</TableCell>
                  <TableCell className="text-[13px] text-white tabular-nums">{p.capital}</TableCell>
                  <TableCell className="text-[13px] text-bq-text tabular-nums">{p.entry}</TableCell>
                  <TableCell className="text-[13px] text-bq-text tabular-nums">{p.current}</TableCell>
                  <TableCell><Pnl p={p} /></TableCell>
                  <TableCell><StatusBadge status={p.status} /></TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => toast(`${p.pair} · ${p.id}`, { description: `${p.type} · ${p.status}` })}
                      className="inline-flex items-center gap-0.5 text-[12px] text-bq-muted transition-colors hover:text-white"
                    >
                      View <ChevronRight className="size-3.5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* mobile list */}
        <div className="mt-4 flex flex-col md:hidden">
          {rows.map((p) => (
            <button
              key={p.id}
              onClick={() => toast(`${p.pair} · ${p.id}`, { description: `${p.type} · ${p.status}` })}
              className="flex items-center gap-3 border-b border-bq-border-soft py-3 text-left last:border-0"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-semibold text-white">{p.pair}</p>
                  <span className="text-[11px] font-semibold text-[#ff6a83]">{p.type}</span>
                </div>
                <p className="text-[11px] text-bq-dim">{p.id} · {p.capital}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Pnl p={p} />
                <StatusBadge status={p.status} />
              </div>
            </button>
          ))}
        </div>
      </Tabs>
    </Panel>
  );
}
