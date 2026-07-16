"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CircleArrowDown,
  CircleArrowUp,
  CircleX,
  Clock,
  Cpu,
  Shield,
  TrendingUp,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { usd } from "@/components/dashboard/panel";
import {
  ANNUAL_DISCOUNT,
  TRIAL_DAYS,
  monthlyRate,
  nextBillingDate,
  trialCredit,
  type Billing,
  type Plan,
} from "./data";

function setupSteps(plan: Plan): {
  icon: LucideIcon;
  title: string;
  desc: string;
  cta: string;
  href: string;
}[] {
  return [
    {
      icon: CircleArrowDown,
      title: "Fund Your Account",
      desc: "Add balance to your BlackQuant wallet to cover your first billing cycle and start trading.",
      cta: "Fund Now",
      href: "/dashboard/fund",
    },
    {
      icon: BadgeCheck,
      title: "Complete Verification",
      desc: "Submit your identity documents to unlock higher withdrawal limits.",
      cta: "Verify Identity",
      href: "/dashboard/verification",
    },
    {
      icon: Shield,
      title: "Enable 2FA",
      desc: "Secure your account by configuring two-factor authentication.",
      cta: "Set Up 2FA",
      href: "/dashboard/2fa",
    },
    {
      icon: Cpu,
      title: "Explore Signal Engine",
      desc: `Your ${plan.name} plan includes ${plan.signalsPerDay}. Activate your first strategy now.`,
      cta: "Open Signal Engine",
      href: "/dashboard/signal-engine",
    },
  ];
}

export function ActivatedView({
  plan,
  billing,
  onUpgrade,
  onCancel,
}: {
  plan: Plan;
  billing: Billing;
  onUpgrade: () => void;
  onCancel: () => void;
}) {
  const rate = monthlyRate(plan, billing);
  const credit = trialCredit(plan, billing);
  const nextBilling = nextBillingDate();
  const planLine =
    billing === "monthly"
      ? `${usd(plan.monthly)}/mo`
      : `${usd(plan.monthly * 12 * (1 - ANNUAL_DISCOUNT))}/yr`;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-bq-border p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row">
          <div className="flex items-start gap-6">
            <span className="flex size-[68px] shrink-0 items-center justify-center rounded-full bg-bq-mint/5">
              <span className="flex size-10 items-center justify-center rounded-full bg-[#0f3128] text-bq-mint">
                <TrendingUp className="size-4" />
              </span>
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold text-white">{plan.name} Plan Activated!</h2>
                <span className="rounded-full bg-bq-mint/15 px-2.5 py-1 text-[11px] text-bq-mint">
                  Active
                </span>
              </div>
              <p className="mt-1.5 max-w-[340px] text-[12px] leading-relaxed text-bq-dim">
                Your subscription is now live. Signals, positions, and analytics are fully unlocked.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-center gap-3">
            <Link
              href="/dashboard/signal-engine"
              className="flex items-center gap-2 rounded-[14px] bg-bq-heading px-5 py-2.5 text-[11px] font-bold text-[#0c0c0c] transition-transform hover:scale-[1.02] active:translate-y-px"
            >
              <Cpu className="size-3.5" /> Go to Signal Engine
            </Link>
            <button
              onClick={() =>
                toast("Subscription details", {
                  description: `${plan.name} plan · ${planLine} · next billing ${nextBilling}.`,
                })
              }
              className="text-[11px] text-bq-dim transition-colors hover:text-white"
            >
              View subscription details
            </button>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-x-14 gap-y-2 border-t border-bq-border-soft pt-4">
          <span className="flex items-center gap-1.5 text-[11px] text-bq-dim">
            <CalendarDays className="size-3" /> Next billing: {nextBilling}
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-bq-dim">
            <Zap className="size-3" /> Plan: {plan.name} — ${Math.round(rate)}/mo
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-bq-mint">
            <Clock className="size-3" /> Free trial ends in {TRIAL_DAYS} days
          </span>
        </div>
      </div>

      <div>
        <h2 className="text-[13px] font-medium text-bq-heading">Complete Your Setup</h2>
        <p className="mt-0.5 text-[11px] text-bq-dim">
          A few more steps to get the most out of your {plan.name} plan.
        </p>
        <div className="mt-4 space-y-3">
          {setupSteps(plan).map((step) => (
            <div
              key={step.title}
              className="flex flex-wrap items-center gap-4 rounded-[14px] border border-bq-border p-[21px]"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-bq-surface text-bq-heading">
                <step.icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-bq-heading">{step.title}</p>
                <p className="mt-0.5 text-[11px] text-bq-dim">{step.desc}</p>
              </div>
              <Link
                href={step.href}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-bq-border px-3.5 py-1.5 text-[11px] font-medium text-bq-heading transition-colors hover:bg-bq-surface"
              >
                {step.cta} <ArrowRight className="size-3" />
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col rounded-3xl border border-bq-border p-[21px]">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[13px] font-bold text-bq-heading">Your Plan</h3>
            <span className="rounded-lg bg-bq-mint/15 px-2 py-0.5 text-[11px] text-bq-mint">
              {plan.name}
            </span>
          </div>
          <p className="mt-3 flex items-baseline gap-1">
            <span className="text-[32px] font-bold leading-none text-bq-heading">
              ${Math.round(rate)}
            </span>
            <span className="text-[11px] text-bq-dim">/mo</span>
          </p>
          <ul className="mt-4 flex-1 space-y-2 border-t border-bq-border-soft pt-3.5">
            {plan.features.map((f) => (
              <li key={f.label} className="flex items-center gap-2.5 text-[11px] text-bq-heading">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <f.icon className="size-2.5" />
                </span>
                {f.label}
              </li>
            ))}
          </ul>
          {plan.id !== "elite" && (
            <button
              onClick={onUpgrade}
              className="mt-4 flex items-center justify-center gap-2 rounded-[14px] border border-bq-border py-2.5 text-[11px] font-medium text-bq-heading transition-colors hover:bg-bq-surface"
            >
              <CircleArrowUp className="size-3" /> Upgrade to Elite
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-bq-border p-[21px]">
            <h3 className="text-[13px] font-medium text-bq-heading">Billing Summary</h3>
            <div className="mt-2">
              {[
                { label: "Plan", value: planLine },
                { label: "Trial credit applied", value: `-${usd(credit)}`, mint: true },
                { label: "Due today", value: usd(0) },
                { label: "Next charge", value: nextBilling, last: true },
              ].map((line) => (
                <div
                  key={line.label}
                  className={
                    line.last
                      ? "flex items-center justify-between py-2.5 text-[11px]"
                      : "flex items-center justify-between border-b border-bq-border-soft py-2.5 text-[11px]"
                  }
                >
                  <span className="text-bq-dim">{line.label}</span>
                  <span className={line.mint ? "font-medium text-bq-mint" : "font-medium text-bq-heading"}>
                    {line.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-bq-border p-[17px]">
            <p className="max-w-[320px] text-[11px] leading-relaxed text-bq-dim">
              You can cancel at any time before the next billing date with no penalty.
            </p>
            <button
              onClick={onCancel}
              className="mt-3 flex items-center gap-1.5 text-[11px] text-bq-dim transition-colors hover:text-[#ff6a83]"
            >
              <CircleX className="size-3" /> Cancel subscription
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
