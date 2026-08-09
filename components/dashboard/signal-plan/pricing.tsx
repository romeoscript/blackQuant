"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CircleCheck, CircleAlert, Zap } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { PLAN_ITEMS, type PlanItem } from "@/lib/catalogue";
import { useBalance } from "@/hooks/use-balance";
import { listEntitlements } from "@/app/store-actions";
import { CheckoutDialog } from "./checkout-dialog";

export function PricingSection() {
  const [annual, setAnnual] = useState(false);
  const [checkingOut, setCheckingOut] = useState<PlanItem | null>(null);
  const { balanceUsd } = useBalance();

  const { data: entitlements } = useQuery({
    queryKey: ["entitlements"],
    queryFn: () => listEntitlements(),
  });

  const period = annual ? "Annual" : "Monthly";
  const plans = PLAN_ITEMS.filter((plan) => plan.period === period);
  const active = (entitlements ?? []).find((held) =>
    PLAN_ITEMS.some((plan) => plan.id === held.itemId),
  );
  const activePlan = active && PLAN_ITEMS.find((p) => p.id === active.itemId);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-bq-heading">Signal Plan</h2>
          <p className="mt-1 text-[13px] text-bq-muted">
            Choose a subscription tier that fits your trading strategy.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-bq-border bg-bq-bg p-1">
          <button
            onClick={() => setAnnual(false)}
            className={cn(
              "rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors",
              !annual ? "bg-bq-surface text-bq-heading" : "text-bq-muted hover:text-bq-text",
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors",
              annual ? "bg-bq-surface text-bq-heading" : "text-bq-muted hover:text-bq-text",
            )}
          >
            Annual <span className="text-bq-mint">-20%</span>
          </button>
        </div>
      </div>

      {activePlan ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-bq-mint/25 bg-bq-mint/[0.06] px-4 py-3">
          <p className="flex items-center gap-2.5 text-[13px] text-bq-mint">
            <CircleCheck className="size-4 shrink-0" />
            {activePlan.name} is active
            {active?.expiresAt ? ` until ${formatDate(active.expiresAt)}` : ""}.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-bq-loss/25 bg-bq-loss/[0.06] px-4 py-3">
          <p className="flex items-center gap-2.5 text-[13px] text-bq-loss-strong">
            <CircleAlert className="size-4 shrink-0" />
            No active subscription. Pay from your balance, or with crypto.
          </p>
          <Link
            href="/dashboard/fund"
            className="shrink-0 text-[13px] font-semibold text-bq-loss-text transition-colors hover:text-bq-loss-strong"
          >
            Add funds
          </Link>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              "relative flex flex-col rounded-2xl border bg-bq-card p-6",
              plan.popular ? "border-bq-contrast/70" : "border-bq-border",
            )}
          >
            {plan.badge && (
              <span
                className={cn(
                  "absolute right-6 top-6 rounded-md px-2 py-0.5 text-[10px] font-semibold",
                  plan.popular ? "bg-bq-contrast text-bq-on-fill" : "bg-bq-surface text-bq-muted",
                )}
              >
                {plan.badge}
              </span>
            )}
            <h3 className="text-[16px] font-bold text-bq-heading">{plan.name}</h3>
            <p className="mt-1 max-w-[85%] text-[12px] leading-relaxed text-bq-dim">{plan.detail}</p>

            <p className="mt-5 flex items-baseline gap-1">
              <span className="text-[34px] font-bold leading-none text-bq-heading">
                ${plan.priceUsd}
              </span>
              <span className="text-[13px] text-bq-dim">
                {annual ? "/year" : "/month"}
              </span>
            </p>

            <ul className="mt-5 flex-1 space-y-2.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-[13px] text-bq-text">
                  <CircleCheck className={cn("size-4 shrink-0", plan.popular ? "text-bq-mint" : "text-bq-dim")} />
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => setCheckingOut(plan)}
              disabled={Boolean(activePlan)}
              className={cn(
                "mt-6 flex items-center justify-center gap-2 rounded-lg py-2.5 text-[13px] font-semibold transition-colors",
                activePlan
                  ? "cursor-not-allowed border border-bq-border text-bq-dim"
                  : plan.popular
                    ? "bg-bq-contrast text-bq-on-fill hover:bg-bq-contrast/90"
                    : "border border-bq-border text-bq-heading hover:bg-bq-surface",
              )}
            >
              {activePlan?.id === plan.id ? (
                <>
                  <CircleCheck className="size-4" /> Active
                </>
              ) : (
                <>
                  <Zap className="size-4" /> Activate
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {checkingOut && (
        <CheckoutDialog
          plan={checkingOut}
          balanceUsd={balanceUsd}
          onClose={() => setCheckingOut(null)}
        />
      )}
    </div>
  );
}
