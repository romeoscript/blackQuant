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
import { toast } from "sonner";
import { Panel, usd } from "@/components/dashboard/panel";
import { STORE_BALANCE, STORE_ITEMS, type StoreItem } from "./data";

const ICONS: Record<StoreItem["icon"], LucideIcon> = {
  cpu: Cpu,
  chart: ChartNoAxesColumn,
  headset: Headset,
  briefcase: Briefcase,
  shield: Shield,
};

function buy(item: StoreItem) {
  if (item.price > STORE_BALANCE) {
    toast.error("Insufficient balance", {
      description: `${item.name} costs $${item.price}. Fund your account to complete this purchase.`,
    });
    return;
  }
  toast.success(`${item.name} purchased`, {
    description: `$${item.price} deducted from your BlackQuant balance.`,
  });
}

export function StorePanel() {
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
          <span className="font-semibold text-bq-mint">{usd(STORE_BALANCE)}</span>
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
                  className="flex items-center gap-1.5 rounded-[10px] bg-bq-heading px-[13px] py-[7px] text-[11px] font-bold text-[#0c0c0c] transition-transform hover:scale-[1.03] active:translate-y-px"
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
