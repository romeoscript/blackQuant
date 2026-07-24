"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Hub coordinates ([lat, lng]) for the animated flying arcs.
const HUBS: [number, number][] = [
  [55, -3], [1.35, 103.8], [-25, 133], [56, -106], [24, 54], [36, 128],
  [46, 2], [23, -102], [21, 78], [47, 8], [-14, -51], [35, 105], [51, 10],
];

const ARCS = HUBS.map((h, i) => {
  const to = HUBS[(i * 5 + 3) % HUBS.length];
  return {
    startLat: h[0],
    startLng: h[1],
    endLat: to[0],
    endLng: to[1],
    gap: (i % 7) / 7,
  };
});

// Names shown in the ring of labels orbiting around the globe.
const RING_LABELS: { name: string; live?: boolean }[] = [
  { name: "United States", live: true },
  { name: "Canada" },
  { name: "Mexico" },
  { name: "Brazil", live: true },
  { name: "Argentina" },
  { name: "United Kingdom", live: true },
  { name: "France" },
  { name: "Germany" },
  { name: "Nigeria" },
  { name: "UAE" },
  { name: "India", live: true },
  { name: "Singapore" },
  { name: "China" },
  { name: "Australia" },
];

const RING_PERIOD_MS = 60000; // one slow revolution per minute

function OrbitingLabels() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const n = RING_LABELS.length;

    // Cache the radius and only recompute on resize — reading clientWidth every
    // frame forces a synchronous layout (reflow) and is a jank source.
    let radius = (wrap.clientWidth / 2) * 0.96;
    const ro = new ResizeObserver(() => {
      radius = (wrap.clientWidth / 2) * 0.96;
    });
    ro.observe(wrap);

    const place = (phase: number) => {
      for (let i = 0; i < n; i++) {
        const el = itemRefs.current[i];
        if (!el) continue;
        const a = (i / n) * Math.PI * 2 + phase - Math.PI / 2;
        const x = Math.cos(a) * radius;
        const y = Math.sin(a) * radius * 0.92; // slight vertical squash
        el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
      }
    };

    // Reduced motion: position once, no ongoing animation loop.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      place(0);
      return () => ro.disconnect();
    }

    let raf = 0;
    let phase = 0;
    let last = 0;
    const speed = (Math.PI * 2) / RING_PERIOD_MS;
    const tick = (t: number) => {
      if (!last) last = t;
      phase += (t - last) * speed;
      last = t;
      place(phase);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div ref={wrapRef} className="pointer-events-none absolute inset-0">
      {RING_LABELS.map((d, i) => (
        <div
          key={d.name}
          ref={(el) => {
            itemRefs.current[i] = el;
          }}
          className="absolute left-1/2 top-1/2"
        >
          <span className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-bq-border bg-bq-panel/95 px-2.5 py-1 text-[11px] font-medium text-bq-text/80">
            <span
              className={cn(
                "size-1.5 rounded-full",
                d.live
                  ? "bg-bq-green shadow-[0_0_6px_2px_rgba(74,222,128,0.55)]"
                  : "bg-bq-muted",
              )}
            />
            {d.name}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Matches HEX_RES in scripts/build-globe-data.mjs. */
const HEX_RES = 2;

type GlobeData = { countries: object[]; coastlines: [number, number][][] };

export function Globe({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  // Only true between "we've decided to build the globe" and "it's on screen".
  // Kept separate from `ready` so the placeholder never spins on the paths that
  // deliberately skip WebGL (phones, low-memory devices, Save-Data).
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Skip the WebGL globe on phones — it's the single biggest main-thread cost
    // and tanks mobile TBT/LCP. The CSS halo + orbiting labels carry the hero.
    if (!window.matchMedia("(min-width: 768px)").matches) return;
    // Same reasoning for genuinely low-end machines and metered connections:
    // the globe is decorative, so degrade to the CSS halo rather than spend a
    // ~500 KB download and a WebGL render loop the device can't afford.
    const nav = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean };
    };
    if (nav.connection?.saveData || (nav.deviceMemory ?? 8) < 4) return;

    let world: { _destructor?: () => void } | null = null;
    let disposed = false;
    let onResize: (() => void) | null = null;
    let onVisibility: (() => void) | null = null;
    let io: IntersectionObserver | null = null;
    let gate: IntersectionObserver | null = null;

    const init = async () => {
      // Geometry is precomputed at build time (scripts/build-globe-data.mjs) and
      // served as a static asset, so the client pays a cheap native JSON.parse
      // instead of compiling ~163 KB of topojson embedded in a JS chunk — and
      // ships neither topojson-client nor the h3 validation pass.
      const [{ default: Globe }, data] = await Promise.all([
        import("globe.gl"),
        fetch("/globe-data.json").then((r) => r.json() as Promise<GlobeData>),
      ]);
      if (disposed || !containerRef.current) return;

      const { countries, coastlines } = data;
      const size = el.clientWidth;
      // `animateIn` tweens the globe up from scale 0 on a wall-clock timer that
      // only advances while the render loop runs. Because the loop is paused
      // whenever the globe is off-screen, that intro could be frozen at scale 0
      // and never recover. The container's own opacity transition already
      // provides the entrance, so the tween is redundant as well as fragile.
      const g = new Globe(el, { animateIn: false })
        .width(size)
        .height(size)
        .backgroundColor("rgba(0,0,0,0)")
        .showAtmosphere(true)
        .atmosphereColor("#25e07a")
        .atmosphereAltitude(0.16)
        // dotted continents
        .hexPolygonsData(countries)
        .hexPolygonResolution(HEX_RES)
        .hexPolygonMargin(0.18)
        .hexPolygonUseDots(true)
        .hexPolygonColor(() => "rgba(110,240,170,0.98)")
        // glowing coastline outlines — drawn as plain lines. The previous
        // polygons layer tessellated every landmass into cap/side solids that
        // were fully transparent, so all that geometry was built to be unseen.
        .pathsData(coastlines)
        .pathPointLat((p) => (p as number[])[0])
        .pathPointLng((p) => (p as number[])[1])
        .pathPointAlt(0.008)
        .pathColor(() => "#5cf0a0")
        .pathStroke(null) // null → cheap THREE.Line rather than a tube mesh
        .pathTransitionDuration(0)
        // animated flying arcs (GitHub-globe style)
        .arcsData(ARCS)
        .arcColor(() => ["rgba(74,222,128,0)", "rgba(150,255,195,0.9)"])
        .arcAltitudeAutoScale(0.45)
        .arcStroke(0.45)
        .arcDashLength(0.4)
        .arcDashGap(2)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .arcDashInitialGap((d: any) => d.gap)
        .arcDashAnimateTime(2600);

      // dark navy globe surface — only the dots/coastlines should glow.
      // Mutating the existing Color instances avoids importing `three` just for
      // its constructor (three is already pulled in transitively by globe.gl,
      // but a direct import pins another module into this chunk's graph).
      const mat = g.globeMaterial() as unknown as {
        color: { set: (v: string) => void };
        emissive: { set: (v: string) => void };
        emissiveIntensity?: number;
        shininess?: number;
      };
      mat.color.set("#04100a");
      mat.emissive.set("#031008");
      mat.emissiveIntensity = 0.15;
      mat.shininess = 0.2;

      // Keep the canvas fully transparent — no bloom/EffectComposer (which would
      // wash the whole canvas into an opaque rectangle). Glow comes from the
      // transparent atmosphere shell plus a CSS halo behind the canvas.
      g.renderer().setClearColor(0x000000, 0);
      // Render at 1x. On a ~960px canvas retina (2x) quadruples the fragments
      // shaded every frame, which is pure main-thread contention for a
      // decorative element — the atmosphere/halo hide the aliasing anyway.
      g.renderer().setPixelRatio(1);

      g.pointOfView({ lat: 12, lng: -55, altitude: 1.95 });
      const controls = g.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 3.2; // faster earth spin
      controls.enableZoom = false;
      controls.enablePan = false;

      onResize = () => {
        if (!containerRef.current) return;
        const s = containerRef.current.clientWidth;
        g.width(s).height(s);
      };
      window.addEventListener("resize", onResize);

      // Stop the WebGL render loop while the globe is scrolled off-screen so it
      // isn't burning frames (and contending with scroll) below the fold.
      let onScreen = true;
      const sync = () => {
        if (onScreen && !document.hidden) g.resumeAnimation();
        else g.pauseAnimation();
      };
      io = new IntersectionObserver(
        ([entry]) => {
          onScreen = entry.isIntersecting;
          sync();
        },
        { threshold: 0 },
      );
      io.observe(el);

      // A backgrounded tab still runs the loop otherwise — rAF throttles but
      // never stops, so the scene keeps re-rendering off-screen.
      onVisibility = sync;
      document.addEventListener("visibilitychange", onVisibility);

      world = g as unknown as typeof world;
      setReady(true);
    };

    // Hold the globe until it is actually approaching the viewport, the page has
    // finished loading, *and* the main thread has a genuinely idle moment. The
    // previous scheduling ran on a `requestIdleCallback` with a 2.5s timeout
    // regardless of position, forcing ~2s of WebGL setup into the middle of the
    // load window — the single largest contributor to Total Blocking Time.
    let idleId = 0;
    let timerId = 0;
    let started = false;

    const start = () => {
      if (started || disposed) return;
      started = true;
      setLoading(true);
      if (typeof window.requestIdleCallback === "function") {
        idleId = window.requestIdleCallback(() => init(), { timeout: 4000 });
      } else {
        timerId = window.setTimeout(() => init(), 400);
      }
    };

    // three.js + three-globe is ~500 KB and ~1.5s of main-thread build on
    // throttled hardware. The globe sits below the fold, so none of that should
    // land in the initial page load: arm on the first real user interaction,
    // then load once the globe is genuinely approaching the viewport.
    const arm = () => {
      if (disposed || gate) return;
      gate = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          gate?.disconnect();
          gate = null;
          start();
        },
        // Generous margin so the build is underway before it scrolls into view.
        { rootMargin: "400px 0px" },
      );
      gate.observe(el);
    };

    const INTERACTIONS = [
      "scroll",
      "pointerdown",
      "keydown",
      "touchstart",
    ] as const;
    const onInteract = () => {
      INTERACTIONS.forEach((e) => window.removeEventListener(e, onInteract));
      arm();
    };
    INTERACTIONS.forEach((e) =>
      window.addEventListener(e, onInteract, { passive: true, once: true }),
    );

    return () => {
      disposed = true;
      INTERACTIONS.forEach((e) => window.removeEventListener(e, onInteract));
      if (idleId) window.cancelIdleCallback(idleId);
      if (timerId) window.clearTimeout(timerId);
      if (onResize) window.removeEventListener("resize", onResize);
      if (onVisibility)
        document.removeEventListener("visibilitychange", onVisibility);
      gate?.disconnect();
      io?.disconnect();
      world?._destructor?.();
      if (el) el.innerHTML = "";
    };
  }, []);

  return (
    <div className={cn("relative aspect-square", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[16%] rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(circle, rgba(74,222,128,0.22), rgba(74,222,128,0.06) 45%, transparent 66%)",
          animation: "bq-glow 7s ease-in-out infinite",
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute left-[64%] top-[28%] size-28 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
        style={{
          background: "radial-gradient(circle, rgba(52,211,153,0.22), transparent 72%)",
        }}
      />

      {/* Placeholder while three.js downloads and the scene is built, so the
          hero reads as "loading" rather than as an empty hole. Pure CSS — it
          must not add to the very payload it is covering for. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-[12%] transition-opacity duration-700",
          loading && !ready ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="absolute inset-0 rounded-full border border-bq-green/15" />
        <div
          className="absolute inset-0 rounded-full border border-transparent border-t-bq-green/50"
          style={{ animation: "bq-spin-slow 2.4s linear infinite" }}
        />
        <div className="absolute inset-[14%] rounded-full border border-bq-green/10" />
        <span className="absolute inset-x-0 bottom-[-8%] text-center font-plex text-[10px] uppercase tracking-[2px] text-bq-dim">
          Initializing network
        </span>
      </div>

      <div
        ref={containerRef}
        className="relative size-full transition-opacity duration-1000 [&_canvas]:!outline-none"
        style={{ opacity: ready ? 1 : 0, pointerEvents: "none" }}
      />

      {/* country names orbiting around the globe */}
      <OrbitingLabels />
    </div>
  );
}
