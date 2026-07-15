"use client";

import { useActionState, useEffect } from "react";
import { FileText, ArrowUpRight, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { joinLuminaryCircle, type JoinState } from "@/app/actions";
import { Reveal } from "./reveal";
import { CTA_STATS, FOOTER_COLUMNS, AUDITS, CHAINS } from "./data";

function LuminaryForm() {
  const [state, formAction, pending] = useActionState<JoinState, FormData>(
    joinLuminaryCircle,
    { ok: false, message: "" },
  );

  useEffect(() => {
    if (state.ok) {
      toast.success("Welcome to the Luminary Circle", { description: state.message });
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
          className="flex-1 rounded-full border border-bq-border bg-bq-panel/60 px-5 py-3.5 text-sm text-white placeholder:text-bq-dim focus:border-bq-green/50 focus:outline-none focus:ring-1 focus:ring-bq-green/30"
        />
        <button
          type="submit"
          disabled={pending}
          className="flex items-center justify-center gap-2 rounded-full bg-bq-green px-7 py-3.5 text-sm font-semibold text-black transition-all hover:bg-bq-green/90 active:translate-y-px disabled:opacity-70"
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          {pending ? "Joining…" : "Join the Circle"}
        </button>
      </div>
      {state.message && (
        <p role="alert" className="mt-2.5 text-[13px] text-red-400">
          {state.message}
        </p>
      )}
      <p className="mt-3 font-plex text-[11px] uppercase tracking-[1px] text-bq-dim">
        Early access · Audit reports · Zero spam
      </p>
    </form>
  );
}

export function CtaFooter() {
  const notify = (label: string) =>
    toast(label, { description: "This destination isn't wired up in the demo yet." });

  return (
    <>
      <section id="community" className="bg-bq-bg px-8 pt-28 md:px-16">
        <Reveal className="mx-auto max-w-[1312px]">
          <div className="grid gap-10 rounded-3xl border border-bq-border bg-gradient-to-b from-bq-card to-bq-panel p-10 md:grid-cols-[1.1fr_1fr] md:p-14">
            <div>
              <span className="flex w-fit items-center gap-2 rounded-full border border-bq-green/30 bg-bq-green/5 px-3.5 py-1.5">
                <span className="size-1.5 rounded-full bg-bq-green" />
                <span className="font-plex text-[11px] uppercase tracking-[2px] text-bq-green">
                  Join the Luminary Circle
                </span>
              </span>
              <h2 className="mt-7 font-satoshi text-5xl font-bold leading-[1.05] tracking-tight md:text-[56px]">
                <span className="text-white">Clarity.</span>
                <br />
                <span className="text-bq-muted">Access.</span>
                <br />
                <span className="text-white">Empowerment.</span>
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
                      description: "Connect a wallet to enter the BlackQuant app.",
                    })
                  }
                  className="flex items-center gap-1.5 text-sm font-semibold text-white transition-colors hover:text-bq-green"
                >
                  Launch App <ArrowUpRight className="size-4" />
                </button>
                <button
                  onClick={() => notify("Read Docs")}
                  className="flex items-center gap-1.5 text-sm font-semibold text-bq-muted transition-colors hover:text-white"
                >
                  <FileText className="size-4" /> Read Docs
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 self-center border-bq-border sm:border-l">
              {CTA_STATS.map((s, i) => (
                <div
                  key={s.label}
                  className={cn("py-6 sm:pl-10", i !== 0 && "border-t border-bq-border")}
                >
                  <p className="font-plex text-[10px] uppercase tracking-[1.5px] text-bq-muted">
                    {s.label}
                  </p>
                  <p className="mt-2 font-satoshi text-3xl font-bold text-white">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      <footer id="about" className="mt-24 border-t border-bq-border bg-bq-bg px-8 py-16 md:px-16">
        <div className="mx-auto max-w-[1312px]">
          <div className="grid gap-12 lg:grid-cols-[1.3fr_repeat(5,1fr)]">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-full bg-white text-[15px] font-bold text-black">
                  B
                </span>
                <span className="text-xl font-bold tracking-tight text-white">BlackQuant</span>
              </div>
              <p className="mt-5 max-w-xs text-[13px] leading-relaxed text-bq-muted">
                A high-performance decentralized execution infrastructure.
                Human-centric, blockchain-bound.
              </p>
              <span className="mt-6 flex w-fit items-center gap-2 rounded-full border border-bq-green/30 bg-bq-green/5 px-3 py-1.5">
                <span className="size-1.5 rounded-full bg-bq-green" />
                <span className="text-[12px] text-bq-green">Live on Mainnet</span>
              </span>
              <div className="mt-4 flex flex-wrap gap-2">
                {AUDITS.map((a) => (
                  <span
                    key={a.firm}
                    className="rounded-full border border-bq-border px-2.5 py-1 text-[11px] text-bq-muted"
                  >
                    {a.firm}
                  </span>
                ))}
              </div>
            </div>

            {FOOTER_COLUMNS.map((col) => (
              <div key={col.heading}>
                <p className="font-plex text-[11px] uppercase tracking-[1.5px] text-bq-muted">
                  {col.heading}
                </p>
                <ul className="mt-5 space-y-3">
                  {col.links.map((link) => (
                    <li key={link}>
                      <button
                        onClick={() => notify(link)}
                        className="text-[13px] text-bq-text/70 transition-colors hover:text-white"
                      >
                        {link}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-14 flex flex-col gap-4 border-t border-bq-border pt-6 text-[12px] text-bq-muted md:flex-row md:items-center md:justify-between">
            <span>© 2025 BlackQuant · Non-Custodial · Elevation Hub</span>
            <div className="flex gap-6">
              {["Privacy", "Terms", "Cookie Policy"].map((l) => (
                <button key={l} onClick={() => notify(l)} className="hover:text-white">
                  {l}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span>Built on</span>
              {CHAINS.map((c) => (
                <span
                  key={c}
                  className="rounded border border-bq-border px-1.5 py-0.5 font-plex text-[10px] text-bq-text"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
