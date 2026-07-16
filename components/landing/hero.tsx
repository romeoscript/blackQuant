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
            "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.05), transparent 55%)",
        }}
      />

      {/* subtle vertical grid (Figma hero dividers) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 flex justify-center">
        <div className="flex h-full w-full max-w-[1440px] items-stretch justify-between px-8 md:px-20">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className="w-px bg-white/[0.03]" />
          ))}
        </div>
      </div>

      {/* drifting particles */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white"
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

      <div className="relative mx-auto flex max-w-[1440px] flex-col items-center px-8 pt-24 text-center md:px-16">
        <div
          className="bq-in flex items-center gap-3 rounded-full border border-bq-border bg-bq-panel/70 px-4 py-2"
          style={{ animationDelay: "0ms" }}
        >
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

        <h1
          className="bq-in mt-10 max-w-4xl font-satoshi text-5xl font-black leading-[1.08] tracking-tight text-white sm:text-6xl md:text-[76px]"
          style={{ animationDelay: "120ms" }}
        >
          <span className="block">More than technology.</span>
          <FlipWords words={FLIP_WORDS} className="text-bq-muted" />
          <span className="block">blockchain ecosystem.</span>
        </h1>

        <p
          className="bq-in mt-8 max-w-xl font-satoshi text-[15px] leading-relaxed text-bq-muted"
          style={{ animationDelay: "240ms" }}
        >
          An ecosystem where visionaries find clarity and long-term direction
          powered by HFT-style MEV and yield farming to redefine financial
          empowerment for everyone.
        </p>

        <div
          className="bq-in mt-10 flex flex-wrap items-center justify-center gap-4"
          style={{ animationDelay: "360ms" }}
        >
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

        <div
          className="bq-in mt-14 flex items-center gap-4 font-plex text-[11px] uppercase tracking-[2px] text-bq-muted"
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
          className="bq-in mt-10 grid w-full max-w-3xl grid-cols-2 gap-y-8 border-t border-bq-border pt-10 sm:grid-cols-4 sm:gap-y-0"
          style={{ animationDelay: "600ms" }}
        >
          {HERO_STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={cn(
                "flex flex-col items-center gap-1 sm:py-1",
                i % 2 === 1 && "border-l border-bq-border",
                i > 0 && "sm:border-l sm:border-bq-border",
              )}
            >
              <CountUp
                value={stat.value}
                className="font-satoshi text-[28px] font-black text-bq-heading"
              />
              <span className="text-[12px] text-bq-muted">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* live WebGL globe with country callouts */}
      <div className="relative mt-16 flex justify-center pb-24">
        <Globe className="w-[min(96vw,960px)]" />
      </div>
    </section>
  );
}
