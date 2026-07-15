"use client";

import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { gsap, useGSAP } from "@/lib/gsap";
import { Reveal } from "./reveal";
import { FEATURES, type Feature } from "./data";

const ACCENT = {
  green: {
    hex: "#4ade80",
    text: "text-bq-green",
    bg: "bg-bq-green",
    glow: "shadow-[0_0_10px_4px_rgba(74,222,128,0.33)]",
    tickGlow: "0 0 12px 3px rgba(74,222,128,0.5)",
    pill: "border-bq-green/30 bg-bq-green/5",
    radial: "rgba(74,222,128,0.07)",
    rule: "rgba(74,222,128,0.21)",
  },
  blue: {
    hex: "#3b82f6",
    text: "text-bq-blue",
    bg: "bg-bq-blue",
    glow: "shadow-[0_0_10px_4px_rgba(59,130,246,0.33)]",
    tickGlow: "0 0 12px 3px rgba(59,130,246,0.5)",
    pill: "border-bq-blue/30 bg-bq-blue/5",
    radial: "rgba(59,130,246,0.07)",
    rule: "rgba(59,130,246,0.21)",
  },
} as const;

/** AI/tech background clip per feature (public/videos, Pexels — free license). */
const VIDEO: Record<string, string> = {
  "01": "/videos/feature-01-data.mp4",
  "02": "/videos/feature-02-core.mp4",
  "03": "/videos/feature-03-network.mp4",
  "04": "/videos/feature-04-ai.mp4",
};

/** Scroll distance (in viewport heights) each feature occupies while pinned. */
const SEGMENT = 1;
/** Extra scroll so the last feature rests on screen before the section releases. */
const TAIL = 0.6;
const COUNT = String(FEATURES.length).padStart(2, "0");

export function Performance() {
  const stageRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const stage = stageRef.current;
      if (!stage) return;

      const mm = gsap.matchMedia();

      mm.add(
        "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
        () => {
          // Reveal the pinned markup and hide the stacked fallback.
          stage.setAttribute("data-pinned", "");

          const layers = gsap.utils.toArray<HTMLElement>("[data-layer]", stage);
          const bgLayers = gsap.utils.toArray<HTMLElement>("[data-bg-layer]", stage);
          const bgVideos = bgLayers.map((l) =>
            l.querySelector<HTMLVideoElement>("video"),
          );
          const metas = gsap.utils.toArray<HTMLElement>("[data-meta]", stage);
          const ticks = gsap.utils.toArray<HTMLElement>("[data-tick]", stage);
          const fill = stage.querySelector<HTMLElement>("[data-fill]");
          const last = FEATURES.length - 1;

          const masked = (l: HTMLElement) =>
            l.querySelectorAll<HTMLElement>("[data-rv]");
          const soft = (l: HTMLElement) =>
            l.querySelectorAll<HTMLElement>("[data-fade]");

          // Run the clips only while the section is engaged (crossfade hides
          // the inactive ones); pause everything once it scrolls out of view.
          const playAll = () => bgVideos.forEach((v) => v?.play().catch(() => {}));
          const pauseAll = () => bgVideos.forEach((v) => v?.pause());

          // Initial state: first feature composed, the rest parked off-stage.
          layers.forEach((l, i) => {
            gsap.set(masked(l), { yPercent: i === 0 ? 0 : 118 });
            gsap.set(soft(l), { autoAlpha: i === 0 ? 1 : 0, y: i === 0 ? 0 : 16 });
          });
          bgLayers.forEach((g, i) => gsap.set(g, { autoAlpha: i === 0 ? 1 : 0 }));
          metas.forEach((m, i) =>
            gsap.set(m, { yPercent: i === 0 ? 0 : 100, autoAlpha: i === 0 ? 1 : 0 }),
          );
          ticks.forEach((t, i) => {
            const a = ACCENT[FEATURES[i].accent];
            gsap.set(
              t,
              i === 0
                ? {
                    scale: 1.4,
                    backgroundColor: a.hex,
                    borderColor: a.hex,
                    boxShadow: a.tickGlow,
                  }
                : { scale: 1 },
            );
          });

          const tl = gsap.timeline({
            defaults: { ease: "power3.out" },
            scrollTrigger: {
              trigger: stage,
              start: () =>
                `top ${Math.max(96, (window.innerHeight - stage.offsetHeight) / 2)}`,
              end: () => "+=" + (last * SEGMENT + TAIL) * window.innerHeight,
              pin: true,
              scrub: 1.1,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onToggle: (self) => (self.isActive ? playAll() : pauseAll()),
            },
          });

          // Continuous progress fill runs the full length of the sequence.
          if (fill) {
            tl.fromTo(
              fill,
              { scaleY: 0 },
              { scaleY: 1, ease: "none", duration: last * SEGMENT },
              0,
            );
          }

          for (let b = 0; b < last; b++) {
            const s = b * SEGMENT + 0.62;
            const next = ACCENT[FEATURES[b + 1].accent];

            tl
              // background clip crossfades to the next feature
              .to(bgLayers[b], { autoAlpha: 0, duration: 0.45, ease: "none" }, s)
              .to(bgLayers[b + 1], { autoAlpha: 1, duration: 0.55, ease: "none" }, s + 0.05)
              // outgoing content wipes up and out
              .to(
                masked(layers[b]),
                { yPercent: -118, duration: 0.4, stagger: 0.05, ease: "power3.in" },
                s,
              )
              .to(
                soft(layers[b]),
                { autoAlpha: 0, y: -16, duration: 0.3, stagger: 0.04, ease: "power2.in" },
                s,
              )
              // incoming content rises into the vacated space
              .fromTo(
                masked(layers[b + 1]),
                { yPercent: 118 },
                { yPercent: 0, duration: 0.6, stagger: 0.07, ease: "power3.out" },
                s + 0.14,
              )
              .fromTo(
                soft(layers[b + 1]),
                { autoAlpha: 0, y: 16 },
                { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "power2.out" },
                s + 0.24,
              )
              // meta bar slides to the next label
              .to(
                metas[b],
                { yPercent: -100, autoAlpha: 0, duration: 0.4, ease: "power3.in" },
                s,
              )
              .fromTo(
                metas[b + 1],
                { yPercent: 100, autoAlpha: 0 },
                { yPercent: 0, autoAlpha: 1, duration: 0.45, ease: "power3.out" },
                s + 0.12,
              )
              // rail node handoff
              .to(
                ticks[b],
                {
                  scale: 1,
                  backgroundColor: "#080808",
                  borderColor: "#1f1f1f",
                  boxShadow: "none",
                  duration: 0.3,
                },
                s,
              )
              .to(
                ticks[b + 1],
                {
                  scale: 1.4,
                  backgroundColor: next.hex,
                  borderColor: next.hex,
                  boxShadow: next.tickGlow,
                  duration: 0.35,
                },
                s + 0.15,
              );
          }

          // Let the final feature rest before the pin releases.
          tl.to({}, { duration: TAIL });

          return () => {
            bgVideos.forEach((v) => v?.pause());
            stage.removeAttribute("data-pinned");
          };
        },
      );

      return () => mm.revert();
    },
    { scope: stageRef },
  );

  return (
    <section id="features" className="bg-bq-bg px-8 pt-28 md:px-16">
      <div className="mx-auto max-w-[1312px]">
        <Reveal className="pb-4 text-center">
          <p className="font-plex text-[11px] uppercase tracking-[2px] text-bq-muted">
            The Engine
          </p>
          <h2 className="mt-4 font-satoshi text-4xl font-bold tracking-tight md:text-[52px]">
            <span className="text-white">Built for </span>
            <span className="text-bq-muted">Performance.</span>
          </h2>
        </Reveal>

        <div ref={stageRef} className="group mt-8 border-t border-bq-border">
          {/* Stacked layout — mobile, reduced-motion, and pre-hydration. */}
          <div className="group-data-pinned:hidden">
            {FEATURES.map((f) => (
              <Reveal key={f.index}>
                <StackedFeature feature={f} />
              </Reveal>
            ))}
          </div>

          {/* Pinned layout — desktop with motion enabled. */}
          <div className="hidden group-data-pinned:block">
            {/* meta bar */}
            <div className="relative h-12 overflow-hidden">
              {FEATURES.map((f) => (
                <MetaRow key={f.index} feature={f} />
              ))}
            </div>

            <div className="grid h-[min(600px,calc(100vh-260px))] grid-cols-[1.35fr_1fr] border-t border-bq-border-soft">
              {/* left rail: AI video feed · progress track */}
              <div className="relative overflow-hidden border-r border-bq-border-soft bg-bq-panel">
                {FEATURES.map((f) => (
                  <VideoLayer key={f.index} feature={f} />
                ))}

                {/* progress track */}
                <div className="absolute bottom-12 left-10 top-12 w-px bg-bq-border/70">
                  <div
                    data-fill
                    className="absolute inset-x-0 top-0 h-full origin-top scale-y-0"
                    style={{
                      background: `linear-gradient(to bottom, ${FEATURES.map(
                        (f) => ACCENT[f.accent].hex,
                      ).join(", ")})`,
                    }}
                  />
                  {FEATURES.map((f, i) => (
                    <span
                      key={f.index}
                      data-tick
                      className="absolute left-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-bq-border bg-bq-bg"
                      style={{ top: `${(i / (FEATURES.length - 1)) * 100}%` }}
                    />
                  ))}
                </div>

                <span className="absolute bottom-11 left-16 font-plex text-[10px] uppercase tracking-[2px] text-bq-dim">
                  Execution Layer
                </span>
              </div>

              {/* right column: stacked animated content layers */}
              <div className="relative">
                {FEATURES.map((f) => (
                  <ContentLayer key={f.index} feature={f} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Clip-masked block that wipes in/out. Outer clips; inner is the tweened node. */
function Rv({
  children,
  className,
  outer,
}: {
  children: ReactNode;
  className?: string;
  outer?: string;
}) {
  return (
    <div className={cn("overflow-hidden pb-1", outer)}>
      <div data-rv className={cn("will-change-transform", className)}>
        {children}
      </div>
    </div>
  );
}

/** One feature's content, absolutely stacked; GSAP composes them in sequence. */
function ContentLayer({ feature }: { feature: Feature }) {
  const a = ACCENT[feature.accent];
  return (
    <div
      data-layer
      className="absolute inset-0 flex flex-col justify-center px-2 md:px-14"
    >
      <Rv className="flex items-center gap-2.5">
        <span className={cn("h-[1.5px] w-6 rounded-full", a.bg)} />
        <span
          className={cn("font-plex text-[10px] uppercase tracking-[2px]", a.text)}
        >
          {feature.kicker}
        </span>
      </Rv>

      <Rv
        outer="mt-5"
        className="max-w-[380px] font-satoshi text-[34px] font-bold leading-[1.12] tracking-tight text-bq-heading"
      >
        {feature.title}
      </Rv>

      <Rv
        outer="mt-5"
        className="max-w-[380px] font-satoshi text-[14px] leading-[1.9] text-bq-dim"
      >
        {feature.body}
      </Rv>

      <div className="mt-6 space-y-3.5">
        {feature.bullets.map((b) => (
          <div
            key={b}
            data-fade
            className="flex items-center gap-3.5 will-change-transform"
          >
            <span className={cn("size-[7px] rounded-[3.5px]", a.bg, a.glow)} />
            <span className="font-satoshi text-[13px] text-bq-text">{b}</span>
          </div>
        ))}
      </div>

      <Rv outer="mt-10" className="max-w-[380px]">
        <div
          className="h-px w-full"
          style={{
            background: `linear-gradient(to right, ${a.rule}, transparent)`,
          }}
        />
        <div className="mt-4 flex items-center justify-between">
          <span className="font-satoshi text-[9px] text-bq-dim">BlackLabs</span>
          <span className={cn("font-plex text-[9px] opacity-50", a.text)}>
            {feature.index} / {COUNT}
          </span>
        </div>
      </Rv>
    </div>
  );
}

/** Full-bleed AI clip for the rail, accent-tinted; layers crossfade in GSAP. */
function VideoLayer({ feature }: { feature: Feature }) {
  const a = ACCENT[feature.accent];
  return (
    <div data-bg-layer className="absolute inset-0 isolate">
      <video
        src={VIDEO[feature.index]}
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
        style={{ filter: "brightness(0.82) contrast(1.05) saturate(1.05)" }}
      />
      {/* accent tint */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ backgroundColor: a.hex, mixBlendMode: "soft-light", opacity: 0.4 }}
      />
      {/* readability gradient — darkest on the left where the track sits */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(3,3,3,0.94) 0%, rgba(3,3,3,0.5) 42%, rgba(3,3,3,0.18) 70%, rgba(3,3,3,0.55) 100%)",
        }}
      />
      {/* accent glow */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 72% 40%, ${a.radial}, transparent 62%)`,
        }}
      />
      {/* top/bottom vignette to seat the clip in the panel */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(3,3,3,0.6) 0%, transparent 22%, transparent 78%, rgba(3,3,3,0.6) 100%)",
        }}
      />

      {/* live-feed tag */}
      <span className="absolute left-9 top-7 flex items-center gap-1.5 font-plex text-[9px] uppercase tracking-[2px] text-bq-text/70">
        <span className={cn("size-1.5 rounded-full", a.bg, a.glow)} />
        Live Feed
      </span>

      {/* quiet structural numeral */}
      <span
        className={cn(
          "absolute right-8 top-5 font-clash text-[76px] font-medium leading-none opacity-30",
          a.text,
        )}
      >
        {feature.index}
      </span>
    </div>
  );
}

/** A meta-bar row; layers are mask-slid by GSAP. */
function MetaRow({ feature }: { feature: Feature }) {
  const a = ACCENT[feature.accent];
  return (
    <div
      data-meta
      className="absolute inset-0 flex items-center justify-between font-plex text-[10px] uppercase tracking-[1.5px] will-change-transform"
    >
      <div className="flex items-center gap-3">
        <span className={a.text}>{feature.index}</span>
        <span className="text-bq-dim">|</span>
        <span className="text-bq-muted">{feature.kicker}</span>
        <span className={cn("size-1.5 rounded-full", a.bg, a.glow)} />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-bq-text">{feature.meta}</span>
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-2.5 py-1",
            a.pill,
          )}
        >
          <span className={cn("size-1.5 rounded-full", a.bg)} />
          <span className={a.text}>Live</span>
        </span>
        <span className="text-bq-dim">
          {feature.index} / {COUNT}
        </span>
      </div>
    </div>
  );
}

/** Original stacked block — used for mobile / reduced-motion / pre-hydration. */
function StackedFeature({ feature }: { feature: Feature }) {
  const a = ACCENT[feature.accent];

  return (
    <div className="border-b border-bq-border">
      <div className="flex items-center justify-between py-4 font-plex text-[10px] uppercase tracking-[1.5px]">
        <div className="flex items-center gap-3">
          <span className={a.text}>{feature.index}</span>
          <span className="text-bq-dim">|</span>
          <span className="text-bq-muted">{feature.kicker}</span>
          <span className={cn("size-1.5 rounded-full", a.bg, a.glow)} />
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-bq-text sm:inline">{feature.meta}</span>
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1",
              a.pill,
            )}
          >
            <span className={cn("size-1.5 rounded-full", a.bg)} />
            <span className={a.text}>Live</span>
          </span>
          <span className="text-bq-dim">
            {feature.index} / {COUNT}
          </span>
        </div>
      </div>

      <div className="grid gap-0 border-t border-bq-border-soft md:grid-cols-[1.4fr_1fr]">
        <div className="relative hidden min-h-[420px] overflow-hidden border-r border-bq-border-soft bg-bq-panel md:block">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 30% 45%, ${a.radial}, transparent 55%)`,
            }}
          />
          <span
            className={cn(
              "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-clash text-[clamp(120px,13vw,190px)] font-medium leading-none opacity-[0.1]",
              a.text,
            )}
          >
            {feature.index}
          </span>
        </div>

        <div className="relative flex flex-col justify-center px-2 py-12 md:px-14">
          <span
            className={cn(
              "font-clash text-[80px] font-medium leading-none opacity-[0.08] md:hidden",
              a.text,
            )}
          >
            {feature.index}
          </span>

          <div className="mt-6 flex items-center gap-2.5 md:mt-0">
            <span className={cn("h-[1.5px] w-6 rounded-full", a.bg)} />
            <span
              className={cn(
                "font-plex text-[10px] uppercase tracking-[2px]",
                a.text,
              )}
            >
              {feature.kicker}
            </span>
          </div>

          <h3 className="mt-5 max-w-[360px] font-satoshi text-[32px] font-bold leading-[1.1] tracking-tight text-bq-heading">
            {feature.title}
          </h3>

          <p className="mt-5 max-w-[380px] font-satoshi text-[14px] leading-[1.9] text-bq-dim">
            {feature.body}
          </p>

          <ul className="mt-6 space-y-4">
            {feature.bullets.map((b) => (
              <li key={b} className="flex items-center gap-3.5">
                <span className={cn("size-[7px] rounded-[3.5px]", a.bg, a.glow)} />
                <span className="font-satoshi text-[13px] text-bq-text">{b}</span>
              </li>
            ))}
          </ul>

          <div className="mt-12 max-w-[380px]">
            <div
              className="h-px w-full"
              style={{
                background: `linear-gradient(to right, ${a.rule}, transparent)`,
              }}
            />
            <div className="mt-4 flex items-center justify-between">
              <span className="font-satoshi text-[9px] text-bq-dim">BlackLabs</span>
              <span className={cn("font-plex text-[9px] opacity-50", a.text)}>
                {feature.index} / {COUNT}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
