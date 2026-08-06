"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Lock, Eye, EyeOff, KeyRound, ShieldCheck, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AuthShell,
  Field,
  PrimaryButton,
  FormHeader,
} from "@/components/auth/auth-ui";
import { resetPassword, type AuthState } from "@/app/auth-actions";

const STRENGTH = ["Weak", "Weak", "Fair", "Good", "Strong"] as const;

function scorePassword(password: string) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    resetPassword,
    { ok: false, message: "" },
  );
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const score = scorePassword(password);

  const eye = (
    <button
      type="button"
      onClick={() => setShowPw((v) => !v)}
      aria-label={showPw ? "Hide password" : "Show password"}
      className="shrink-0 text-bq-dim transition-colors hover:text-bq-heading"
    >
      {showPw ? <EyeOff className="size-[13px]" /> : <Eye className="size-[13px]" />}
    </button>
  );

  if (!token) return <MissingToken />;

  return (
    <AuthShell brand={<Brand />}>
      <form action={formAction} className="flex flex-col gap-7">
        <input type="hidden" name="token" value={token} />

        <span className="flex size-14 items-center justify-center rounded-[16px] border border-bq-border bg-bq-surface">
          <KeyRound className="size-6 text-bq-heading" />
        </span>

        <FormHeader
          title="Choose a new password"
          subtitle="Pick something you haven't used before."
        />

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Field
              label="New password"
              name="password"
              type={showPw ? "text" : "password"}
              icon={Lock}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              trailing={eye}
            />
            {password && (
              <div className="flex items-center gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors",
                      i < score ? "bg-bq-mint" : "bg-bq-border",
                    )}
                  />
                ))}
                <span className="pl-2 text-[11px] text-bq-mint">{STRENGTH[score]}</span>
              </div>
            )}
          </div>

          <Field
            label="Confirm password"
            name="confirm"
            type={showPw ? "text" : "password"}
            icon={Lock}
            placeholder="Repeat password"
            autoComplete="new-password"
            required
            trailing={eye}
          />
        </div>

        {state.message && (
          <p role="alert" className="-mt-3 text-[13px] text-bq-loss-text">
            {state.message}
          </p>
        )}

        <PrimaryButton icon={KeyRound} type="submit" disabled={pending}>
          {pending ? "Updating…" : "Set New Password"}
        </PrimaryButton>

        <Link
          href="/login"
          className="flex items-center gap-2 text-[13px] text-bq-dim transition-colors hover:text-bq-heading"
        >
          <ArrowLeft className="size-[13px]" />
          Back to sign in
        </Link>
      </form>
    </AuthShell>
  );
}

/** Reached when someone opens /reset-password without a link. */
function MissingToken() {
  return (
    <AuthShell brand={<Brand />}>
      <div className="flex flex-col gap-7">
        <span className="flex size-14 items-center justify-center rounded-[16px] border border-bq-border bg-bq-surface">
          <KeyRound className="size-6 text-bq-heading" />
        </span>
        <FormHeader
          title="This link is incomplete"
          subtitle="Open the reset link from your email, or request a new one."
        />
        <Link
          href="/forgot-password"
          className="rounded-[14px] bg-bq-mint py-[14px] text-center text-[13px] font-bold text-bq-on-fill hover:bg-bq-mint/90"
        >
          Request a new link
        </Link>
        <Link
          href="/login"
          className="flex items-center gap-2 text-[13px] text-bq-dim transition-colors hover:text-bq-heading"
        >
          <ArrowLeft className="size-[13px]" />
          Back to sign in
        </Link>
      </div>
    </AuthShell>
  );
}

function Brand() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-[28px] font-bold leading-[35px] text-bq-heading">
        One step from back in.
      </h2>
      <p className="max-w-[360px] text-[13px] leading-[21px] text-bq-heading/60">
        Set a new password and we&apos;ll sign you straight into your dashboard.
      </p>
      <div className="mt-3 flex items-center gap-3 rounded-[24px] border border-bq-overlay/10 bg-bq-overlay/5 px-[17px] py-[13px]">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-[14px] bg-bq-mint/15">
          <ShieldCheck className="size-[14px] text-bq-mint" />
        </span>
        <div className="flex flex-col gap-0.5">
          <p className="text-[11px] font-medium text-bq-heading">Secure reset process</p>
          <p className="text-[11px] text-bq-heading/50">
            Link expires in 15 min · Single use only
          </p>
        </div>
      </div>
    </div>
  );
}
