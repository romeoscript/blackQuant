"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mail,
  CircleCheck,
  KeyRound,
  Send,
  RotateCw,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import {
  AuthShell,
  Field,
  PrimaryButton,
  FormHeader,
} from "@/components/auth/auth-ui";

const emailSchema = z.email();

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const valid = emailSchema.safeParse(email).success;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) {
      toast.error("Enter a valid email address");
      return;
    }
    toast.success("Reset link sent — check your inbox.");
  }

  return (
    <AuthShell brand={<Brand />}>
      <form onSubmit={onSubmit} className="flex flex-col gap-7">
        <span className="flex size-14 items-center justify-center rounded-[16px] border border-bq-border bg-bq-surface">
          <KeyRound className="size-6 text-bq-heading" />
        </span>

        <FormHeader
          title="Reset your password"
          subtitle="Enter your email and we'll send you a secure reset link."
        />

        <div className="flex flex-col gap-1.5">
          <Field
            label="Email address"
            name="email"
            type="email"
            icon={Mail}
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            valid={valid}
            trailing={
              valid ? <CircleCheck className="size-[13px] shrink-0 text-bq-mint" /> : null
            }
          />
          <p className="text-[11px] text-bq-dim">
            We&apos;ll only send a link if this email has an account.
          </p>
        </div>

        <PrimaryButton icon={Send} type="submit">
          Send Reset Link
        </PrimaryButton>

        <div className="rounded-[24px] border border-bq-border bg-bq-surface p-4">
          <p className="text-[11px] font-medium text-bq-heading">
            Didn&apos;t receive the email?
          </p>
          <p className="mt-1 text-[11px] leading-[14px] text-bq-dim">
            Check your spam folder. If it&apos;s still missing, wait 60 seconds
            before resending.
          </p>
          <button
            type="button"
            onClick={() => toast("Resending reset link…")}
            className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-bq-mint hover:underline"
          >
            <RotateCw className="size-[11px]" />
            Resend email
          </button>
        </div>

        <Link
          href="/login"
          className="flex items-center gap-2 text-[13px] text-bq-dim transition-colors hover:text-white"
        >
          <ArrowLeft className="size-[13px]" />
          Back to sign in
        </Link>
      </form>
    </AuthShell>
  );
}

function Brand() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-[28px] font-bold leading-[35px] text-white">
        It happens to everyone.
      </h2>
      <p className="max-w-[360px] text-[13px] leading-[21px] text-white/60">
        Enter the email linked to your account and we&apos;ll send a secure reset
        link. Valid for 15 minutes.
      </p>
      <div className="mt-3 flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/5 px-[17px] py-[13px]">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-[14px] bg-bq-mint/15">
          <ShieldCheck className="size-[14px] text-bq-mint" />
        </span>
        <div className="flex flex-col gap-0.5">
          <p className="text-[11px] font-medium text-white">Secure reset process</p>
          <p className="text-[11px] text-white/50">
            Link expires in 15 min · Single use only
          </p>
        </div>
      </div>
    </div>
  );
}
