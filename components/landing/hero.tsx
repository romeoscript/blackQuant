"use client";

import { Play } from "lucide-react";
import { useLenis } from "lenis/react";
import { toast } from "sonner";
import { HERO_STATS } from "./data";

export function Hero() {
  const lenis = useLenis();

  return (
    <section className="relative overflow-hidden bg-bq-bg pt-[87px]">
      {/* Faint network backdrop — approximates the Figma line-mesh texture. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.05), transparent 55%)",
        }}
      />

      <div className="relative mx-auto flex max-w-[1440px] flex-col items-center px-8 pt-24 text-center md:px-16">
        <div className="flex items-center gap-3 rounded-full border border-bq-border bg-bq-panel/70 px-4 py-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-2 animate-ping rounded-full bg-bq-green opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-bq-green" />
          </span>
          <span className="font-plex text-[11px] uppercase tracking-[1.5px] text-bq-text/80">
            Elevation Hub · Luminary Circle · Live on Mainnet
          </span>
          <span className="rounded-full border border-bq-border px-2 py-0.5 font-plex text-[10px] text-bq-muted">
            V2.4
          </span>
        </div>

        <h1 className="mt-10 max-w-4xl font-satoshi text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl md:text-[76px]">
          More than technology.
          <br />
          <span className="text-bq-muted">A human-centric</span>
          <br />
          blockchain ecosystem.
        </h1>

        <p className="mt-8 max-w-xl font-satoshi text-[15px] leading-relaxed text-bq-muted">
          An ecosystem where visionaries find clarity and long-term direction
          powered by HFT-style MEV and yield farming to redefine financial
          empowerment for everyone.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() =>
              toast("Start Trading", {
                description: "Connect a wallet to launch the execution engine.",
              })
            }
            className="rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-black transition-transform hover:scale-[1.03] active:translate-y-px"
          >
            Start Trading
          </button>
          <button
            onClick={() => lenis?.scrollTo("#infrastructure", { offset: -80 })}
            className="flex items-center gap-2 rounded-full border border-bq-border bg-bq-panel/60 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/5"
          >
            <Play className="size-3.5 fill-white" />
            View Bots
          </button>
        </div>

        <div className="mt-14 flex items-center gap-4 font-plex text-[11px] uppercase tracking-[2px] text-bq-muted">
          <span className="h-px w-8 bg-bq-border" />
          <span>Vision</span>
          <span className="text-bq-dim">·</span>
          <span>Balance</span>
          <span className="text-bq-dim">·</span>
          <span>Sustainability</span>
          <span className="h-px w-8 bg-bq-border" />
        </div>

        <div className="mt-10 grid w-full max-w-3xl grid-cols-2 gap-y-8 border-t border-bq-border pt-10 sm:grid-cols-4">
          {HERO_STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1">
              <span className="font-satoshi text-3xl font-bold text-white">
                {stat.value}
              </span>
              <span className="text-[12px] text-bq-muted">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CSS globe — stand-in for the Figma particle-globe render. */}
      <div className="relative mt-20 flex justify-center pb-24">
        <div className="relative aspect-square w-[min(90vw,760px)]">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 38% 32%, rgba(255,255,255,0.12), rgba(255,255,255,0.02) 42%, transparent 62%)",
              boxShadow: "0 0 160px 20px rgba(255,255,255,0.05)",
            }}
          />
          <div
            className="absolute inset-0 rounded-full opacity-40 mix-blend-screen"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.35) 0.5px, transparent 0.6px)",
              backgroundSize: "9px 9px",
              maskImage:
                "radial-gradient(circle at 42% 40%, black 30%, transparent 70%)",
              WebkitMaskImage:
                "radial-gradient(circle at 42% 40%, black 30%, transparent 70%)",
            }}
          />
        </div>
      </div>
    </section>
  );
}
