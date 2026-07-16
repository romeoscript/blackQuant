"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  CircleArrowDown,
  CircleArrowUp,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AssetSelectCard } from "@/components/dashboard/fund/asset-select-card";
import { DepositAddressCard } from "@/components/dashboard/fund/deposit-address-card";
import { HelpCard, RecentDepositsCard } from "@/components/dashboard/fund/side-cards";
import { StorePanel } from "@/components/dashboard/fund/store-panel";
import { DEPOSIT_ASSETS } from "@/components/dashboard/fund/data";

const TABS: { id: "deposit" | "store"; label: string; icon: LucideIcon }[] = [
  { id: "deposit", label: "Deposit Crypto", icon: CircleArrowDown },
  { id: "store", label: "Store", icon: ShoppingBag },
];

export default function FundAccountPage() {
  const [tab, setTab] = useState<"deposit" | "store">("deposit");
  const [asset, setAsset] = useState(DEPOSIT_ASSETS[0]);

  return (
    <div className="space-y-4 lg:space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Fund Account</h1>
          <p className="mt-1 flex items-center gap-1 text-[13px] text-bq-muted">
            BlackQuant <ChevronRight className="size-3.5" />{" "}
            <span className="text-bq-text">Fund Account</span>
          </p>
        </div>
        <Link
          href="/dashboard/withdrawals"
          className="flex items-center gap-2 rounded-full border border-bq-border px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-bq-surface"
        >
          <CircleArrowUp className="size-4" /> Withdraw Instead
        </Link>
      </div>

      <div className="flex gap-6 border-b border-bq-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "-mb-px flex items-center gap-2 border-b-2 px-1 pb-3 text-[13px] font-medium transition-colors",
              tab === t.id
                ? "border-white text-white"
                : "border-transparent text-bq-dim hover:text-bq-text",
            )}
          >
            <t.icon className="size-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "deposit" && (
        <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
          <div className="space-y-4 lg:col-span-2 lg:space-y-5">
            <AssetSelectCard selected={asset} onSelect={setAsset} />
            <DepositAddressCard asset={asset} />
          </div>
          <div className="space-y-4 lg:space-y-5">
            <RecentDepositsCard />
            <HelpCard />
          </div>
        </div>
      )}

      <StorePanel />
    </div>
  );
}
