"use client";

import { useState } from "react";
import { CircleCheck, CircleAlert, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PLANS } from "./data";

export function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Signal Plan</h2>
          <p className="mt-1 text-[13px] text-bq-muted">
            Choose a subscription tier that fits your trading strategy.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-bq-border bg-bq-bg p-1">
          <button
            onClick={() => setAnnual(false)}
            className={cn(
              "rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors",
              !annual ? "bg-bq-surface text-white" : "text-bq-muted hover:text-bq-text",
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors",
              annual ? "bg-bq-surface text-white" : "text-bq-muted hover:text-bq-text",
            )}
          >
            Annual <span className="text-bq-mint">-20%</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#ff3b5c]/25 bg-[#ff3b5c]/[0.06] px-4 py-3">
        <p className="flex items-center gap-2.5 text-[13px] text-[#ff8496]">
          <CircleAlert className="size-4 shrink-0" />
          You have no active subscription. Fund your account to activate a plan.
        </p>
        <button
          onClick={() => toast("Fund Account", { description: "Funding flow coming soon." })}
          className="shrink-0 text-[13px] font-semibold text-[#ff6a83] transition-colors hover:text-[#ff8496]"
        >
          Fund Account
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              "relative flex flex-col rounded-2xl border bg-bq-card p-6",
              plan.featured ? "border-white/70" : "border-bq-border",
            )}
          >
            {plan.badge && (
              <span
                className={cn(
                  "absolute right-6 top-6 rounded-md px-2 py-0.5 text-[10px] font-semibold",
                  plan.featured ? "bg-white text-black" : "bg-bq-surface text-bq-muted",
                )}
              >
                {plan.badge}
              </span>
            )}
            <h3 className="text-[16px] font-bold text-white">{plan.name}</h3>
            <p className="mt-1 max-w-[85%] text-[12px] leading-relaxed text-bq-dim">{plan.blurb}</p>

            <p className="mt-5 flex items-baseline gap-1">
              <span className="text-[34px] font-bold leading-none text-white">
                ${annual ? plan.annual : plan.monthly}
              </span>
              <span className="text-[13px] text-bq-dim">/mo</span>
            </p>

            <ul className="mt-5 flex-1 space-y-2.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-[13px] text-bq-text">
                  <CircleCheck className={cn("size-4 shrink-0", plan.featured ? "text-bq-mint" : "text-bq-dim")} />
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => toast(`Activate ${plan.name}`, { description: "Fund your account to activate a plan." })}
              className={cn(
                "mt-6 flex items-center justify-center gap-2 rounded-lg py-2.5 text-[13px] font-semibold transition-colors",
                plan.featured
                  ? "bg-white text-black hover:bg-white/90"
                  : "border border-bq-border text-white hover:bg-bq-surface",
              )}
            >
              <Zap className="size-4" /> Activate
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
