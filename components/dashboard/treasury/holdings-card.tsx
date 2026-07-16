import { Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ASSETS, TOTAL_PORTFOLIO } from "./data";
import { AssetBadge, PctChange, Panel, usd } from "./panel";
import { AddAssetDialog } from "./add-asset-dialog";

function AllocationBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 w-full max-w-[120px] overflow-hidden rounded-full bg-bq-border">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="w-8 shrink-0 text-right text-[12px] text-bq-muted tabular-nums">{pct}%</span>
    </div>
  );
}

const th = "h-9 px-0 text-[10px] font-medium uppercase tracking-[1px] text-bq-dim";

export function HoldingsCard() {
  return (
    <Panel className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-white">Crypto Holdings</h2>
          <p className="text-[12px] text-bq-dim">Your assets across all wallets</p>
        </div>
        <AddAssetDialog
          trigger={
            <button className="flex shrink-0 items-center gap-1.5 rounded-lg border border-bq-border px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-bq-surface">
              <Plus className="size-3.5" /> Add Asset
            </button>
          }
        />
      </div>

      {/* desktop table */}
      <div className="mt-4 hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-bq-border-soft hover:bg-transparent">
              <TableHead className={th}>Asset</TableHead>
              <TableHead className={th}>Holdings</TableHead>
              <TableHead className={th}>Value (USD)</TableHead>
              <TableHead className={th}>24H</TableHead>
              <TableHead className={th}>Allocation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ASSETS.map((a) => (
              <TableRow key={a.symbol} className="border-bq-border-soft hover:bg-bq-surface/30">
                <TableCell className="py-3.5">
                  <div className="flex items-center gap-3">
                    <AssetBadge symbol={a.symbol} color={a.color} />
                    <div>
                      <p className="text-[13px] font-semibold text-white">{a.symbol}</p>
                      <p className="text-[11px] text-bq-dim">{a.name}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-[13px] font-medium text-white tabular-nums">{a.holdings}</p>
                  <p className="text-[11px] text-bq-dim">{a.symbol}</p>
                </TableCell>
                <TableCell>
                  <p className="text-[13px] font-medium text-white tabular-nums">{usd(a.value)}</p>
                  <p className="text-[11px] text-bq-dim">{a.symbol}</p>
                </TableCell>
                <TableCell>
                  <PctChange value={a.change} />
                </TableCell>
                <TableCell>
                  <AllocationBar pct={a.allocation} color={a.color} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* mobile list */}
      <div className="mt-4 flex flex-col md:hidden">
        {ASSETS.map((a) => (
          <div key={a.symbol} className="flex items-center gap-3 border-b border-bq-border-soft py-3 last:border-0">
            <AssetBadge symbol={a.symbol} color={a.color} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-semibold text-white">{a.symbol}</p>
                <p className="text-[13px] font-medium text-white tabular-nums">{usd(a.value)}</p>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] text-bq-dim">{a.name}</p>
                <PctChange value={a.change} showIcon={false} />
              </div>
            </div>
            <div className="w-[22%] shrink-0">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-bq-border">
                <div className="h-full rounded-full" style={{ width: `${a.allocation}%`, backgroundColor: a.color }} />
              </div>
              <p className="mt-1 text-right text-[10px] text-bq-muted tabular-nums">{a.allocation}%</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-bq-border-soft pt-4">
        <span className="text-[12px] text-bq-dim">Total portfolio value</span>
        <span className="text-[15px] font-bold text-white tabular-nums">{usd(TOTAL_PORTFOLIO)}</span>
      </div>
    </Panel>
  );
}
