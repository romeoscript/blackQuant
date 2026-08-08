"use client";

import { useActionState, useEffect, useState } from "react";
import {
  Smartphone,
  MessageSquare,
  Mail,
  ArrowRight,
  Loader2,
  Copy,
  Download,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card, StatPill, Stepper } from "@/components/dashboard/widgets";
import {
  beginTwoFactorEnrollment,
  confirmTwoFactorEnrollment,
  type Enrollment,
  type TwoFactorState,
} from "@/app/two-factor-actions";

const IDLE: TwoFactorState = { ok: false, message: "" };
const STEPS = ["Choose a method", "Scan & verify", "Save backup codes"];

type Method = {
  id: string;
  name: string;
  sub: string;
  icon: LucideIcon;
  available: boolean;
};

const METHODS: Method[] = [
  {
    id: "app",
    name: "Authenticator App",
    sub: "Use Google Authenticator, Authy, 1Password or any TOTP app.",
    icon: Smartphone,
    available: true,
  },
  {
    id: "sms",
    name: "SMS / Text Message",
    sub: "Needs an SMS provider. None is configured for this deployment.",
    icon: MessageSquare,
    available: false,
  },
  {
    id: "email",
    name: "Email OTP",
    sub: "Weaker than an authenticator app, since email is often the reset channel.",
    icon: Mail,
    available: false,
  },
];

export function TwoFactorSetup() {
  const [step, setStep] = useState(0);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [starting, setStarting] = useState(false);
  const [codes, setCodes] = useState<string[]>([]);

  async function start() {
    setStarting(true);
    const result = await beginTwoFactorEnrollment();
    setStarting(false);
    if (!result) {
      toast.error("We couldn't start setup. Try reloading the page.");
      return;
    }
    setEnrollment(result);
    setStep(1);
  }

  return (
    <>
      <Card>
        <Stepper steps={STEPS} current={step} />
      </Card>

      {step === 0 && <ChooseMethod onContinue={start} starting={starting} />}

      {step === 1 && enrollment && (
        <ScanAndVerify
          enrollment={enrollment}
          onConfirmed={(recoveryCodes) => {
            setCodes(recoveryCodes);
            setStep(2);
          }}
        />
      )}

      {step === 2 && <BackupCodes codes={codes} />}
    </>
  );
}

function ChooseMethod({
  onContinue,
  starting,
}: {
  onContinue: () => void;
  starting: boolean;
}) {
  const [method, setMethod] = useState("app");

  return (
    <Card>
      <h2 className="font-semibold text-bq-heading">
        Choose your verification method
      </h2>
      <p className="text-[12px] text-bq-dim">
        Select how you want to receive your one-time codes.
      </p>
      <div className="mt-4 space-y-2">
        {METHODS.map((m) => (
          <button
            key={m.id}
            type="button"
            disabled={!m.available}
            onClick={() => setMethod(m.id)}
            className={cn(
              "flex w-full items-start gap-3 rounded-lg border px-4 py-3.5 text-left transition-colors",
              method === m.id
                ? "border-primary bg-primary/5"
                : "border-bq-border hover:bg-bq-overlay/[0.03]",
              !m.available && "cursor-not-allowed opacity-50 hover:bg-transparent",
            )}
          >
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-bq-bg text-bq-muted">
              <m.icon className="size-4" />
            </span>
            <span className="flex-1">
              <span className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-bq-heading">
                  {m.name}
                </span>
                {m.available ? (
                  <StatPill tone="green">Recommended</StatPill>
                ) : (
                  <StatPill tone="neutral">Unavailable</StatPill>
                )}
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
      <div className="mt-4 flex justify-end">
        <button
          onClick={onContinue}
          disabled={starting}
          className="flex items-center gap-2 rounded-lg bg-bq-contrast px-5 py-2.5 text-[13px] font-semibold text-bq-on-fill transition-transform hover:scale-[1.02] active:translate-y-px disabled:opacity-60"
        >
          {starting && <Loader2 className="size-4 animate-spin" />}
          {starting ? "Preparing…" : "Continue"}
          {!starting && <ArrowRight className="size-4" />}
        </button>
      </div>
    </Card>
  );
}

function ScanAndVerify({
  enrollment,
  onConfirmed,
}: {
  enrollment: Enrollment;
  onConfirmed: (codes: string[]) => void;
}) {
  const [state, formAction, pending] = useActionState(
    confirmTwoFactorEnrollment,
    IDLE as TwoFactorState & { recoveryCodes?: string[] },
  );

  useEffect(() => {
    if (state.ok && state.recoveryCodes) onConfirmed(state.recoveryCodes);
  }, [state, onConfirmed]);

  return (
    <Card>
      <h2 className="font-semibold text-bq-heading">Scan and verify</h2>
      <p className="text-[12px] text-bq-dim">
        Scan this with your authenticator app, then enter the 6-digit code it
        shows.
      </p>

      <div className="mt-4 grid gap-6 md:grid-cols-[auto_1fr]">
        <div
          className="w-fit rounded-xl bg-white p-3 [&>svg]:size-40"
          // Generated server-side from the provisioning URI; no user input.
          dangerouslySetInnerHTML={{ __html: enrollment.qrSvg }}
        />

        <div>
          <p className="text-[12px] text-bq-muted">
            Can&apos;t scan it? Enter this key manually:
          </p>
          <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-bq-border bg-bq-bg px-3 py-2">
            <code className="flex-1 break-all font-plex text-[12px] text-bq-heading">
              {enrollment.manualKey}
            </code>
            <CopyButton value={enrollment.manualKey} label="setup key" />
          </div>

          <form action={formAction} className="mt-5">
            <label htmlFor="token" className="text-[12px] text-bq-muted">
              6-digit code
            </label>
            <input
              id="token"
              name="token"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              className="mt-1.5 w-40 rounded-lg border border-bq-border bg-bq-bg px-3 py-2.5 text-center font-plex text-lg tracking-[4px] text-bq-heading focus:border-primary focus:outline-none"
            />

            {!state.ok && state.message && (
              <p role="alert" className="mt-2 text-[12px] text-bq-loss-text">
                {state.message}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="mt-4 flex items-center gap-2 rounded-lg bg-bq-contrast px-5 py-2.5 text-[13px] font-semibold text-bq-on-fill transition-transform hover:scale-[1.02] active:translate-y-px disabled:opacity-60"
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              {pending ? "Verifying…" : "Verify & enable"}
            </button>
          </form>
        </div>
      </div>
    </Card>
  );
}

export function BackupCodes({ codes }: { codes: string[] }) {
  return (
    <Card>
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-5 text-primary" />
        <h2 className="font-semibold text-bq-heading">Save your backup codes</h2>
      </div>
      <p className="mt-1 text-[13px] text-bq-muted">
        Each code signs you in once if you lose your authenticator. They are
        shown now and never again, because only their digests are stored.
      </p>

      <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {codes.map((code) => (
          <li
            key={code}
            className="rounded-lg border border-bq-border bg-bq-bg px-3 py-2 text-center font-plex text-[13px] tracking-wide text-bq-heading"
          >
            {code}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-2.5">
        <CopyButton value={codes.join("\n")} label="backup codes" labelled />
        <button
          onClick={() => {
            const url = URL.createObjectURL(
              new Blob([codes.join("\n")], { type: "text/plain" }),
            );
            const link = document.createElement("a");
            link.href = url;
            link.download = "blackquant-backup-codes.txt";
            link.click();
            URL.revokeObjectURL(url);
          }}
          className="flex items-center gap-2 rounded-lg border border-bq-border px-4 py-2 text-[13px] font-medium text-bq-text transition-colors hover:bg-bq-overlay/5"
        >
          <Download className="size-4" /> Download
        </button>
      </div>
    </Card>
  );
}

function CopyButton({
  value,
  label,
  labelled = false,
}: {
  value: string;
  label: string;
  labelled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        toast.success(`Copied ${label}`);
      }}
      aria-label={`Copy ${label}`}
      className={cn(
        "flex items-center gap-2 text-bq-muted transition-colors hover:text-bq-heading",
        labelled &&
          "rounded-lg border border-bq-border px-4 py-2 text-[13px] font-medium text-bq-text hover:bg-bq-overlay/5",
      )}
    >
      <Copy className="size-4" />
      {labelled && "Copy all"}
    </button>
  );
}
