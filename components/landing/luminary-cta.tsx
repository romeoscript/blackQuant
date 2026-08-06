"use client";

import { useActionState, useEffect } from "react";
import { FileText, ArrowUpRight, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { notifyUnwired } from "./placeholder-link";
import { cn } from "@/lib/utils";
import { joinLuminaryCircle, type JoinState } from "@/app/actions";
import { Reveal } from "./reveal";
import { CountUp } from "./count-up";
import { CTA_STATS } from "./data";

function LuminaryForm() {
  const [state, formAction, pending] = useActionState<JoinState, FormData>(
    joinLuminaryCircle,
    { ok: false, message: "" },
  );

  useEffect(() => {
    if (state.ok) {
      toast.success("Welcome to the Luminary Circle", {
        description: state.message,
      });
    }
  }, [state.ok, state.message]);

  if (state.ok) {
    return (
      <div className="mt-8 flex max-w-md items-center gap-3 rounded-2xl border border-bq-green/30 bg-bq-green/5 px-5 py-4">
        <CheckCircle2 className="size-5 shrink-0 text-bq-green" />
        <p className="text-[14px] text-bq-text">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-8 max-w-md">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@wallet.eth"
          aria-label="Email address"
          aria-invalid={state.message ? true : undefined}
          className="flex-1 rounded-full border border-bq-border bg-bq-panel/60 px-5 py-3.5 text-sm text-bq-heading placeholder:text-bq-dim focus:border-bq-green/50 focus:outline-none focus:ring-1 focus:ring-bq-green/30"
        />
        <button
          type="submit"
          disabled={pending}
          className="flex items-center justify-center gap-2 rounded-full bg-bq-green px-7 py-3.5 text-sm font-semibold text-bq-on-fill transition-all hover:bg-bq-green/90 active:translate-y-px disabled:opacity-70"
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          {pending ? "Joining…" : "Join the Circle"}
        </button>
      </div>
      {state.message && (
        <p role="alert" className="mt-2.5 text-[13px] text-bq-loss-text">
          {state.message}
        </p>
      )}
      <p className="mt-3 font-plex text-[11px] uppercase tracking-[1px] text-bq-dim">
        Early access · Audit reports · Zero spam
      </p>
    </form>
  );
}

export function LuminaryCta() {
  return (
    <section
      id="community"
      className="bg-bq-bg px-4 pt-14 sm:px-8 md:px-16 md:pt-28"
    >
      <Reveal className="mx-auto max-w-[1312px]">
        <div className="grid gap-10 rounded-3xl border border-bq-border bg-gradient-to-b from-bq-card to-bq-panel p-5 md:grid-cols-[1.1fr_1fr] md:p-14">
          <div>
            <span className="flex w-fit items-center gap-2 rounded-full border border-bq-green/30 bg-bq-green/5 px-3.5 py-1.5">
              <span className="size-1.5 rounded-full bg-bq-green" />
              <span className="font-plex text-[11px] uppercase tracking-[2px] text-bq-green">
                Join the Luminary Circle
              </span>
            </span>
            <h2 className="mt-7 font-satoshi text-[34px] font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-[56px]">
              <span className="text-bq-heading">Clarity.</span>
              <br />
              <span className="text-bq-muted">Access.</span>
              <br />
              <span className="text-bq-heading">Empowerment.</span>
            </h2>
            <p className="mt-7 max-w-md font-satoshi text-[15px] leading-relaxed text-bq-muted">
              Tools once reserved for the elite — open, auditable, and yours.
              Join BlackQuant and start building long-term wealth through
              institutional-grade MEV infrastructure.
            </p>
            <LuminaryForm />

            <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-3">
              <button
                onClick={() =>
                  toast("Launch App", {
                    description:
                      "Connect a wallet to enter the BlackQuant app.",
                  })
                }
                className="flex items-center gap-1.5 text-sm font-semibold text-bq-heading transition-colors hover:text-bq-green"
              >
                Launch App <ArrowUpRight className="size-4" />
              </button>
              <button
                onClick={() => notifyUnwired("Read Docs")}
                className="flex items-center gap-1.5 text-sm font-semibold text-bq-muted transition-colors hover:text-bq-heading"
              >
                <FileText className="size-4" /> Read Docs
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1 self-center border-bq-border sm:grid-cols-1 sm:gap-0 sm:border-l">
            {CTA_STATS.map((s, i) => (
              <div
                key={s.label}
                className={cn(
                  // Mobile cards lead with the number, so the source order
                  // (label, then value) is reversed rather than duplicated.
                  "max-sm:flex max-sm:flex-col-reverse max-sm:items-center max-sm:justify-center max-sm:gap-1 max-sm:rounded-xl max-sm:border max-sm:border-bq-border max-sm:bg-bq-card/60 max-sm:py-4 sm:py-6 sm:pl-10",
                  i !== 0 && "sm:border-t sm:border-bq-border",
                )}
              >
                <p className="font-plex text-[10px] uppercase tracking-[1.5px] text-bq-muted">
                  {s.label}
                </p>
                <CountUp
                  value={s.value}
                  className="block font-satoshi font-bold tabular-nums text-bq-heading max-sm:text-2xl sm:mt-2 sm:text-3xl"
                />
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
