"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  ChartNoAxesColumn,
  Check,
  Cpu,
  Headset,
  Loader2,
  Shield,
  ShoppingBag,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";
import { Panel } from "@/components/dashboard/panel";
import { StatPill } from "@/components/dashboard/widgets";
import { LoadError } from "@/components/dashboard/load-error";
import { useBalance } from "@/hooks/use-balance";
import { listEntitlements, purchaseItem } from "@/app/store-actions";
import { STORE_ITEMS, catalogueItem, type StoreItem } from "@/lib/catalogue";

const ICONS: Record<StoreItem["icon"], LucideIcon> = {
  cpu: Cpu,
  chart: ChartNoAxesColumn,
  headset: Headset,
  briefcase: Briefcase,
  shield: Shield,
};

export function StorePanel() {
  const { balanceUsd } = useBalance();
  const queryClient = useQueryClient();
  const [pendingItem, setPendingItem] = useState<string | null>(null);

  const {
    data: entitlements,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["entitlements"],
    queryFn: () => listEntitlements(),
  });

  const purchase = useMutation({
    mutationFn: purchaseItem,
    onSettled: () => setPendingItem(null),
    onSuccess: (result, itemId) => {
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message, {
        description: `$${catalogueItem(itemId)?.priceUsd} deducted from your balance.`,
      });
      // The balance, the entitlement and the notification all just changed.
      for (const queryKey of [["balance"], ["entitlements"], ["notifications"], ["treasury"], ["transactions"], ["control-center"]]) {
        queryClient.invalidateQueries({ queryKey });
      }
    },
    onError: () =>
      toast.error("We couldn't reach the server. Your balance is unchanged."),
  });

  const unavailable = isError || entitlements === null;

  return (
    <Panel className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-full bg-bq-surface text-bq-heading">
            <ShoppingBag className="size-3.5" />
          </span>
          <div>
            <h2 className="text-[13px] font-medium text-bq-heading">Store</h2>
            <p className="text-[11px] text-bq-dim">
              Paid from your balance, instantly
            </p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 rounded-[14px] border border-bq-mint/20 bg-bq-mint/10 px-[13px] py-[7px] text-[11px]">
          <span className="font-plex font-semibold text-bq-mint">
            ${balanceUsd ?? "—"}
          </span>
          <span className="text-bq-dim">available</span>
        </span>
      </div>

      {unavailable ? (
        <LoadError
          className="mt-4"
          message="We couldn't load the store."
          onRetry={() => refetch()}
        />
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {STORE_ITEMS.map((item) => {
            const held = entitlements?.find((e) => e.itemId === item.id);
            const affordable =
              balanceUsd !== null && Number(balanceUsd) >= item.priceUsd;

            return (
              <StoreCard
                key={item.id}
                item={item}
                held={held}
                affordable={affordable}
                loading={isPending}
                pending={pendingItem === item.id}
                onBuy={() => {
                  setPendingItem(item.id);
                  purchase.mutate(item.id);
                }}
              />
            );
          })}
        </div>
      )}
    </Panel>
  );
}

function StoreCard({
  item,
  held,
  affordable,
  loading,
  pending,
  onBuy,
}: {
  item: StoreItem;
  held: { expiresAt: string | null } | undefined;
  affordable: boolean;
  loading: boolean;
  pending: boolean;
  onBuy: () => void;
}) {
  const Icon = ICONS[item.icon];
  // Disabled while another purchase is in flight too: two debits racing is a
  // server concern, but the interface should not invite it.
  const disabled = Boolean(held) || pending || loading || !affordable;

  return (
    <div
      className={cn(
        "rounded-[14px] border p-[17px] transition-colors",
        held ? "border-bq-mint/30 bg-bq-mint/[0.04]" : "border-bq-border",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-8 items-center justify-center rounded-full bg-bq-surface text-bq-heading">
          <Icon className="size-3.5" />
        </span>
        {held ? (
          <StatPill tone="green">
            {held.expiresAt ? "Active" : "Owned"}
          </StatPill>
        ) : (
          item.popular && <StatPill tone="green">Popular</StatPill>
        )}
      </div>

      <p className="mt-3 text-[13px] font-medium text-bq-heading">
        {item.name}
        {item.period && (
          <span className="text-bq-dim"> · {item.period}</span>
        )}
      </p>
      <p className="mt-0.5 text-[11px] text-bq-dim">
        {held?.expiresAt
          ? `Renews ${formatDate(held.expiresAt)}`
          : item.detail}
      </p>

      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="text-[15px] font-bold text-bq-heading tabular-nums">
          ${item.priceUsd}
        </span>
        <button
          onClick={onBuy}
          disabled={disabled}
          // Named for what will happen, not for the control: someone who cannot
          // afford it should learn that from the button, not from a toast.
          className={cn(
            "flex items-center gap-1.5 rounded-[10px] px-[13px] py-[7px] text-[11px] font-bold transition-transform",
            held
              ? "bg-bq-mint/15 text-bq-mint"
              : affordable
                ? "bg-bq-heading text-bq-on-fill hover:scale-[1.03] active:translate-y-px"
                : "bg-bq-surface text-bq-dim",
            disabled && !held && "cursor-not-allowed",
          )}
        >
          {pending ? (
            <>
              <Loader2 className="size-3 animate-spin" /> Buying…
            </>
          ) : held ? (
            <>
              <Check className="size-3" /> {held.expiresAt ? "Active" : "Owned"}
            </>
          ) : affordable ? (
            <>
              <ShoppingCart className="size-3" /> Buy
            </>
          ) : (
            "Add funds"
          )}
        </button>
      </div>
    </div>
  );
}

