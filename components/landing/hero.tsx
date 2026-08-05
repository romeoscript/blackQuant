"use client";

import { Play } from "lucide-react";
import { useLenis } from "lenis/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { HERO_STATS } from "./data";
import { FlipWords } from "./flip-words";
import { CountUp } from "./count-up";
import { Globe } from "./globe";

const FLIP_WORDS = [
  "A human-centric",
  "A self-custodial",
  "A community-owned",
  "An AI-optimized",
  "A trust-minimized",
];

// Deterministic particle field (no Math.random → SSR-safe).
const PARTICLES = [
  { left: "8%", top: "22%", size: 3, delay: "0s", dur: "7s" },
  { left: "18%", top: "62%", size: 2, delay: "1.2s", dur: "9s" },
  { left: "27%", top: "38%", size: 4, delay: "2.1s", dur: "8s" },
  { left: "41%", top: "72%", size: 2, delay: "0.6s", dur: "10s" },
  { left: "52%", top: "18%", size: 3, delay: "1.8s", dur: "7.5s" },
  { left: "63%", top: "55%", size: 2, delay: "0.3s", dur: "9.5s" },
  { left: "72%", top: "30%", size: 4, delay: "2.6s", dur: "8.2s" },
  { left: "81%", top: "66%", size: 2, delay: "1s", dur: "7.8s" },
  { left: "90%", top: "26%", size: 3, delay: "2.3s", dur: "9.2s" },
  { left: "34%", top: "14%", size: 2, delay: "1.5s", dur: "8.6s" },
  { left: "58%", top: "78%", size: 3, delay: "0.9s", dur: "10.4s" },
  { left: "12%", top: "44%", size: 2, delay: "2.8s", dur: "7.2s" },
];

export function Hero() {
  const lenis = useLenis();

  return (
    <section className="relative overflow-hidden bg-bq-bg pt-[87px]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--bq-overlay) 5%, transparent), transparent 55%)",
        }}
      />

      {/* subtle vertical grid (Figma hero dividers) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 flex justify-center">
        <div className="flex h-full w-full max-w-[1440px] items-stretch justify-between px-8 md:px-20">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className="w-px bg-bq-overlay/[0.03]" />
          ))}
        </div>
      </div>

      {/* drifting particles */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-bq-overlay"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              animation: `bq-float ${p.dur} ease-in-out ${p.delay} infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto flex max-w-[1440px] flex-col items-center px-4 pt-12 text-center sm:px-8 sm:pt-24 md:px-16">
        <div
          className="bq-in flex items-center gap-2 rounded-full border border-bq-border bg-bq-panel/70 px-3 py-1.5 sm:gap-3 sm:px-4 sm:py-2"
          style={{ animationDelay: "0ms" }}
        >
          <span className="relative flex size-1.5 sm:size-2">
            <span className="absolute inline-flex size-1.5 animate-ping rounded-full bg-bq-green opacity-60 sm:size-2" />
            <span className="relative inline-flex size-1.5 rounded-full bg-bq-green sm:size-2" />
          </span>
          {/* The strip is 49 characters and has to stay on one line inside a
              440px frame, which caps the advance at ~6px per character. */}
          <span className="font-plex text-[8px] uppercase tracking-[0.8px] text-bq-text/80 sm:text-[11px] sm:tracking-[1.5px]">
            Elevation Hub · Luminary Circle · Live on Mainnet
          </span>
          <span className="shrink-0 rounded-full border border-bq-border px-1.5 font-plex text-[8px] text-bq-muted sm:px-2 sm:py-0.5 sm:text-[10px]">
            V2.4
          </span>
        </div>

        <h1
          className="bq-in mt-4 max-w-4xl font-satoshi text-[32px] font-black leading-[1.2] tracking-tight text-bq-heading sm:mt-10 sm:text-6xl sm:leading-[1.08] md:text-[76px]"
          style={{ animationDelay: "120ms" }}
        >
          <span className="block">More than technology.</span>
          <FlipWords words={FLIP_WORDS} className="text-bq-mint sm:text-bq-muted" />
          <span className="block">blockchain ecosystem.</span>
        </h1>

        <p
          className="bq-in mt-4 max-w-xl font-satoshi text-[13px] leading-[1.55] text-bq-muted sm:mt-8 sm:text-[15px] sm:leading-relaxed"
          style={{ animationDelay: "240ms" }}
        >
          An ecosystem where visionaries find clarity and long-term direction
          powered by HFT-style MEV and yield farming to redefine financial
          empowerment for everyone.
        </p>

        <div
          className="bq-in mt-7 flex flex-wrap items-center justify-center gap-3 sm:mt-10 sm:gap-4"
          style={{ animationDelay: "360ms" }}
        >
          <button
            onClick={() =>
              toast("Start Trading", {
                description: "Connect a wallet to launch the execution engine.",
              })
            }
            className="rounded-full bg-bq-contrast px-6 py-3 text-[13px] font-semibold text-bq-on-fill transition-transform hover:scale-[1.03] active:translate-y-px sm:px-7 sm:py-3.5 sm:text-sm"
          >
            Start Trading
          </button>
          <button
            onClick={() => lenis?.scrollTo("#infrastructure", { offset: -80 })}
            className="flex items-center gap-2 rounded-full border border-bq-border bg-bq-panel/60 px-6 py-3 text-[13px] font-semibold text-bq-heading transition-colors hover:bg-bq-overlay/5 sm:px-7 sm:py-3.5 sm:text-sm"
          >
            <Play className="size-3.5 fill-current" />
            View Bots
          </button>
        </div>

        <div
          className="bq-in mt-5 flex items-center gap-3 font-plex text-[10px] uppercase tracking-[2px] text-bq-muted sm:mt-14 sm:gap-4 sm:text-[11px]"
          style={{ animationDelay: "480ms" }}
        >
          <span className="h-px w-8 bg-bq-border" />
          <span>Vision</span>
          <span className="text-bq-dim">·</span>
          <span>Balance</span>
          <span className="text-bq-dim">·</span>
          <span>Sustainability</span>
          <span className="h-px w-8 bg-bq-border" />
        </div>

        <div
          className="bq-in mt-7 grid w-full max-w-3xl grid-cols-2 gap-1 sm:mt-10 sm:grid-cols-4 sm:gap-0 sm:border-t sm:border-bq-border sm:pt-10"
          style={{ animationDelay: "600ms" }}
        >
          {HERO_STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={cn(
                "flex flex-col items-center justify-center gap-1 max-sm:h-[71px] max-sm:rounded-xl max-sm:border max-sm:border-bq-border max-sm:bg-bq-card/60 sm:py-1",
                i > 0 && "sm:border-l sm:border-bq-border",
              )}
            >
              <CountUp
                value={stat.value}
                className="font-satoshi text-[24px] font-black text-bq-heading sm:text-[28px]"
              />
              <span className="text-[12px] text-bq-muted">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* live WebGL globe with country callouts */}
      <div className="relative mt-8 flex justify-center pb-10 sm:mt-16 sm:pb-24">
        <Globe className="w-[min(96vw,960px)]" />
      </div>
    </section>
  );
}
