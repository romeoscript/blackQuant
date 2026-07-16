"use client";

import { useState } from "react";
import {
  Search,
  Rocket,
  CreditCard,
  Cpu,
  BarChart3,
  Users,
  Shield,
  Eye,
  FileText,
  ChevronDown,
  Headphones,
  type LucideIcon,
} from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { Card, HeaderActions, notify } from "@/components/dashboard/widgets";
import { cn } from "@/lib/utils";

const TAGS = ["Fund account", "Signal Engine", "Auth Guard", "Referral", "Withdraw"];

const CATEGORIES: { name: string; count: number; icon: LucideIcon }[] = [
  { name: "Getting Started", count: 12, icon: Rocket },
  { name: "Funding & Withdrawals", count: 8, icon: CreditCard },
  { name: "Signal Engine", count: 16, icon: Cpu },
  { name: "Positions & Trading", count: 11, icon: BarChart3 },
  { name: "Referral Programme", count: 6, icon: Users },
  { name: "Security & Auth Guard", count: 9, icon: Shield },
];

const POPULAR = [
  { title: "How to fund your account and activate a subscription", cat: "Getting Started", views: "1,240" },
  { title: "Understanding signal confidence scores and what they mean", cat: "Signal Engine", views: "984" },
  { title: "How to open, manage and close a trading position", cat: "Positions & Trading", views: "872" },
  { title: "Setting up Auth Guard to secure your account", cat: "Security", views: "761" },
  { title: "How commissions are calculated and paid out", cat: "Referral Programme", views: "643" },
  { title: "Withdrawal processing times by method", cat: "Withdrawals", views: "520" },
];

const FAQ = [
  { q: "How long does a bank withdrawal take?", a: "Bank transfers typically take 1–3 business days to arrive, depending on your bank and country." },
  { q: "Can I run multiple positions at the same time?", a: "Yes, the number of simultaneous positions depends on your active subscription tier." },
  { q: "What is a confidence score?", a: "A confidence score (0–100%) reflects how strongly the signal engine rates a trading opportunity based on multiple indicators." },
  { q: "How do I upgrade my subscription plan?", a: "Navigate to Signal Plan in the sidebar and click Activate on any plan tier to upgrade instantly." },
];

export default function KnowledgePage() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Knowledge Base" actions={<HeaderActions />} />

      <Card className="px-6 py-10 text-center">
        <h2 className="text-2xl font-bold text-white">How can we help you?</h2>
        <p className="mt-2 text-[13px] text-bq-muted">Search our library of guides, tutorials, and FAQs.</p>
        <div className="mx-auto mt-6 flex max-w-xl items-center gap-2 rounded-lg border border-bq-border bg-bq-bg px-3">
          <Search className="size-4 text-bq-dim" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles…"
            className="w-full bg-transparent py-2.5 text-sm text-white placeholder:text-bq-dim focus:outline-none"
          />
          <kbd className="rounded border border-bq-border px-1.5 py-0.5 font-plex text-[10px] text-bq-dim">⌘K</kbd>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {TAGS.map((t) => (
            <button
              key={t}
              onClick={() => setQuery(t)}
              className="rounded-full border border-bq-border px-3 py-1 text-[12px] text-bq-muted transition-colors hover:bg-white/[0.03] hover:text-white"
            >
              {t}
            </button>
          ))}
        </div>
      </Card>

      <div>
        <p className="font-plex text-[11px] uppercase tracking-[1.5px] text-bq-dim">Browse by Category</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {CATEGORIES.map((c) => (
            <button
              key={c.name}
              onClick={() => notify(c.name)}
              className="rounded-xl border border-bq-border bg-bq-surface p-5 text-center transition-colors hover:border-primary/40 hover:bg-white/[0.02]"
            >
              <span className="mx-auto flex size-10 items-center justify-center rounded-xl bg-bq-bg text-bq-muted">
                <c.icon className="size-5" />
              </span>
              <p className="mt-3 text-[13px] font-semibold text-white">{c.name}</p>
              <p className="mt-1 text-[11px] text-bq-dim">{c.count} articles</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white">Popular Articles</h2>
              <p className="text-[12px] text-bq-dim">Most read guides this month</p>
            </div>
            <button onClick={() => notify("All articles")} className="text-[12px] text-primary hover:opacity-80">
              View all
            </button>
          </div>
          <ul className="mt-3">
            {POPULAR.map((a) => (
              <li key={a.title} className="border-b border-bq-border-soft last:border-0">
                <button
                  onClick={() => notify(a.title)}
                  className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:opacity-90"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-bq-bg text-bq-muted">
                    <FileText className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] text-bq-text">{a.title}</span>
                    <span className="block text-[11px] text-bq-dim">{a.cat}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-[11px] text-bq-dim">
                    <Eye className="size-3" /> {a.views}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="font-semibold text-white">Frequently Asked</h2>
          <p className="text-[12px] text-bq-dim">Quick answers to common questions.</p>
          <div className="mt-3 divide-y divide-bq-border-soft">
            {FAQ.map((f, i) => (
              <div key={f.q} className="py-3">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="flex w-full items-center gap-3 text-left"
                >
                  <span className="flex-1 text-[13px] font-medium text-white">{f.q}</span>
                  <ChevronDown
                    className={cn("size-4 shrink-0 text-bq-dim transition-transform", open === i && "rotate-180")}
                  />
                </button>
                {open === i && <p className="mt-2 text-[12px] leading-relaxed text-bq-muted">{f.a}</p>}
              </div>
            ))}
          </div>
          <button
            onClick={() => notify("Contact Support")}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-bq-border py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-white/5"
          >
            <Headphones className="size-4" /> Contact Support
          </button>
        </Card>
      </div>
    </div>
  );
}
