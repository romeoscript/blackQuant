"use client";

import { Panel } from "@/components/dashboard/panel";
import { DonutChart } from "@/components/dashboard/charts";
import type { AssetDeposits } from "@/lib/treasury";

/** Compact enough for the donut's centre: $1,505 reads as $1.5K. */
const short = (usd: number) =>
  usd >= 1000 ? `$${(usd / 1000).toFixed(1)}K` : `$${usd.toFixed(0)}`;

export function AllocationCard({
  assets,
  totalUsd,
}: {
  assets: AssetDeposits[];
  totalUsd: string;
}) {
  return (
    <Panel className="flex flex-col p-5">
      <div>
        <h2 className="text-[15px] font-semibold text-bq-heading">
          Where your balance came from
        </h2>
        <p className="text-[12px] text-bq-dim">By dollars credited</p>
      </div>

      {assets.length === 0 ? (
        <p className="my-8 text-center text-[13px] text-bq-muted">
          Nothing to chart until your first deposit is credited.
        </p>
      ) : (
        <div className="mt-4 flex items-center gap-5">
          <DonutChart
            size={128}
            thickness={15}
            label={short(Number(totalUsd))}
            segments={assets.map((a) => ({ value: a.share, color: a.color }))}
          />
          <div className="flex-1 space-y-2.5">
            {assets.map((asset) => (
              <div key={asset.symbol} className="flex items-center gap-2 text-[12px]">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: asset.color }}
                />
                <span className="flex-1 text-bq-text">{asset.symbol}</span>
                <span className="text-bq-dim tabular-nums">${asset.usdCredited}</span>
                <span className="w-8 text-right font-semibold text-bq-heading tabular-nums">
                  {asset.share}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}
