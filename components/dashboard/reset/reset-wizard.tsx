"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import Link from "next/link";
import {
  Mail,
  KeyRound,
  ArrowRight,
  Loader2,
  CircleCheck,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { Card, StatPill, Stepper } from "@/components/dashboard/widgets";
import {
  CODE_LENGTH,
  CODE_TTL_MINUTES,
  MIN_PASSWORD_LENGTH,
} from "@/lib/credential-reset";
import {
  changePassword,
  sendCredentialResetCode,
  verifyCredentialResetCode,
  type CredentialState,
} from "@/app/credential-actions";

const IDLE: CredentialState = { ok: false, message: "" };
const STEPS = ["Verify identity", "New credentials", "Confirmation"];

export function ResetWizard({
  email,
  maskedEmail,
  emailVerified,
}: {
  email: string;
  maskedEmail: string;
  emailVerified: boolean;
}) {
  const [step, setStep] = useState(0);
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const code = digits.join("");

  const goToPassword = useCallback(() => setStep(1), []);
  const goToDone = useCallback(() => setStep(2), []);

  return (
    <>
      <Card>
        <Stepper steps={STEPS} current={step} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {step === 0 && (
            <VerifyStep
              email={email}
              maskedEmail={maskedEmail}
              emailVerified={emailVerified}
              digits={digits}
              setDigits={setDigits}
              onVerified={goToPassword}
            />
          )}
          {step === 1 && (
            <PasswordStep code={code} onChanged={goToDone} />
          )}
          {step === 2 && <DoneStep />}
        </div>

        <div className="space-y-6">
          <Card>
            <Shield className="size-6 text-primary" />
            <h3 className="mt-3 font-semibold text-bq-heading">
              Strong credential tips
            </h3>
            <ul className="mt-4 space-y-2.5">
              {[
                `At least ${MIN_PASSWORD_LENGTH} characters long`,
                "Mix letters, numbers & symbols",
                "Avoid reusing old passwords",
                "Use a password manager if you can",
              ].map((tip) => (
                <li
                  key={tip}
                  className="flex items-center gap-2.5 text-[13px] text-bq-text"
                >
                  <CircleCheck className="size-4 shrink-0 text-primary" /> {tip}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h3 className="font-semibold text-bq-heading">What changes</h3>
            <ul className="mt-3 space-y-2.5 text-[13px] text-bq-muted">
              <li className="flex items-start gap-2.5">
                <KeyRound className="mt-0.5 size-4 shrink-0 text-bq-dim" />
                Your account password is replaced.
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 size-4 shrink-0 text-bq-dim" />
                Any outstanding password-reset emails stop working.
              </li>
            </ul>
            <p className="mt-3 text-[11px] text-bq-dim">
              Sessions on other devices are not signed out. They stay valid until
              they expire.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}

function VerifyStep({
  email,
  maskedEmail,
  emailVerified,
  digits,
  setDigits,
  onVerified,
}: {
  email: string;
  maskedEmail: string;
  emailVerified: boolean;
  digits: string[];
  setDigits: Dispatch<SetStateAction<string[]>>;
  onVerified: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    verifyCredentialResetCode,
    IDLE,
  );
  const [sending, setSending] = useState(false);
  const [sentAt, setSentAt] = useState<number | null>(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const code = digits.join("");

  useEffect(() => {
    if (state.ok) onVerified();
  }, [state, onVerified]);

  async function send() {
    setSending(true);
    const result = await sendCredentialResetCode();
    setSending(false);
    if (result.ok) {
      setSentAt(Date.now());
      toast.success(result.message, { description: `Sent to ${maskedEmail}` });
    } else {
      toast.error(result.message);
    }
  }

  /**
   * Spreads whatever arrives across the boxes from `index` on. Handles one
   * keystroke, a pasted code, and one-time-code autofill identically — the last
   * two deliver every digit to a single input, which a per-box handler would
   * throw away.
   */
  function fillFrom(index: number, value: string) {
    const incoming = value.replace(/\D/g, "").slice(0, CODE_LENGTH - index);
    if (!incoming) {
      setDigits((prev) => prev.map((d, i) => (i === index ? "" : d)));
      return;
    }
    setDigits((prev) => {
      const next = [...prev];
      for (let i = 0; i < incoming.length; i++) next[index + i] = incoming[i];
      return next;
    });
    inputs.current[Math.min(index + incoming.length, CODE_LENGTH - 1)]?.focus();
  }

  return (
    <Card>
      <h2 className="font-semibold text-bq-heading">Verify your identity</h2>
      <p className="text-[12px] text-bq-dim">
        Changing your password needs a code from your email, so a stolen session
        alone can&apos;t lock you out of your account.
      </p>

      <label className="mt-4 block text-[12px] text-bq-muted">
        Registered email address
      </label>
      <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-bq-border bg-bq-bg px-3 py-2.5">
        <Mail className="size-4 text-bq-dim" />
        <span className="flex-1 truncate text-[13px] text-bq-text">{email}</span>
        <StatPill tone={emailVerified ? "green" : "neutral"}>
          {emailVerified ? "Verified" : "Unverified"}
        </StatPill>
      </div>

      {sentAt === null ? (
        <button
          onClick={send}
          disabled={sending}
          className="mt-4 flex items-center gap-2 rounded-lg bg-bq-contrast px-5 py-2.5 text-[13px] font-semibold text-bq-on-fill transition-transform hover:scale-[1.02] active:translate-y-px disabled:opacity-60"
        >
          {sending && <Loader2 className="size-4 animate-spin" />}
          {sending ? "Sending…" : "Send verification code"}
        </button>
      ) : (
        <form action={formAction}>
          <input type="hidden" name="code" value={code} />
          <div className="mt-4 flex items-center justify-between">
            <label className="text-[12px] text-bq-muted">Verification code</label>
            <button
              type="button"
              onClick={send}
              disabled={sending}
              className="text-[12px] text-primary hover:opacity-80 disabled:opacity-50"
            >
              Resend code
            </button>
          </div>

          <div className="mt-2 flex gap-2">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                value={digit}
                inputMode="numeric"
                autoComplete="one-time-code"
                aria-label={`Digit ${i + 1} of ${CODE_LENGTH}`}
                onChange={(e) => fillFrom(i, e.target.value)}
                onPaste={(e) => {
                  e.preventDefault();
                  fillFrom(i, e.clipboardData.getData("text"));
                }}
                onFocus={(e) => e.currentTarget.select()}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !digits[i] && i > 0) {
                    inputs.current[i - 1]?.focus();
                  }
                }}
                className="size-11 rounded-lg border border-bq-border bg-bq-bg text-center text-lg font-bold text-bq-heading focus:border-primary focus:outline-none"
              />
            ))}
          </div>

          <p className="mt-2 text-[11px] text-bq-dim">
            Sent to {maskedEmail}. Expires in {CODE_TTL_MINUTES} minutes. Check
            spam if it doesn&apos;t arrive.
          </p>

          {!state.ok && state.message && (
            <p role="alert" className="mt-2 text-[12px] text-bq-loss-text">
              {state.message}
            </p>
          )}

          <button
            type="submit"
            disabled={pending || code.length < CODE_LENGTH}
            className="mt-4 flex items-center gap-2 rounded-lg bg-bq-contrast px-5 py-2.5 text-[13px] font-semibold text-bq-on-fill transition-transform hover:scale-[1.02] active:translate-y-px disabled:opacity-60"
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            {pending ? "Verifying…" : "Verify & Continue"}
            {!pending && <ArrowRight className="size-4" />}
          </button>
        </form>
      )}
    </Card>
  );
}

function PasswordStep({
  code,
  onChanged,
}: {
  code: string;
  onChanged: () => void;
}) {
  const [state, formAction, pending] = useActionState(changePassword, IDLE);

  useEffect(() => {
    if (!state.ok) return;
    toast.success(state.message);
    onChanged();
  }, [state, onChanged]);

  return (
    <Card>
      <h2 className="font-semibold text-bq-heading">Set a new password</h2>
      <p className="text-[12px] text-bq-dim">
        Your identity is confirmed. Choose a password you don&apos;t use anywhere
        else.
      </p>

      <form action={formAction} className="mt-4 space-y-4">
        <input type="hidden" name="code" value={code} />
        <PasswordField
          name="password"
          label="New password"
          autoComplete="new-password"
        />
        <PasswordField
          name="confirm"
          label="Confirm new password"
          autoComplete="new-password"
        />

        {!state.ok && state.message && (
          <p role="alert" className="text-[12px] text-bq-loss-text">
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 rounded-lg bg-bq-contrast px-5 py-2.5 text-[13px] font-semibold text-bq-on-fill transition-transform hover:scale-[1.02] active:translate-y-px disabled:opacity-60"
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          {pending ? "Saving…" : "Change password"}
        </button>
      </form>
    </Card>
  );
}

function PasswordField({
  name,
  label,
  autoComplete,
}: {
  name: string;
  label: string;
  autoComplete: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-[12px] text-bq-muted">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="password"
        required
        minLength={MIN_PASSWORD_LENGTH}
        autoComplete={autoComplete}
        className="mt-1.5 w-full rounded-lg border border-bq-border bg-bq-bg px-3 py-2.5 text-[13px] text-bq-heading focus:border-primary focus:outline-none"
      />
    </div>
  );
}

function DoneStep() {
  return (
    <Card>
      <CircleCheck className="size-8 text-primary" />
      <h2 className="mt-3 font-semibold text-bq-heading">Password changed</h2>
      <p className="mt-1 text-[13px] text-bq-muted">
        Your new password is active. Outstanding password-reset emails have been
        invalidated.
      </p>
      <Link
        href="/dashboard/profile"
        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-bq-border px-4 py-2 text-[13px] font-medium text-bq-text transition-colors hover:bg-bq-overlay/5"
      >
        Back to profile <ArrowRight className="size-4" />
      </Link>
    </Card>
  );
}
