"use client";

import { useState } from "react";
import {
  ScanFace,
  CreditCard,
  BookOpen,
  Car,
  Upload,
  Check,
  Circle,
  CircleCheck,
  Lock,
  EyeOff,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { Card, StatPill, HeaderActions, notify } from "@/components/dashboard/widgets";
import { cn } from "@/lib/utils";

const DOC_TYPES: { id: string; name: string; sub: string; icon: LucideIcon }[] = [
  { id: "id", name: "National ID Card", sub: "Front and back required", icon: CreditCard },
  { id: "passport", name: "International Passport", sub: "Photo page only", icon: BookOpen },
  { id: "license", name: "Driver's Licence", sub: "Front and back required", icon: Car },
];

const GUIDELINES = [
  "Document must be valid and not expired",
  "All four corners must be visible",
  "Text must be clearly legible",
  "No glare, shadows, or obstructions",
];

const TIERS: {
  name: string;
  limit: string;
  status: string;
  tone: "green" | "amber" | "neutral";
  active?: boolean;
  locked?: boolean;
  items: { t: string; done: boolean }[];
}[] = [
  {
    name: "Basic",
    limit: "Withdraw up to $500 / day",
    status: "Complete",
    tone: "green",
    items: [
      { t: "Email verified", done: true },
      { t: "Phone verified", done: true },
    ],
  },
  {
    name: "Standard",
    limit: "Withdraw up to $5,000 / day",
    status: "In Progress",
    tone: "amber",
    active: true,
    items: [
      { t: "Government-issued ID", done: false },
      { t: "Selfie with ID", done: false },
    ],
  },
  {
    name: "Advanced",
    limit: "Withdraw up to $50,000 / day",
    status: "Locked",
    tone: "neutral",
    locked: true,
    items: [
      { t: "Proof of address", done: false },
      { t: "Source of funds declaration", done: false },
    ],
  },
];

function UploadBox() {
  const [name, setName] = useState<string | null>(null);
  return (
    <label className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-bq-border bg-bq-bg py-8 text-center transition-colors hover:border-primary/40">
      <input
        type="file"
        accept=".png,.jpg,.jpeg,.pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            setName(f.name);
            toast("File selected", { description: f.name });
          }
        }}
      />
      <Upload className="size-5 text-bq-muted" />
      <span className="max-w-[80%] truncate text-[13px] font-medium text-white">{name ?? "Click to upload"}</span>
      <span className="text-[11px] text-bq-dim">PNG, JPG or PDF · Max 10MB</span>
    </label>
  );
}

export default function VerificationPage() {
  const [doc, setDoc] = useState("passport");

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Verification" actions={<HeaderActions />} />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-bq-border bg-bq-surface px-4 py-3">
        <p className="flex items-center gap-2.5 text-[13px] text-bq-text">
          <ScanFace className="size-4 shrink-0 text-[#ff6a83]" />
          <span>
            <span className="font-semibold text-white">Your account is not verified</span>
            <span className="block text-bq-dim">
              Complete identity verification to unlock higher withdrawal limits and full platform access.
            </span>
          </span>
        </p>
        <StatPill tone="red">Unverified</StatPill>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-full bg-bq-bg text-bq-muted">
              <ScanFace className="size-4" />
            </span>
            <div>
              <h2 className="font-semibold text-white">Standard Verification — Step 1 of 2</h2>
              <p className="text-[12px] text-bq-dim">Upload a valid government-issued photo ID.</p>
            </div>
          </div>

          <p className="mt-5 text-[12px] text-bq-muted">Select document type</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {DOC_TYPES.map((d) => (
              <button
                key={d.id}
                onClick={() => setDoc(d.id)}
                className={cn(
                  "rounded-xl border p-4 text-center transition-colors",
                  doc === d.id ? "border-primary bg-primary/5" : "border-bq-border hover:bg-white/[0.03]",
                )}
              >
                <span className="mx-auto flex size-9 items-center justify-center rounded-lg bg-bq-bg text-bq-muted">
                  <d.icon className="size-4" />
                </span>
                <p className="mt-2 text-[13px] font-medium text-white">{d.name}</p>
                <p className="text-[11px] text-bq-dim">{d.sub}</p>
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[12px] text-bq-muted">Front of document</p>
              <UploadBox />
            </div>
            <div>
              <p className="text-[12px] text-bq-muted">Back of document</p>
              <UploadBox />
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-bq-border bg-bq-bg p-4">
            <p className="text-[13px] font-semibold text-white">Document guidelines</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {GUIDELINES.map((g) => (
                <span key={g} className="flex items-center gap-2 text-[12px] text-bq-muted">
                  <Check className="size-3.5 shrink-0 text-primary" /> {g}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] text-bq-dim">Your data is encrypted and never shared with third parties.</p>
            <button
              onClick={() => notify("Submit Document")}
              className="flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-[13px] font-semibold text-black transition-transform hover:scale-[1.02] active:translate-y-px"
            >
              Submit Document <ArrowRight className="size-4" />
            </button>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h3 className="font-semibold text-white">Verification Tiers</h3>
            <p className="mt-1 text-[12px] text-bq-dim">Complete each tier to unlock higher limits.</p>
            <div className="mt-4 space-y-3">
              {TIERS.map((t) => (
                <div
                  key={t.name}
                  className={cn(
                    "rounded-xl border p-4",
                    t.active ? "border-primary/40 bg-primary/[0.04]" : "border-bq-border",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {t.locked ? (
                        <Lock className="size-4 text-bq-dim" />
                      ) : (
                        <Circle className={cn("size-4", t.tone === "green" ? "text-primary" : "text-bq-muted")} />
                      )}
                      <span className="text-[13px] font-semibold text-white">{t.name}</span>
                    </span>
                    <StatPill tone={t.tone}>{t.status}</StatPill>
                  </div>
                  <p className="mt-1 text-[12px] text-bq-dim">{t.limit}</p>
                  <ul className="mt-2 space-y-1.5">
                    {t.items.map((it) => (
                      <li key={it.t} className="flex items-center gap-2 text-[12px] text-bq-muted">
                        {it.done ? (
                          <CircleCheck className="size-3.5 shrink-0 text-primary" />
                        ) : (
                          <Circle className="size-3.5 shrink-0 text-bq-dim" />
                        )}
                        {it.t}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <EyeOff className="size-6 text-bq-muted" />
            <h3 className="mt-3 font-semibold text-white">Your data stays private</h3>
            <p className="mt-1 text-[12px] leading-relaxed text-bq-muted">
              Submitted documents are encrypted at rest, reviewed only by our compliance team, and deleted within 90
              days of account verification.
            </p>
            <button onClick={() => notify("Privacy policy")} className="mt-3 text-[12px] text-primary hover:opacity-80">
              Read our privacy policy
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
