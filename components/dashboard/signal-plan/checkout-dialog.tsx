"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Loader2, TriangleAlert, Wallet } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CoinLogo } from "@/components/dashboard/fund/coin-logo";
import { DEPOSIT_ASSETS } from "@/lib/deposit";
import type { PlanItem } from "@/lib/catalogue";
import {
  purchaseItem,
  startCheckout,
  type CheckoutView,
} from "@/app/store-actions";

/**
 * Two ways to pay for one plan.
 *
 * Balance is the settled path — the money is already here, so activation is
 * immediate. Crypto raises a payment for the plan's price and activates it when
 * the network confirms, which is minutes rather than instant, and the dialog
 * says so rather than leaving someone watching a spinner.
 */
export function CheckoutDialog({
  plan,
  balanceUsd,
  onClose,
}: {
  plan: PlanItem;
  balanceUsd: string | null;
  onClose: () => void;
}) {
  const [checkout, setCheckout] = useState<CheckoutView | null>(null);
  const queryClient = useQueryClient();

  const affordable =
    balanceUsd !== null && Number(balanceUsd) >= plan.priceUsd;

  const payFromBalance = useMutation({
    mutationFn: () => purchaseItem(plan.id),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      for (const queryKey of [
        ["balance"],
        ["entitlements"],
        ["notifications"],
        ["transactions"],
        ["treasury"],
      ]) {
        queryClient.invalidateQueries({ queryKey });
      }
      onClose();
    },
    onError: () => toast.error("We couldn't reach the server."),
  });

  const payWithCrypto = useMutation({
    mutationFn: (currency: string) => startCheckout(plan.id, currency),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setCheckout(result);
    },
    onError: () => toast.error("We couldn't reach the server."),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-bq-border bg-bq-card p-6">
        <h2 className="text-[16px] font-bold text-bq-heading">
          {plan.name} · {plan.period}
        </h2>
        <p className="mt-1 text-[12px] text-bq-dim">
          ${plan.priceUsd} for {plan.days} days
        </p>

        {checkout ? (
          <CryptoInstructions checkout={checkout} />
        ) : (
          <div className="mt-5 space-y-3">
            <button
              onClick={() => payFromBalance.mutate()}
              disabled={!affordable || payFromBalance.isPending}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                affordable
                  ? "border-bq-border hover:border-primary/50"
                  : "cursor-not-allowed border-bq-border opacity-60",
              )}
            >
              <Wallet className="size-4 shrink-0 text-bq-muted" />
              <span className="flex-1">
                <span className="block text-[13px] font-medium text-bq-heading">
                  Pay from balance
                </span>
                <span className="block text-[11px] text-bq-dim">
                  {balanceUsd === null
                    ? "Balance unavailable"
                    : affordable
                      ? `$${balanceUsd} available · activates now`
                      : `$${balanceUsd} available — $${(plan.priceUsd - Number(balanceUsd)).toFixed(2)} short`}
                </span>
              </span>
              {payFromBalance.isPending && (
                <Loader2 className="size-4 animate-spin text-bq-muted" />
              )}
            </button>

            <div>
              <p className="text-[11px] text-bq-dim">Or pay with crypto</p>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {DEPOSIT_ASSETS.map((asset) => (
                  <button
                    key={asset.symbol}
                    onClick={() => payWithCrypto.mutate(asset.currency)}
                    disabled={payWithCrypto.isPending}
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-bq-border p-2.5 transition-colors hover:border-primary/50 disabled:opacity-60"
                  >
                    <CoinLogo symbol={asset.symbol} className="size-6" />
                    <span className="text-[10px] text-bq-muted">{asset.symbol}</span>
                  </button>
                ))}
              </div>
              {payWithCrypto.isPending && (
                <p className="mt-2 flex items-center gap-2 text-[11px] text-bq-dim">
                  <Loader2 className="size-3 animate-spin" /> Preparing payment…
                </p>
              )}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-lg border border-bq-border py-2 text-[12px] text-bq-muted transition-colors hover:text-bq-heading"
        >
          {checkout ? "Done" : "Cancel"}
        </button>
      </div>
    </div>
  );
}

function CryptoInstructions({ checkout }: { checkout: CheckoutView }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="mt-5 space-y-3">
      <div className="flex gap-4">
        <div
          className="size-24 shrink-0 rounded-xl bg-white p-2 [&>svg]:size-full"
          // Encoded server-side from the address; no user input reaches it.
          dangerouslySetInnerHTML={{ __html: checkout.qrSvg }}
        />
        <div className="min-w-0 flex-1">
          <p className="font-plex text-[10px] uppercase tracking-[0.08em] text-bq-dim">
            Send exactly
          </p>
          <p className="font-plex text-[15px] font-semibold text-bq-heading">
            {checkout.payAmount} {checkout.payCurrency}
          </p>
          <p className="mt-1 text-[11px] text-bq-dim">
            Covers ${checkout.priceUsd} plus the network fee.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-bq-border bg-bq-bg p-3">
        <p className="font-plex text-[10px] uppercase tracking-[0.08em] text-bq-dim">
          Address
        </p>
        <code className="mt-1 block break-all font-plex text-[12px] text-bq-heading">
          {checkout.address}
        </code>
        <button
          onClick={() => {
            navigator.clipboard.writeText(checkout.address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="mt-2 flex items-center gap-1.5 text-[11px] text-primary"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? "Copied" : "Copy address"}
        </button>
      </div>

      {checkout.extraId && (
        <div className="rounded-xl border border-bq-warn/40 bg-bq-warn/5 p-3">
          <p className="font-plex text-[10px] uppercase tracking-[0.08em] text-bq-warn-text">
            Destination tag — required
          </p>
          <code className="mt-1 block font-plex text-[15px] font-medium text-bq-heading">
            {checkout.extraId}
          </code>
          <p className="mt-1 text-[11px] text-bq-muted">
            Sent without it, the payment cannot be matched to your account.
          </p>
        </div>
      )}

      <p className="flex items-start gap-2 rounded-xl border border-bq-border px-3 py-2.5 text-[11px] leading-relaxed text-bq-dim">
        <TriangleAlert className="mt-px size-3.5 shrink-0 text-bq-warn-text" />
        Your plan activates once the network confirms — usually minutes. You can
        close this; it does not need to stay open.
      </p>
    </div>
  );
}
