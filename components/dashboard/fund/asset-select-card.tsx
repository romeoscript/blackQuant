"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Panel } from "@/components/dashboard/panel";
import { AddAssetDialog } from "@/components/dashboard/treasury/add-asset-dialog";
import { DEPOSIT_ASSETS, type DepositAsset } from "./data";

export function TintBadge({
  symbol,
  color,
  className,
}: {
  symbol: string;
  color: string;
  className?: string;
}) {
  return (
    <span
      style={{ backgroundColor: `${color}21`, color }}
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
        className,
      )}
    >
      {symbol.slice(0, 2)}
    </span>
  );
}

export function AssetSelectCard({
  selected,
  onSelect,
}: {
  selected: DepositAsset;
  onSelect: (asset: DepositAsset) => void;
}) {
  return (
    <Panel className="p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[13px] font-medium text-bq-heading">Select Asset to Deposit</h2>
        <AddAssetDialog
          trigger={
            <button className="flex shrink-0 items-center gap-1.5 rounded-[14px] border border-bq-border px-3 py-1.5 text-[11px] font-medium text-bq-heading transition-colors hover:bg-bq-surface">
              <Plus className="size-3" /> Add Asset
            </button>
          }
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {DEPOSIT_ASSETS.map((asset) => {
          const active = asset.symbol === selected.symbol;
          return (
            <button
              key={asset.symbol}
              onClick={() => onSelect(asset)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-[14px] border py-[15px] transition-colors",
                active
                  ? "border-bq-heading bg-bq-surface"
                  : "border-bq-border hover:bg-white/[0.02]",
              )}
            >
              <TintBadge symbol={asset.symbol} color={asset.color} />
              <span className="flex flex-col items-center gap-0.5">
                <span className="text-[11px] font-medium text-bq-heading">{asset.symbol}</span>
                <span
                  style={{ backgroundColor: `${asset.color}17`, color: asset.color }}
                  className="rounded px-1.5 py-px text-[10px]"
                >
                  {asset.network}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
