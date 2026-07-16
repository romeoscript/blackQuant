"use client";

import Image from "next/image";
import Link from "next/link";
import { Hexagon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Split auth layout: brand panel (chart backdrop) + centered form. Stacks on mobile. */
export function AuthShell({
  brand,
  children,
}: {
  brand: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bq-bg font-satoshi text-white lg:flex">
      <aside className="relative isolate flex flex-col justify-between gap-12 overflow-hidden p-8 pb-16 lg:w-[580px] lg:shrink-0 lg:p-10 lg:pb-10">
        <Image
          src="/auth/chart-bg.jpg"
          alt=""
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 580px"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(0,0,0,0.6),rgba(0,0,0,0.85))]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-bq-bg lg:hidden" />

        <Link href="/" className="relative z-10 flex w-fit items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-[24px] bg-[#121212]">
            <Hexagon className="size-4 text-bq-heading" strokeWidth={2} />
          </span>
          <span className="text-[15px] font-black tracking-[-0.375px] text-bq-heading">
            BlackQuant
          </span>
        </Link>
        <div className="relative z-10">{brand}</div>
      </aside>

      <main className="flex flex-1 items-center justify-center px-6 py-14 lg:px-16 lg:py-10">
        <div className="w-full max-w-[400px]">{children}</div>
      </main>
    </div>
  );
}

export function FormHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col gap-[5px]">
      <h1 className="text-[26px] font-bold leading-[34px] text-bq-heading">{title}</h1>
      <p className="text-[13px] text-bq-dim">{subtitle}</p>
    </div>
  );
}

type FieldProps = React.ComponentProps<typeof Input> & {
  label: string;
  icon?: LucideIcon;
  labelRight?: React.ReactNode;
  trailing?: React.ReactNode;
  valid?: boolean;
};

/** Labelled input built on the shadcn Input, wrapped to host a leading icon + trailing slot. */
export function Field({
  label,
  icon: Icon,
  labelRight,
  trailing,
  valid,
  className,
  id,
  name,
  ...props
}: FieldProps) {
  const fieldId = id ?? name;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <Label
          htmlFor={fieldId}
          className="text-[11px] font-medium uppercase tracking-[1.1px] text-bq-dim"
        >
          {label}
        </Label>
        {labelRight}
      </div>
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-[14px] border bg-bq-surface px-[17px] py-[13px] transition-colors focus-within:border-bq-mint",
          valid ? "border-bq-mint" : "border-bq-border",
        )}
      >
        {Icon && <Icon className="size-[13px] shrink-0 text-bq-dim" />}
        <Input
          id={fieldId}
          name={name}
          className={cn(
            "h-auto min-w-0 flex-1 rounded-none border-0 bg-transparent p-0 text-[13px] text-white shadow-none outline-none placeholder:text-bq-dim focus-visible:ring-0 md:text-[13px] dark:bg-transparent",
            className,
          )}
          {...props}
        />
        {trailing}
      </div>
    </div>
  );
}

export function PrimaryButton({
  icon: Icon,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { icon: LucideIcon }) {
  return (
    <Button
      {...props}
      className="h-auto w-full rounded-[14px] bg-bq-mint py-[14px] text-[13px] font-bold text-black hover:bg-bq-mint/90"
    >
      <Icon className="size-[14px]" />
      {children}
    </Button>
  );
}

export function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-bq-border" />
      <span className="shrink-0 text-[11px] text-bq-dim">{label}</span>
      <span className="h-px flex-1 bg-bq-border" />
    </div>
  );
}

/** Google OAuth isn't wired to a provider in this build — surfaces a toast. */
export function GoogleButton() {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() =>
        toast("Continue with Google", {
          description: "Google sign-in isn't connected in this preview yet.",
        })
      }
      className="h-auto w-full gap-2 rounded-[14px] border-bq-border bg-bq-surface py-[15px] text-[11px] font-medium text-bq-heading hover:border-white/25 hover:bg-bq-surface dark:border-bq-border dark:bg-bq-surface dark:hover:bg-bq-surface"
    >
      <Image src="/auth/google.svg" alt="" width={13} height={13} className="size-[13px]" />
      Google
    </Button>
  );
}
