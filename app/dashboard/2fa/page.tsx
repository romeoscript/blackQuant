"use client";

import { useState } from "react";
import {
  ShieldOff,
  Shield,
  Smartphone,
  MessageSquare,
  Mail,
  ShieldCheck,
  Zap,
  RefreshCw,
  KeyRound,
  ArrowRight,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { Card, StatPill, Stepper, HeaderActions, notify } from "@/components/dashboard/widgets";
import { cn } from "@/lib/utils";

const METHODS: { id: string; name: string; sub: string; icon: LucideIcon; recommended?: boolean }[] = [
  { id: "app", name: "Authenticator App", sub: "Use Google Authenticator, Authy, or any TOTP app. Most secure option.", icon: Smartphone, recommended: true },
  { id: "sms", name: "SMS / Text Message", sub: "Receive a one-time code on your registered phone number.", icon: MessageSquare },
  { id: "email", name: "Email OTP", sub: "Receive a one-time code at your registered email address.", icon: Mail },
];

const WHY: { text: string; icon: LucideIcon }[] = [
  { text: "Blocks unauthorised logins", icon: ShieldCheck },
  { text: "Instant code delivery", icon: Zap },
  { text: "Change method any time", icon: RefreshCw },
  { text: "Backup codes for emergencies", icon: KeyRound },
];

const PROTECTS = ["Account login", "Withdrawals", "Security settings changes", "API key generation"];

export default function TwoFactorPage() {
  const [method, setMethod] = useState("app");

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="2 Factor Authentication" actions={<HeaderActions />} />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-bq-border bg-bq-surface px-4 py-3">
        <p className="flex items-center gap-2.5 text-[13px] text-bq-text">
          <ShieldOff className="size-4 shrink-0 text-[#ff6a83]" />
          <span>
            <span className="font-semibold text-white">Your account is not protected</span>
            <span className="block text-bq-dim">Enable Auth Guard to add a second layer of security to your account.</span>
          </span>
        </p>
        <StatPill tone="red">Unconfigured</StatPill>
      </div>

      <Card>
        <Stepper steps={["Choose a method", "Scan & verify", "Save backup codes"]} current={0} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <h2 className="font-semibold text-white">Choose your verification method</h2>
          <p className="text-[12px] text-bq-dim">Select how you want to receive your one-time codes.</p>
          <div className="mt-4 space-y-2">
            {METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border px-4 py-3.5 text-left transition-colors",
                  method === m.id ? "border-primary bg-primary/5" : "border-bq-border hover:bg-white/[0.03]",
                )}
              >
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-bq-bg text-bq-muted">
                  <m.icon className="size-4" />
                </span>
                <span className="flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-white">{m.name}</span>
                    {m.recommended && <StatPill tone="green">Recommended</StatPill>}
                  </span>
                  <span className="mt-0.5 block text-[12px] text-bq-dim">{m.sub}</span>
                </span>
                <span
                  className={cn(
                    "mt-1 size-4 shrink-0 rounded-full border",
                    method === m.id ? "border-[5px] border-primary" : "border-bq-border",
                  )}
                />
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] text-bq-dim">You can change your method any time in Security settings.</p>
            <button
              onClick={() => notify("Continue")}
              className="flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-[13px] font-semibold text-black transition-transform hover:scale-[1.02] active:translate-y-px"
            >
              Continue <ArrowRight className="size-4" />
            </button>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <Shield className="size-6 text-primary" />
            <h3 className="mt-3 font-semibold text-white">Why enable Auth Guard?</h3>
            <p className="mt-1 text-[12px] leading-relaxed text-bq-muted">
              Auth Guard adds a second verification step each time you log in, making it significantly harder for
              attackers to access your account even if your password is compromised.
            </p>
            <ul className="mt-4 space-y-2.5">
              {WHY.map((w) => (
                <li key={w.text} className="flex items-center gap-2.5 text-[13px] text-bq-text">
                  <w.icon className="size-4 shrink-0 text-primary" /> {w.text}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h3 className="font-semibold text-white">What Auth Guard protects</h3>
            <ul className="mt-3 space-y-2.5">
              {PROTECTS.map((p) => (
                <li key={p} className="flex items-center gap-2.5 text-[13px] text-bq-muted">
                  <Lock className="size-3.5 shrink-0 text-bq-dim" /> {p}
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-bq-border-soft pt-3 text-[11px] text-bq-dim">
              All actions above will require a second factor once Auth Guard is active.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
