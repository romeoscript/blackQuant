"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  Zap,
  ShieldCheck,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
import { signUp, type AuthState } from "@/app/auth-actions";

const FEATURES = [
  { icon: Zap, text: "Live signal engine with 4 proven strategies" },
  { icon: ShieldCheck, text: "Fully transparent — every decision is logged" },
  { icon: BarChart3, text: "Backtested, simulated, validated before live" },
];

const STRENGTH = ["Weak", "Weak", "Fair", "Good", "Strong"] as const;

function scorePassword(pw: string) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

export function SignUpForm({ googleEnabled }: { googleEnabled: boolean }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signUp,
    { ok: false, message: "" },
  );
  useAuthRedirect(state.ok);
  // Only the password is controlled — the strength meter needs to read it.
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const score = useMemo(() => scorePassword(password), [password]);

  const eye = (
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
  );

  return (
    <AuthShell brand={<Brand />}>
      <form action={formAction} className="flex flex-col gap-6">
        <FormHeader
          title="Create your account"
          subtitle="Free to start. No credit card required."
        />

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="First name"
              name="firstName"
              placeholder="Marcus"
              autoComplete="given-name"
              required
            />
            <Field
              label="Last name"
              name="lastName"
              placeholder="Webb"
              autoComplete="family-name"
              required
            />
          </div>

          <Field
            label="Email address"
            name="email"
            type="email"
            icon={Mail}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <div className="flex flex-col gap-2">
            <Field
              label="Password"
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
                <span className="pl-2 text-[11px] text-bq-mint">
                  {STRENGTH[score]}
                </span>
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
          />

          <div className="flex items-start gap-2.5 py-1">
            <Checkbox
              checked={agree}
              onCheckedChange={(v) => setAgree(v === true)}
              aria-label="Agree to Terms of Service and Privacy Policy"
              className="mt-0.5 border-bq-border bg-bq-surface data-[state=checked]:border-bq-mint data-[state=checked]:bg-bq-mint data-[state=checked]:text-bq-on-fill dark:bg-bq-surface"
            />
            <p className="text-[11px] leading-[17px] text-bq-dim">
              I agree to the <Legal label="Terms of Service" /> and{" "}
              <Legal label="Privacy Policy" />
            </p>
          </div>
        </div>

        {state.message && (
          <p role="alert" className="-mt-2 text-[13px] text-bq-loss-text">
            {state.message}
          </p>
        )}

        <PrimaryButton
          icon={UserPlus}
          type="submit"
          disabled={!agree || pending}
        >
          {pending ? "Creating account…" : "Create Account"}
        </PrimaryButton>

        {googleEnabled && (
          <>
            <Divider label="or sign up with" />

            <GoogleButton />
          </>
        )}

        <p className="text-center text-[11px] text-bq-dim">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-bq-mint hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

function Legal({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() =>
        toast(label, {
          description: "This document isn't available in the preview.",
        })
      }
      className="text-bq-mint hover:underline"
    >
      {label}
    </button>
  );
}

function Brand() {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-[28px] font-bold leading-[35px] text-bq-heading">
        Start trading smarter today.
      </h2>
      <p className="max-w-[360px] text-[13px] leading-[21px] text-bq-heading/60">
        Join 14,800+ traders using BlackQuant&apos;s systematic signal engine to
        capture consistent, data-validated edges across major pairs.
      </p>
      <div className="grid grid-cols-3 gap-3 pt-2 lg:flex lg:flex-col lg:gap-3">
        {FEATURES.map(({ icon: Icon, text }) => (
          <div
            key={text}
            className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-[14px] bg-bq-mint/15">
              <Icon className="size-[11px] text-bq-mint" />
            </span>
            <span className="text-[11px] leading-[14px] text-bq-heading/70">
              {text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
