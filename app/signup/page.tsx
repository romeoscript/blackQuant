"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { z } from "zod";
import { cn } from "@/lib/utils";
import {
  AuthShell,
  Field,
  Divider,
  GoogleButton,
  PrimaryButton,
  FormHeader,
} from "@/components/auth/auth-ui";
import { Checkbox } from "@/components/ui/checkbox";

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

const schema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    email: z.email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string(),
    agree: z.boolean(),
  })
  .refine((d) => d.agree, {
    path: ["agree"],
    message: "Please accept the Terms to continue",
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Passwords don't match",
  });

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [agree, setAgree] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const set =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const score = useMemo(() => scorePassword(form.password), [form.password]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = schema.safeParse({ ...form, agree });
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    toast.success("Account created — welcome to BlackQuant.");
    router.push("/login");
  }

  const eye = (
    <button
      type="button"
      onClick={() => setShowPw((v) => !v)}
      aria-label={showPw ? "Hide password" : "Show password"}
      className="shrink-0 text-bq-dim transition-colors hover:text-white"
    >
      {showPw ? <EyeOff className="size-[13px]" /> : <Eye className="size-[13px]" />}
    </button>
  );

  return (
    <AuthShell brand={<Brand />}>
      <form onSubmit={onSubmit} className="flex flex-col gap-6">
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
              value={form.firstName}
              onChange={set("firstName")}
            />
            <Field
              label="Last name"
              name="lastName"
              placeholder="Webb"
              autoComplete="family-name"
              value={form.lastName}
              onChange={set("lastName")}
            />
          </div>

          <Field
            label="Email address"
            name="email"
            type="email"
            icon={Mail}
            placeholder="you@example.com"
            autoComplete="email"
            value={form.email}
            onChange={set("email")}
          />

          <div className="flex flex-col gap-2">
            <Field
              label="Password"
              name="password"
              type={showPw ? "text" : "password"}
              icon={Lock}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              value={form.password}
              onChange={set("password")}
              trailing={eye}
            />
            {form.password && (
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
            value={form.confirm}
            onChange={set("confirm")}
          />

          <div className="flex items-start gap-2.5 py-1">
            <Checkbox
              checked={agree}
              onCheckedChange={(v) => setAgree(v === true)}
              aria-label="Agree to Terms of Service and Privacy Policy"
              className="mt-0.5 border-bq-border bg-bq-surface data-[state=checked]:border-bq-mint data-[state=checked]:bg-bq-mint data-[state=checked]:text-black dark:bg-bq-surface"
            />
            <p className="text-[11px] leading-[17px] text-bq-dim">
              I agree to the <Legal label="Terms of Service" /> and{" "}
              <Legal label="Privacy Policy" />
            </p>
          </div>
        </div>

        <PrimaryButton icon={UserPlus} type="submit">
          Create Account
        </PrimaryButton>

        <Divider label="or sign up with" />
        <GoogleButton />

        <p className="text-center text-[11px] text-bq-dim">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-bq-mint hover:underline">
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
        toast(label, { description: "This document isn't available in the preview." })
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
      <h2 className="text-[28px] font-bold leading-[35px] text-white">
        Start trading smarter today.
      </h2>
      <p className="max-w-[360px] text-[13px] leading-[21px] text-white/60">
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
            <span className="text-[11px] leading-[14px] text-white/70">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
