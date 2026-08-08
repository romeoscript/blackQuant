"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Panel } from "@/components/dashboard/panel";
import { getDepositAddress } from "@/app/deposit-actions";
import type { DepositAssetInfo } from "@/lib/deposit";
import { CoinLogo } from "./coin-logo";

export function DepositAddressCard({ asset }: { asset: DepositAssetInfo }) {
  // Reset per asset, so acknowledging the tag on one chain never reveals
  // another's address unread.
  const [acknowledged, setAcknowledged] = useState(false);

  const { data, isPending } = useQuery({
    queryKey: ["deposit-address", asset.symbol],
    queryFn: () => getDepositAddress(asset.symbol),
    // An address is permanent; there is nothing to refetch it for.
    staleTime: Infinity,
    retry: false,
  });

  const needsTag = "sharedAddress" in asset && asset.sharedAddress === true;
  const hidden = needsTag && !acknowledged;

  return (
    <Panel className="overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-bq-border-soft px-5 py-4">
        <div className="flex items-center gap-3">
          <CoinLogo symbol={asset.symbol} className="size-9" />
          <div>
            <h2 className="text-[13px] font-medium text-bq-heading">
              Your {asset.symbol} deposit address
            </h2>
            <p className="mt-0.5 text-[11px] text-bq-dim">
              Permanent — reuse it for every {asset.symbol} deposit
            </p>
          </div>
        </div>
        <span
          style={{ backgroundColor: `${asset.color}14`, color: asset.color }}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-plex text-[10px] uppercase tracking-[0.08em]"
        >
          <span style={{ backgroundColor: asset.color }} className="size-1.5 rounded-full" />
          {asset.networkName}
        </span>
      </header>

      <div className="space-y-4 p-5">
        {needsTag && (
          <TagWarning
            acknowledged={acknowledged}
            onAcknowledge={setAcknowledged}
            symbol={asset.symbol}
          />
        )}

        {isPending ? (
          <Placeholder>
            <Loader2 className="size-3.5 animate-spin" /> Preparing your address…
          </Placeholder>
        ) : !data?.ok ? (
          // Never a fabricated address: with nothing to show, the card says so.
          <Placeholder>
            <TriangleAlert className="size-3.5 shrink-0 text-bq-warn-text" />
            {data?.message ?? "We couldn't load your deposit address."}
          </Placeholder>
        ) : hidden ? (
          <Placeholder>Confirm you understand the tag to reveal the address.</Placeholder>
        ) : (
          <>
            <div className="flex flex-col gap-4 sm:flex-row">
              <div
                className="size-[124px] shrink-0 self-start rounded-[14px] bg-white p-2.5 [&>svg]:size-full"
                // Encoded server-side from the address; no user input reaches it.
                dangerouslySetInnerHTML={{ __html: data.qrSvg }}
              />

              <div className="min-w-0 flex-1 space-y-3">
                <CopyField
                  label="Wallet address"
                  value={data.address}
                  accent={asset.color}
                />
                {data.extraId && (
                  <CopyField
                    label="Destination tag — required"
                    value={data.extraId}
                    accent="var(--color-bq-warn)"
                    emphasis
                  />
                )}

                <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-[14px] border border-bq-border bg-bq-border">
                  <Stat label="Confirmations" value={`${asset.confirmations} blocks`} />
                  <Stat label="First seen" value={asset.firstConfirmation} />
                  <Stat
                    label="Minimum"
                    value={
                      data.minAmount
                        ? `${trimZeros(data.minAmount)} ${asset.symbol}`
                        : "—"
                    }
                  />
                </dl>

                {/* Said here, before the deposit, rather than discovered
                    afterwards in a support ticket: we credit what arrives in
                    treasury, which is net of the processing fee. */}
                <p className="text-[11px] leading-relaxed text-bq-dim">
                  A processing fee is deducted when your deposit arrives, so the
                  amount credited to your balance is slightly less than the value
                  you send.
                </p>
              </div>
            </div>

            <p className="flex items-start gap-2.5 rounded-[14px] border border-bq-loss/15 bg-bq-loss/5 px-4 py-3 text-[11px] leading-relaxed text-bq-muted">
              <TriangleAlert className="mt-px size-3.5 shrink-0 text-bq-loss-text" />
              <span>
                <span className="font-medium text-bq-heading">
                  Send only {asset.symbol} over {asset.networkName}.
                </span>{" "}
                Another asset or another network cannot be recovered. Your
                balance updates after {asset.confirmations} confirmations.
              </span>
            </p>
          </>
        )}
      </div>
    </Panel>
  );
}

/**
 * On a shared-address chain the tag is the only thing identifying the sender, so
 * it gets the address's own weight — and the address stays hidden until the user
 * has said they understand that. Support volume, and unrecoverable deposits,
 * both come out of this box.
 */
function TagWarning({
  acknowledged,
  onAcknowledge,
  symbol,
}: {
  acknowledged: boolean;
  onAcknowledge: (v: boolean) => void;
  symbol: string;
}) {
  return (
    <div className="rounded-[14px] border border-bq-warn/40 bg-bq-warn/5 p-4">
      <p className="font-plex text-[10px] uppercase tracking-[0.12em] text-bq-warn-text">
        Destination tag required
      </p>
      <p className="mt-1.5 text-[11px] leading-relaxed text-bq-muted">
        Every BlackQuant user shares this {symbol} address. The destination tag
        is what identifies your account — {symbol} sent without it cannot be
        credited to you and may be unrecoverable.
      </p>
      <label className="mt-3 flex w-fit cursor-pointer items-center gap-2.5 text-[11px] text-bq-heading">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(e) => onAcknowledge(e.target.checked)}
          className="size-3.5 accent-bq-warn"
        />
        I understand I must include the destination tag.
      </label>
    </div>
  );
}

/**
 * The one string on this page that has to be exact. Monospaced, on its own
 * line, wrapping rather than truncating — a user comparing it against their
 * wallet needs to see every character, and an ellipsis hides the middle of an
 * address, which is where substitution attacks live.
 */
function CopyField({
  label,
  value,
  accent,
  emphasis,
}: {
  label: string;
  value: string;
  accent: string;
  emphasis?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div
      style={{ borderLeftColor: accent }}
      className={cn(
        "rounded-[14px] border border-l-[3px] border-bq-border bg-bq-bg px-3.5 py-2.5",
        emphasis && "border-bq-warn/40 bg-bq-warn/5",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-plex text-[10px] uppercase tracking-[0.08em] text-bq-dim">
          {label}
        </p>
        <button
          onClick={() => {
            navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast.success("Copied", { description: `${label} is on your clipboard.` });
          }}
          className="-my-1 flex shrink-0 items-center gap-1.5 rounded-[10px] border border-bq-border px-2 py-1 text-[11px] font-medium text-bq-heading transition-colors hover:bg-bq-surface"
        >
          {copied ? (
            <>
              <Check className="size-3 text-bq-mint" /> Copied
            </>
          ) : (
            <>
              <Copy className="size-3" /> Copy
            </>
          )}
        </button>
      </div>
      <code className="mt-1 block break-all font-plex text-[13px] leading-snug text-bq-heading">
        {value}
      </code>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bq-card px-3 py-2.5">
      <dt className="font-plex text-[10px] uppercase tracking-[0.06em] text-bq-dim">
        {label}
      </dt>
      <dd className="mt-0.5 truncate font-plex text-[12px] text-bq-heading">{value}</dd>
    </div>
  );
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-[14px] border border-dashed border-bq-border px-4 py-10 text-[12px] text-bq-muted">
      {children}
    </div>
  );
}

/** 0.00050000 reads as 0.0005; the trailing zeros are noise on a minimum. */
const trimZeros = (value: string) =>
  value.includes(".") ? value.replace(/\.?0+$/, "") : value;
