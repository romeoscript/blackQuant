"use client";

import { Copy, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Panel } from "@/components/dashboard/panel";
import type { DepositAsset } from "./data";

// Deterministic dot-matrix derived from the address (SSR-safe stand-in for a QR code).
function QrPattern({ address }: { address: string }) {
  const cells = Array.from(
    { length: 64 },
    (_, i) => (address.charCodeAt(i % address.length) * (i + 3)) % 5 < 2,
  );
  return (
    <div className="flex w-28 shrink-0 flex-col items-center justify-center gap-2 rounded-[14px] bg-[#0c0c0c] p-3">
      <div className="grid grid-cols-8 gap-1">
        {cells.map((on, i) => (
          <span
            key={i}
            className="size-2 rounded-[3px] bg-bq-heading"
            style={{ opacity: on ? 1 : 0 }}
          />
        ))}
      </div>
      <span className="text-[9px] text-bq-dim">Scan QR</span>
    </div>
  );
}

const STATS = [
  { label: "Min. Deposit", key: "minDeposit" },
  { label: "Confirmations", key: "confirmations" },
  { label: "Network Fee", key: "fee" },
  { label: "Est. Arrival", key: "arrival" },
] as const;

export function DepositAddressCard({ asset }: { asset: DepositAsset }) {
  function copyAddress() {
    navigator.clipboard.writeText(asset.address);
    toast.success("Address copied", { description: `${asset.symbol} deposit address is on your clipboard.` });
  }

  return (
    <Panel className="space-y-4 p-5">
      <div className="flex flex-col gap-4 sm:flex-row">
        <QrPattern address={asset.address} />
        <div className="min-w-0 flex-1 space-y-2.5">
          <p className="text-[11px] text-bq-dim">Wallet Address</p>
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate rounded-[14px] border border-bq-border bg-bq-surface px-[13px] py-[11px] text-[11px] text-bq-heading">
              {asset.address}
            </p>
            <button
              onClick={copyAddress}
              className="flex shrink-0 items-center gap-1.5 rounded-[14px] border border-bq-border px-[13px] py-[11px] text-[11px] font-medium text-bq-heading transition-colors hover:bg-bq-surface"
            >
              <Copy className="size-3" /> Copy
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-[14px] border border-bq-border bg-[#0c0c0c] p-[11px]">
                <p className="text-[10px] text-bq-dim">{s.label}</p>
                <p className="mt-0.5 text-[12px] font-medium text-bq-heading">{asset[s.key]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-bq-heading">Your {asset.symbol} Deposit Address</p>
          <p className="mt-0.5 text-[11px] text-bq-dim">
            {asset.networkName} — send only {asset.symbol} to this address
          </p>
        </div>
        <span
          style={{ backgroundColor: `${asset.color}17`, color: asset.color }}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px]"
        >
          <span style={{ backgroundColor: asset.color }} className="size-1.5 rounded-full" />
          {asset.symbol}
        </span>
      </div>

      <div className="flex items-center gap-2.5 rounded-[14px] border border-[#ff3b5c]/15 bg-[#ff3b5c]/5 px-4 py-3">
        <TriangleAlert className="size-3 shrink-0 text-[#ff6a83]" />
        <p className="text-[11px] text-bq-dim">
          Only send {asset.symbol} to this address. Sending any other asset will result in permanent
          loss of funds.
        </p>
      </div>
    </Panel>
  );
}
