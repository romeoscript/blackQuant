"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import {
  AuthShell,
  Field,
  Divider,
  GoogleButton,
  PrimaryButton,
  FormHeader,
} from "@/components/auth/auth-ui";
import { Checkbox } from "@/components/ui/checkbox";

const STATS = [
  { value: "14,800+", label: "Traders" },
  { value: "$2.4B+", label: "Volume" },
  { value: "98.7%", label: "Uptime" },
];

const schema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);

  const set =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    toast.success("Welcome back — signing you in.");
    router.push("/dashboard");
  }

  return (
    <AuthShell brand={<Brand />}>
      <form onSubmit={onSubmit} className="flex flex-col gap-7">
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
            value={form.email}
            onChange={set("email")}
          />

          <Field
            label="Password"
            name="password"
            type={showPw ? "text" : "password"}
            icon={Lock}
            placeholder="Enter your password"
            autoComplete="current-password"
            value={form.password}
            onChange={set("password")}
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
                className="shrink-0 text-bq-dim transition-colors hover:text-white"
              >
                {showPw ? (
                  <EyeOff className="size-[13px]" />
                ) : (
                  <Eye className="size-[13px]" />
                )}
              </button>
            }
          />

          <div className="flex items-center gap-2.5 py-1">
            <Checkbox
              id="remember"
              checked={remember}
              onCheckedChange={(v) => setRemember(v === true)}
              className="border-bq-border bg-bq-surface data-[state=checked]:border-bq-mint data-[state=checked]:bg-bq-mint data-[state=checked]:text-black dark:bg-bq-surface"
            />
            <label htmlFor="remember" className="text-[11px] text-bq-dim">
              Remember me for 30 days
            </label>
          </div>
        </div>

        <PrimaryButton icon={LogIn} type="submit">
          Sign In
        </PrimaryButton>

        <Divider label="or continue with" />
        <GoogleButton />

        <p className="text-center text-[11px] text-bq-dim">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-bq-mint hover:underline">
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
      <h2 className="text-[28px] font-bold leading-[35px] text-white">
        Systematic edge. No guesswork.
      </h2>
      <p className="max-w-[360px] text-[13px] leading-[21px] text-white/60">
        Institutional-grade signal intelligence for independent traders. Four live
        strategies, real-time feeds, full control.
      </p>
      <div className="flex gap-6 pt-2">
        {STATS.map((s) => (
          <div key={s.label} className="flex flex-col gap-0.5">
            <span className="text-[18px] font-bold leading-[28px] text-bq-mint">
              {s.value}
            </span>
            <span className="text-[11px] uppercase tracking-[1.1px] text-white/50">
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
