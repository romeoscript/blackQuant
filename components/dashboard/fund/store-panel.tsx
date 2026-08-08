"use client";

import {
  Briefcase,
  ChartNoAxesColumn,
  Cpu,
  Headset,
  Shield,
  ShoppingBag,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Panel } from "@/components/dashboard/panel";
import { getBalanceUsd } from "@/app/balance-actions";
import { STORE_ITEMS, type StoreItem } from "./data";

const ICONS: Record<StoreItem["icon"], LucideIcon> = {
  cpu: Cpu,
  chart: ChartNoAxesColumn,
  headset: Headset,
  briefcase: Briefcase,
  shield: Shield,
};

export function StorePanel() {
  // The real balance, not a placeholder: a funding page that quotes a number
  // the deposit flow cannot produce teaches people not to trust either.
  const { data: balance = "0.00" } = useQuery({
    queryKey: ["balance"],
    queryFn: () => getBalanceUsd(),
  });

  const buy = (item: StoreItem) => {
    if (item.price > Number(balance)) {
      toast.error("Not enough balance", {
        description: `${item.name} costs $${item.price}. You have $${balance}. Deposit crypto to top up.`,
      });
      return;
    }
    toast("Store isn't live yet", {
      description: `${item.name} can't be purchased until checkout is wired up.`,
    });
  };

  return (
    <Panel className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-full bg-bq-surface text-bq-heading">
            <ShoppingBag className="size-3.5" />
          </span>
          <div>
            <h2 className="text-[13px] font-medium text-bq-heading">Store</h2>
            <p className="text-[11px] text-bq-dim">Purchase platform features and subscriptions</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 rounded-[14px] border border-bq-mint/20 bg-bq-mint/10 px-[13px] py-[7px] text-[11px]">
          <span className="font-plex font-semibold text-bq-mint">${balance}</span>
          <span className="text-bq-dim">available</span>
        </span>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {STORE_ITEMS.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <div key={item.name} className="rounded-[14px] border border-bq-border p-[17px]">
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-8 items-center justify-center rounded-full bg-bq-surface text-bq-heading">
                  <Icon className="size-3.5" />
                </span>
                {item.popular && (
                  <span className="rounded-lg bg-bq-mint/15 px-2 py-0.5 text-[11px] text-bq-mint">
                    Popular
                  </span>
                )}
              </div>
              <p className="mt-3 text-[13px] font-medium text-bq-heading">{item.name}</p>
              <p className="mt-0.5 text-[11px] text-bq-dim">In-app purchase</p>
              <div className="mt-5 flex items-center justify-between gap-3">
                <span className="text-[15px] font-bold text-bq-heading">${item.price}</span>
                <button
                  onClick={() => buy(item)}
                  className="flex items-center gap-1.5 rounded-[10px] bg-bq-heading px-[13px] py-[7px] text-[11px] font-bold text-bq-on-fill transition-transform hover:scale-[1.03] active:translate-y-px"
                >
                  <ShoppingCart className="size-3" /> Buy
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
