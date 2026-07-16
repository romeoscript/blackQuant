"use client";

import Link from "next/link";
import { Check, CirclePlus, Lock, Minus, RefreshCw, Shield, Wallet, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { usd } from "@/components/dashboard/panel";
import {
  ANNUAL_DISCOUNT,
  COMPARISON,
  PLANS,
  TRIAL_DAYS,
  monthlyRate,
  trialCredit,
  type Billing,
  type Plan,
} from "./data";

function CheckDot({ featured }: { featured: boolean }) {
  return (
    <span
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-full",
        featured ? "bg-white/20 text-bq-heading" : "bg-bq-surface text-bq-dim",
      )}
    >
      <Check className="size-2.5" strokeWidth={3} />
    </span>
  );
}

function ComparisonCell({ value, selected }: { value: string | boolean; selected: boolean }) {
  if (typeof value === "boolean") {
    return (
      <span
        className={cn(
          "mx-auto flex size-4 items-center justify-center rounded-full",
          value ? "bg-bq-heading text-[#0c0c0c]" : "bg-bq-surface text-bq-dim",
        )}
      >
        {value ? <Check className="size-2.5" strokeWidth={3} /> : <Minus className="size-2.5" strokeWidth={3} />}
      </span>
    );
  }
  return (
    <span className={cn("text-center text-[11px]", selected ? "font-medium text-bq-heading" : "text-bq-dim")}>
      {value}
    </span>
  );
}

const REASSURANCES = [
  { icon: Shield, label: "Cancel anytime, no penalty" },
  { icon: Lock, label: "Secure payment via BlackQuant balance" },
  { icon: RefreshCw, label: "Auto-renews monthly, cancel before cycle" },
];

const row4 = "grid grid-cols-[1.2fr_1fr_1fr_1fr] items-center px-3";

export function ActivateView({
  plan,
  billing,
  onPlan,
  onBilling,
  onActivate,
}: {
  plan: Plan;
  billing: Billing;
  onPlan: (plan: Plan) => void;
  onBilling: (billing: Billing) => void;
  onActivate: () => void;
}) {
  const rate = monthlyRate(plan, billing);
  const credit = trialCredit(plan, billing);
  const planLine = billing === "monthly" ? usd(plan.monthly) : usd(plan.monthly * 12);
  const discount = billing === "monthly" ? 0 : plan.monthly * 12 * ANNUAL_DISCOUNT;
  const chargeLabel =
    billing === "monthly" ? `${usd(plan.monthly)}/mo` : `${usd(plan.monthly * 12 - discount)}/yr`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-[14px] border border-white/15 bg-white/5 px-5 py-3.5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-bq-heading">
          <Zap className="size-3.5 fill-current" />
        </span>
        <p className="min-w-0 flex-1 text-[11px] leading-relaxed text-bq-heading">
          Choose a plan below to unlock signals, positions, and the full BlackQuant trading suite.
          You can upgrade or cancel at any time.
        </p>
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-bq-heading">Inactive</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[13px] font-medium text-bq-heading">Select a Subscription Plan</h2>
          <p className="mt-0.5 text-[11px] text-bq-dim">
            All plans include a {TRIAL_DAYS}-day free trial. No charges until trial ends.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-[14px] bg-bq-surface p-1">
          {(["monthly", "annual"] as const).map((b) => (
            <button
              key={b}
              onClick={() => onBilling(b)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] capitalize transition-colors",
                billing === b ? "bg-white/[0.07] font-medium text-bq-heading" : "text-bq-dim",
              )}
            >
              {b}
              {b === "annual" && <span className="font-medium text-bq-mint">-20%</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {PLANS.map((p) => {
          const selected = p.id === plan.id;
          return (
            <div
              key={p.id}
              onClick={() => onPlan(p)}
              className={cn(
                "relative flex cursor-pointer flex-col rounded-3xl border p-[21px] transition-colors",
                selected ? "border-bq-heading" : "border-bq-border hover:border-bq-surface",
              )}
            >
              {p.badge && (
                <span
                  className={cn(
                    "absolute right-4 top-4 rounded-lg px-2 py-0.5 text-[11px]",
                    p.badge === "Most Popular"
                      ? "bg-bq-heading text-[#0c0c0c]"
                      : "bg-bq-surface text-bq-dim",
                  )}
                >
                  {p.badge}
                </span>
              )}
              <h3 className="text-[13px] font-medium text-bq-heading">{p.name}</h3>
              <p className="mt-1 max-w-[85%] text-[11px] leading-relaxed text-bq-dim">{p.tagline}</p>
              <p className="mt-4 flex items-baseline gap-1">
                <span className="text-[32px] font-bold leading-none text-bq-heading">
                  ${Math.round(monthlyRate(p, billing))}
                </span>
                <span className="text-[11px] text-bq-dim">/mo</span>
              </p>
              <ul className="mt-5 flex-1 space-y-2">
                {p.features.map((f) => (
                  <li key={f.label} className="flex items-center gap-2 text-[11px] text-bq-dim">
                    <CheckDot featured={selected} /> {f.label}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => onPlan(p)}
                className={cn(
                  "mt-4 flex items-center justify-center gap-2 rounded-[14px] py-2.5 text-[11px] font-bold transition-colors",
                  selected
                    ? "bg-bq-heading text-[#0c0c0c]"
                    : "border border-bq-border text-bq-heading hover:bg-bq-surface",
                )}
              >
                <Zap className="size-3 fill-current" /> Activate
              </button>
            </div>
          );
        })}
      </div>

      <div className="rounded-3xl border border-bq-border p-[21px]">
        <h3 className="text-[13px] font-medium text-bq-heading">Feature Comparison</h3>
        <div className={cn(row4, "mt-4 rounded-[14px] bg-bq-surface py-2")}>
          <span className="text-[11px] font-medium text-bq-dim">Feature</span>
          {PLANS.map((p) => (
            <span
              key={p.id}
              className={cn(
                "text-center text-[11px] font-medium",
                p.id === plan.id ? "text-bq-heading" : "text-bq-dim",
              )}
            >
              {p.name}
            </span>
          ))}
        </div>
        {COMPARISON.map((row, i) => (
          <div
            key={row.feature}
            className={cn(row4, "py-2.5", i % 2 === 0 && "rounded-lg bg-bq-surface/40")}
          >
            <span className="text-[11px] text-bq-dim">{row.feature}</span>
            {row.values.map((value, col) => (
              <ComparisonCell key={col} value={value} selected={PLANS[col].id === plan.id} />
            ))}
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="rounded-3xl border border-bq-border p-[21px]">
          <h3 className="text-[13px] font-medium text-bq-heading">Order Summary</h3>
          <p className="mt-0.5 text-[11px] text-bq-dim">Review before confirming.</p>

          <div className="mt-4 flex items-center gap-3 rounded-3xl border border-bq-heading bg-bq-surface/30 px-4 py-3.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-bq-heading">
              <Zap className="size-3.5 fill-current" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-bq-heading">{plan.name} Plan</p>
              <p className="text-[11px] text-bq-dim">
                {billing === "monthly" ? "Monthly" : "Annual"} billing
              </p>
            </div>
            <span className="text-[15px] font-bold text-bq-heading">${Math.round(rate)}</span>
          </div>

          <div className="mt-3">
            {[
              { label: "Plan", value: planLine },
              { label: "Discount", value: discount ? `-${usd(discount)}` : usd(0) },
              { label: `Trial credit (${TRIAL_DAYS} days)`, value: `-${usd(credit)}`, mint: true },
            ].map((line) => (
              <div
                key={line.label}
                className="flex items-center justify-between border-b border-bq-border-soft py-2.5 text-[11px]"
              >
                <span className="text-bq-dim">{line.label}</span>
                <span className={line.mint ? "font-medium text-bq-mint" : "font-medium text-bq-heading"}>
                  {line.value}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between py-3">
              <span className="text-[11px] font-bold text-bq-heading">Due today</span>
              <span className="text-[15px] font-bold text-bq-heading">{usd(0)}</span>
            </div>
          </div>

          <p className="max-w-[260px] text-[11px] leading-relaxed text-bq-dim">
            After your {TRIAL_DAYS}-day trial, {chargeLabel} will be deducted from your BlackQuant
            balance.
          </p>

          <button
            onClick={onActivate}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-[14px] bg-bq-heading py-3 text-[11px] font-bold text-[#0c0c0c] transition-transform hover:scale-[1.01] active:translate-y-px"
          >
            <Zap className="size-3.5 fill-current" /> Activate {plan.name} Plan
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-bq-border p-[21px]">
            <h3 className="text-[13px] font-medium text-bq-heading">Payment source</h3>
            <div className="mt-3 flex items-center gap-3 rounded-[14px] border border-bq-border p-4">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-bq-surface text-bq-heading">
                <Wallet className="size-3.5" />
              </span>
              <div>
                <p className="text-[11px] font-medium text-bq-heading">BlackQuant Balance</p>
                <p className="text-[11px] text-bq-dim">Available: {usd(0)}</p>
              </div>
            </div>
            <Link
              href="/dashboard/fund"
              className="mt-3.5 flex items-center gap-1.5 text-[11px] text-bq-dim transition-colors hover:text-white"
            >
              <CirclePlus className="size-3" /> Fund account to add balance
            </Link>
          </div>

          <div className="space-y-2.5 rounded-3xl border border-bq-border p-[17px]">
            {REASSURANCES.map((r) => (
              <div key={r.label} className="flex items-center gap-2.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-bq-surface text-bq-heading">
                  <r.icon className="size-2.5" />
                </span>
                <span className="text-[11px] text-bq-dim">{r.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
