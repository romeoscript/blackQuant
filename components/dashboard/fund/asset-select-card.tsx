"use client";

import { cn } from "@/lib/utils";
import { Panel } from "@/components/dashboard/panel";
import { DEPOSIT_ASSETS, type DepositAssetInfo } from "@/lib/deposit";
import { CoinLogo } from "./coin-logo";

export function AssetSelectCard({
  selected,
  onSelect,
}: {
  selected: DepositAssetInfo;
  onSelect: (asset: DepositAssetInfo) => void;
}) {
  return (
    <Panel className="p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[13px] font-medium text-bq-heading">Choose an asset</h2>
        <p className="text-[11px] text-bq-dim">
          The network is fixed per asset
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label="Deposit asset"
        // Four across only once the column is genuinely wide: at tablet widths
        // a four-up grid squeezes "XRP Ledger" into an ellipsis, and the
        // network is the one label on this page that must never be guessed at.
        className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4"
      >
        {DEPOSIT_ASSETS.map((asset) => {
          const active = asset.symbol === selected.symbol;
          return (
            <button
              key={asset.symbol}
              role="radio"
              aria-checked={active}
              onClick={() => onSelect(asset)}
              // Selection is keyed to the asset's own colour rather than a
              // house accent, so the tile you picked and the address you are
              // about to use are visibly the same thing.
              style={
                active
                  ? {
                      borderColor: `${asset.color}80`,
                      backgroundColor: `${asset.color}14`,
                    }
                  : undefined
              }
              className={cn(
                "group flex items-center gap-3 rounded-[14px] border px-3 py-3 text-left transition-colors",
                active
                  ? "border-transparent"
                  : "border-bq-border hover:border-bq-border-soft hover:bg-bq-overlay/[0.03]",
              )}
            >
              <CoinLogo
                symbol={asset.symbol}
                className={cn(
                  "size-7 transition-opacity",
                  active ? "opacity-100" : "opacity-80 group-hover:opacity-100",
                )}
              />
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold text-bq-heading">
                  {asset.symbol}
                </span>
                <span className="block truncate font-plex text-[10px] uppercase tracking-[0.06em] text-bq-dim">
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
