"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, LogIn, ShieldCheck } from "lucide-react";
import { logIn } from "@/app/auth-actions";
import {
  AuthShell,
  Field,
  Divider,
  GoogleButton,
  PrimaryButton,
  FormHeader,
} from "@/components/auth/auth-ui";
import { useAuthRedirect } from "@/hooks/use-auth-redirect";
import { Checkbox } from "@/components/ui/checkbox";
import type { AuthState } from "@/app/auth-actions";

const STATS = [
  { value: "14,800+", label: "Traders" },
  { value: "$2.4B+", label: "Volume" },
  { value: "98.7%", label: "Uptime" },
];

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    logIn,
    { ok: false, message: "" },
  );
  useAuthRedirect(state.ok);
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);

  return (
    <AuthShell brand={<Brand />}>
      <form action={formAction} className="flex flex-col gap-7">
        <FormHeader
          title="Welcome back"
          subtitle="Sign in to your BlackQuant account."
        />

        <div className="flex flex-col gap-4">
          <Field
            label="Email address"
            name="email"
            type="email"
            icon={Mail}
            placeholder="you@example.com"
            autoComplete="email"
            defaultValue=""
            required
          />

          <Field
            label="Password"
            name="password"
            type={showPw ? "text" : "password"}
            icon={Lock}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
            labelRight={
              <Link
                href="/forgot-password"
                className="text-[11px] text-bq-mint hover:underline"
              >
                Forgot password?
              </Link>
            }
            trailing={
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="shrink-0 text-bq-dim transition-colors hover:text-bq-heading"
              >
                {showPw ? (
                  <EyeOff className="size-[13px]" />
                ) : (
                  <Eye className="size-[13px]" />
                )}
              </button>
            }
          />

          {state.needsTwoFactor && (
            <Field
              label="Authentication code"
              name="twoFactor"
              type="text"
              icon={ShieldCheck}
              placeholder="6-digit code or recovery code"
              autoComplete="one-time-code"
              inputMode="numeric"
              autoFocus
              required
            />
          )}

          <div className="flex items-center gap-2.5 py-1">
            {/* Radix renders no native control, so the state is posted here. */}
            <input type="hidden" name="remember" value={String(remember)} />
            <Checkbox
              id="remember"
              checked={remember}
              onCheckedChange={(v) => setRemember(v === true)}
              className="border-bq-border bg-bq-surface data-[state=checked]:border-bq-mint data-[state=checked]:bg-bq-mint data-[state=checked]:text-bq-on-fill dark:bg-bq-surface"
            />
            <label htmlFor="remember" className="text-[11px] text-bq-dim">
              Remember me for 30 days
            </label>
          </div>
        </div>

        {state.message && (
          <p role="alert" className="-mt-3 text-[13px] text-bq-loss-text">
            {state.message}
          </p>
        )}

        <PrimaryButton icon={LogIn} type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign In"}
        </PrimaryButton>

        {googleEnabled && (
          <>
            <Divider label="or continue with" />

            <GoogleButton />
          </>
        )}

        <p className="text-center text-[11px] text-bq-dim">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-bq-mint hover:underline"
          >
            Create one
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

function Brand() {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-[28px] font-bold leading-[35px] text-bq-heading">
        Systematic edge. No guesswork.
      </h2>
      <p className="max-w-[360px] text-[13px] leading-[21px] text-bq-heading/60">
        Institutional-grade signal intelligence for independent traders. Four
        live strategies, real-time feeds, full control.
      </p>
      <div className="flex gap-6 pt-2">
        {STATS.map((s) => (
          <div key={s.label} className="flex flex-col gap-0.5">
            <span className="text-[18px] font-bold leading-[28px] text-bq-mint">
              {s.value}
            </span>
            <span className="text-[11px] uppercase tracking-[1.1px] text-bq-heading/50">
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
