"use client";

import {
  MapPin,
  Calendar,
  ShieldCheck,
  Lock,
  Monitor,
  Download,
  Trash2,
  LogIn,
  TrendingUp,
  ArrowUpRight,
  Wallet,
  SquarePen,
  type LucideIcon,
} from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { Card, StatPill, Toggle, HeaderActions, notify } from "@/components/dashboard/widgets";

const FIELDS = [
  { label: "Full Name", value: "Wazobia Adeyemi" },
  { label: "Username", value: "@wazobia" },
  { label: "Email", value: "wazobia@.io" },
  { label: "Phone", value: "+234 801 234 5678" },
  { label: "Country", value: "Nigeria" },
  { label: "Currency", value: "USD" },
];

const PREFS = [
  { label: "Signal alerts via email", on: true },
  { label: "Position updates", on: true },
  { label: "Withdrawal confirmations", on: true },
  { label: "Referral activity", on: false },
];

const ACTIVITY: { title: string; detail: string; time: string; icon: LucideIcon }[] = [
  { title: "Login", detail: "Chrome · Lagos, NG", time: "11:58 today", icon: LogIn },
  { title: "Position Opened", detail: "BTC/USDT BUY · $1,200", time: "11:32 today", icon: TrendingUp },
  { title: "Withdrawal Requested", detail: "$500 · Bank Transfer", time: "Jun 12, 2026", icon: ArrowUpRight },
  { title: "Account Funded", detail: "+$2,000 · USDT TRC20", time: "Jun 10, 2026", icon: Wallet },
  { title: "Auth Guard Enabled", detail: "2FA activated", time: "Jun 08, 2026", icon: ShieldCheck },
];

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <DashboardPageHeader title="My Profile" actions={<HeaderActions />} />

      <Card>
        <div className="flex flex-wrap items-center gap-5">
          <div className="relative">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/20 text-xl font-bold text-primary">
              WA
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full border-2 border-bq-surface bg-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">Wazobia Adeyemi</h2>
            <p className="text-[13px] text-bq-muted">wazobia@.io</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-bq-dim">
              <StatPill tone="green">Pro Plan</StatPill>
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" /> Lagos, Nigeria
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="size-3.5" /> Member since Jan 2026
              </span>
            </div>
          </div>
          <div className="flex gap-8">
            {[
              { v: "6", l: "Positions", green: false },
              { v: "5", l: "Referrals", green: false },
              { v: "+$106", l: "Total P&L", green: true },
            ].map((s) => (
              <div key={s.l} className="text-center">
                <p className={`text-xl font-bold ${s.green ? "text-primary" : "text-white"}`}>{s.v}</p>
                <p className="text-[11px] text-bq-dim">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Personal Information</h2>
            <button
              onClick={() => notify("Edit profile")}
              className="flex items-center gap-1.5 rounded-lg border border-bq-border px-3 py-1.5 text-[12px] font-medium text-bq-text transition-colors hover:bg-white/5"
            >
              <SquarePen className="size-3.5" /> Edit
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4">
            {FIELDS.map((f) => (
              <div key={f.label}>
                <p className="text-[11px] text-bq-dim">{f.label}</p>
                <p className="mt-0.5 text-[13px] font-medium text-white">{f.value}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 border-t border-bq-border-soft pt-4 text-[13px] font-semibold text-white">
            Notification Preferences
          </p>
          <div className="mt-3 space-y-3">
            {PREFS.map((p) => (
              <div key={p.label} className="flex items-center justify-between">
                <span className="text-[13px] text-bq-muted">{p.label}</span>
                <Toggle defaultOn={p.on} />
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="font-semibold text-white">Security</h2>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-3 rounded-lg border border-primary/25 bg-primary/[0.05] px-3 py-3">
                <ShieldCheck className="size-4 shrink-0 text-primary" />
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-white">Auth Guard (2FA)</p>
                  <p className="text-[11px] text-bq-dim">Two-factor authentication is active</p>
                </div>
                <StatPill tone="green">Enabled</StatPill>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-bq-border px-3 py-3">
                <Lock className="size-4 shrink-0 text-bq-muted" />
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-white">Password</p>
                  <p className="text-[11px] text-bq-dim">Last changed 42 days ago</p>
                </div>
                <button onClick={() => notify("Change password")} className="text-[12px] font-medium text-bq-text hover:text-white">
                  Change
                </button>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-bq-border px-3 py-3">
                <Monitor className="size-4 shrink-0 text-bq-muted" />
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-white">Active Sessions</p>
                  <p className="text-[11px] text-bq-dim">2 devices logged in</p>
                </div>
                <button onClick={() => notify("Revoke sessions")} className="text-[12px] font-medium text-[#ff6a83] hover:opacity-80">
                  Revoke All
                </button>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold text-white">Danger Zone</h2>
            <p className="text-[12px] text-bq-dim">These actions are irreversible. Proceed with caution.</p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <button
                onClick={() => notify("Export data")}
                className="flex items-center gap-2 rounded-lg border border-bq-border px-4 py-2 text-[13px] font-medium text-bq-text transition-colors hover:bg-white/5"
              >
                <Download className="size-4" /> Export Data
              </button>
              <button
                onClick={() => notify("Delete account")}
                className="flex items-center gap-2 rounded-lg border border-[#ff3b5c]/30 bg-[#ff3b5c]/[0.06] px-4 py-2 text-[13px] font-semibold text-[#ff6a83] transition-colors hover:bg-[#ff3b5c]/10"
              >
                <Trash2 className="size-4" /> Delete Account
              </button>
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-white">Recent Activity</h2>
            <p className="text-[12px] text-bq-dim">Your latest account actions</p>
          </div>
          <button onClick={() => notify("Activity log")} className="text-[12px] text-primary hover:opacity-80">
            View full log
          </button>
        </div>
        <ul className="mt-3">
          {ACTIVITY.map((a) => (
            <li key={a.title} className="flex items-center gap-3 border-b border-bq-border-soft py-3 last:border-0">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-bq-bg text-bq-muted">
                <a.icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-white">{a.title}</p>
                <p className="text-[11px] text-bq-dim">{a.detail}</p>
              </div>
              <span className="shrink-0 font-plex text-[11px] text-bq-dim">{a.time}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
