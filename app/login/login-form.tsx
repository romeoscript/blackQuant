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

type LoginState = AuthState & {
  /** Client-only: the pair from the password step, replayed with the code. */
  credentials?: { email: string; password: string };
};

const INITIAL_STATE: LoginState = { ok: false, message: "" };

/**
 * React resets a form's uncontrolled fields once its action settles, so by the
 * time the code step renders, the email and password inputs are already empty.
 * The pair is kept from the first submission and sent again with the code —
 * `authorize` needs all three together.
 */
async function submitLogin(
  prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const credentials =
    prev.needsTwoFactor && prev.credentials
      ? prev.credentials
      : {
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? ""),
        };
  formData.set("email", credentials.email);
  formData.set("password", credentials.password);

  const result = await logIn(INITIAL_STATE, formData);
  return result.needsTwoFactor ? { ...result, credentials } : result;
}

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  // Remounting the form is what discards a pending code step and the
  // credentials it holds; the action state has no other way to be cleared.
  const [attempt, setAttempt] = useState(0);

  return (
    <AuthShell brand={<Brand />}>
      <SignInForm
        key={attempt}
        googleEnabled={googleEnabled}
        onStartOver={() => setAttempt((n) => n + 1)}
      />
    </AuthShell>
  );
}

function SignInForm({
  googleEnabled,
  onStartOver,
}: {
  googleEnabled: boolean;
  onStartOver: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    submitLogin,
    INITIAL_STATE,
  );
  useAuthRedirect(state.ok);
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const awaitingCode = state.needsTwoFactor === true;

  return (
    <form action={formAction} className="flex flex-col gap-7">
      {awaitingCode ? (
        <FormHeader
          title="Two-factor authentication"
          subtitle="Enter the code from your authenticator app to finish signing in."
        />
      ) : (
        <FormHeader
          title="Welcome back"
          subtitle="Sign in to your BlackQuant account."
        />
      )}

      <div className="flex flex-col gap-4">
        {awaitingCode ? (
          <>
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
            <p className="text-[11px] text-bq-dim">
              Signing in as{" "}
              <span className="text-bq-heading">{state.credentials?.email}</span>
              {" · "}
              <button
                type="button"
                onClick={onStartOver}
                className="text-bq-mint hover:underline"
              >
                Use a different account
              </button>
            </p>
          </>
        ) : (
          <>
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
          </>
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

      <PrimaryButton
        icon={awaitingCode ? ShieldCheck : LogIn}
        type="submit"
        disabled={pending}
      >
        {pending ? "Signing in…" : awaitingCode ? "Verify" : "Sign In"}
      </PrimaryButton>

      {!awaitingCode && (
        <>
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
        </>
      )}
    </form>
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
