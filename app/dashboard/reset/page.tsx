"use client";

import { useState } from "react";
import {
  Info,
  Mail,
  ArrowRight,
  Lock,
  Shield,
  KeyRound,
  Wallet,
  Monitor,
  Bell,
  CircleCheck,
  X,
  type LucideIcon,
} from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { Card, StatPill, Toggle, Stepper, HeaderActions, notify } from "@/components/dashboard/widgets";

const RESET_ITEMS: { label: string; icon: LucideIcon; on: boolean }[] = [
  { label: "Account password", icon: Lock, on: true },
  { label: "Auth Guard (2FA)", icon: Shield, on: false },
  { label: "API keys", icon: KeyRound, on: false },
  { label: "Wallet addresses", icon: Wallet, on: false },
  { label: "All active sessions", icon: Monitor, on: true },
  { label: "Notification preferences", icon: Bell, on: false },
];

const TIPS = [
  "At least 12 characters long",
  "Mix letters, numbers & symbols",
  "Avoid reusing old passwords",
  "Re-enable Auth Guard after reset",
];

const LOGINS = [
  { text: "Login from Chrome · Lagos, NG", time: "11:58 today", icon: Monitor },
  { text: "Login from Safari · Lagos, NG", time: "Jun 17, 2026", icon: Monitor },
  { text: "Password changed", time: "May 08, 2026", icon: KeyRound },
];

export default function ResetPage() {
  const [code, setCode] = useState(["4", "8", "2", "", "", ""]);

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Reset Credentials" actions={<HeaderActions />} />

      <div className="flex items-center gap-2.5 rounded-xl border border-bq-border bg-bq-surface px-4 py-3 text-[13px] text-bq-muted">
        <Info className="size-4 shrink-0 text-bq-dim" />
        For your security, resetting credentials requires identity verification. All active sessions will be terminated after reset.
      </div>

      <Card>
        <Stepper steps={["Verify identity", "New credentials", "Confirmation"]} current={0} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card>
            <h2 className="font-semibold text-white">Verify your identity</h2>
            <p className="text-[12px] text-bq-dim">Confirm your current email address to proceed with the credential reset.</p>

            <label className="mt-4 block text-[12px] text-bq-muted">Registered email address</label>
            <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-bq-border bg-bq-bg px-3 py-2.5">
              <Mail className="size-4 text-bq-dim" />
              <span className="flex-1 text-[13px] text-bq-text">wazobia@.io</span>
              <StatPill tone="green">Verified</StatPill>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <label className="text-[12px] text-bq-muted">Verification code</label>
              <button onClick={() => notify("Resend code")} className="text-[12px] text-primary hover:opacity-80">
                Resend code
              </button>
            </div>
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-bq-border bg-bq-bg px-3 py-2.5">
              <KeyRound className="size-4 text-bq-dim" />
              <span className="text-[13px] text-bq-dim">Enter 6-digit code sent to your email</span>
            </div>
            <p className="mt-2 text-[11px] text-bq-dim">
              A verification code was sent to w***@.io. Check your spam folder if it doesn&apos;t arrive within 2 minutes.
            </p>

            <div className="mt-4 flex gap-2">
              {code.map((c, i) => (
                <input
                  key={i}
                  value={c}
                  maxLength={1}
                  inputMode="numeric"
                  aria-label={`Digit ${i + 1}`}
                  onChange={(e) => {
                    const v = [...code];
                    v[i] = e.target.value.replace(/\D/g, "").slice(-1);
                    setCode(v);
                  }}
                  className="size-11 rounded-lg border border-bq-border bg-bq-bg text-center text-lg font-bold text-white focus:border-primary focus:outline-none"
                />
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] text-bq-dim">Code expires in 09:47</p>
              <button
                onClick={() => notify("Verify & Continue")}
                className="flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-[13px] font-semibold text-black transition-transform hover:scale-[1.02] active:translate-y-px"
              >
                Verify &amp; Continue <ArrowRight className="size-4" />
              </button>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-white">What will be reset</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {RESET_ITEMS.map((r) => (
                <div key={r.label} className="flex items-center gap-3 rounded-lg border border-bq-border bg-bq-bg px-3 py-2.5">
                  <r.icon className="size-4 shrink-0 text-bq-muted" />
                  <span className="flex-1 text-[13px] text-bq-text">{r.label}</span>
                  <Toggle defaultOn={r.on} />
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <Shield className="size-6 text-primary" />
            <h3 className="mt-3 font-semibold text-white">Strong credential tips</h3>
            <p className="mt-1 text-[12px] text-bq-muted">After verification, you&apos;ll set a new password. Make it count.</p>
            <ul className="mt-4 space-y-2.5">
              {TIPS.map((t) => (
                <li key={t} className="flex items-center gap-2.5 text-[13px] text-bq-text">
                  <CircleCheck className="size-4 shrink-0 text-primary" /> {t}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h3 className="font-semibold text-white">Recent login activity</h3>
            <p className="mt-1 text-[12px] text-bq-dim">If you don&apos;t recognise these, reset immediately.</p>
            <ul className="mt-3 space-y-3">
              {LOGINS.map((l) => (
                <li key={l.text} className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-bq-bg text-bq-muted">
                    <l.icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] text-bq-text">{l.text}</p>
                    <p className="font-plex text-[11px] text-bq-dim">{l.time}</p>
                  </div>
                </li>
              ))}
            </ul>
            <button onClick={() => notify("Activity log")} className="mt-3 text-[12px] text-primary hover:opacity-80">
              View full activity log
            </button>
          </Card>

          <button
            onClick={() => notify("Cancel reset")}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-bq-border py-2.5 text-[13px] font-medium text-bq-muted transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="size-4" /> Cancel reset
          </button>
        </div>
      </div>
    </div>
  );
}
