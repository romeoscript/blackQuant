"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Panel } from "@/components/dashboard/panel";
import { CoinLogo } from "@/components/dashboard/fund/coin-logo";
import type { AssetDeposits } from "@/lib/treasury";

/**
 * What the account has been funded with, per asset.
 *
 * Deliberately not "holdings": deposits are converted on arrival and credited
 * as dollars, so nobody holds BTC here. This is the record of what was sent in
 * and what it credited — true, and the closest honest thing to a portfolio
 * until the product actually holds assets.
 */
export function DepositsByAssetCard({
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
          Deposits by asset
        </h2>
        <p className="text-[12px] text-bq-dim">
          What you sent, and what it credited
        </p>
      </div>

      {assets.length === 0 ? (
        <div className="my-8 flex flex-col items-center gap-1">
          <p className="text-[13px] text-bq-muted">No deposits yet</p>
          <Link
            href="/dashboard/fund"
            className="flex items-center gap-1 text-[12px] text-primary transition-opacity hover:opacity-80"
          >
            Fund your account <ArrowRight className="size-3" />
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-4 hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-bq-border-soft hover:bg-transparent">
                  <TableHead className={TH}>Asset</TableHead>
                  <TableHead className={TH}>Received</TableHead>
                  <TableHead className={TH}>Credited</TableHead>
                  <TableHead className={TH}>Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow
                    key={asset.symbol}
                    className="border-bq-border-soft hover:bg-bq-surface/30"
                  >
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-3">
                        <CoinLogo symbol={asset.symbol} className="size-8" />
                        <div>
                          <p className="text-[13px] font-semibold text-bq-heading">
                            {asset.symbol}
                          </p>
                          <p className="text-[11px] text-bq-dim">{asset.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-plex text-[13px] text-bq-heading tabular-nums">
                        {asset.amount}
                      </p>
                      <p className="text-[11px] text-bq-dim">{asset.symbol}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-[13px] font-medium text-bq-heading tabular-nums">
                        ${asset.usdCredited}
                      </p>
                    </TableCell>
                    <TableCell>
                      <ShareBar share={asset.share} color={asset.color} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-col md:hidden">
            {assets.map((asset) => (
              <div
                key={asset.symbol}
                className="flex items-center gap-3 border-b border-bq-border-soft py-3 last:border-0"
              >
                <CoinLogo symbol={asset.symbol} className="size-8" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-semibold text-bq-heading">
                      {asset.symbol}
                    </p>
                    <p className="text-[13px] font-medium text-bq-heading tabular-nums">
                      ${asset.usdCredited}
                    </p>
                  </div>
                  <p className="font-plex text-[11px] text-bq-dim">
                    {asset.amount} {asset.symbol}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-auto flex items-center justify-between border-t border-bq-border-soft pt-4">
        <span className="text-[12px] text-bq-dim">Total credited</span>
        <span className="text-[15px] font-bold text-bq-heading tabular-nums">
          ${totalUsd}
        </span>
      </div>
    </Panel>
  );
}

const TH = "h-9 px-0 text-[10px] font-medium uppercase tracking-[1px] text-bq-dim";

function ShareBar({ share, color }: { share: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 w-full max-w-[120px] overflow-hidden rounded-full bg-bq-border">
        <div
          className="h-full rounded-full"
          style={{ width: `${share}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-[12px] text-bq-muted tabular-nums">
        {share}%
      </span>
    </div>
  );
}
