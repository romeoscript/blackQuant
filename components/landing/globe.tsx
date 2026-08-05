"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type LatLng = [number, number];

type Arc = {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  gap: number;
};

// Hub coordinates ([lat, lng]) for the animated flying arcs.
const HUBS: LatLng[] = [
  [55, -3], [1.35, 103.8], [-25, 133], [56, -106], [24, 54], [36, 128],
  [46, 2], [23, -102], [21, 78], [47, 8], [-14, -51], [35, 105], [51, 10],
];

const ARCS: Arc[] = HUBS.map(([startLat, startLng], i) => {
  const [endLat, endLng] = HUBS[(i * 5 + 3) % HUBS.length];
  return { startLat, startLng, endLat, endLng, gap: (i % 7) / 7 };
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

/** Payload written by scripts/build-globe-data.mjs. */
type GlobeData = {
  hexResolution: number;
  countries: object[];
  coastlines: LatLng[][];
};

const GLOBE_DATA_URL = "/globe-data.json";
/** Below this the WebGL globe costs more than the CSS halo it replaces. */
const MIN_DEVICE_MEMORY_GB = 4;
/** `deviceMemory` is Chromium-only; assume a capable machine elsewhere. */
const ASSUMED_DEVICE_MEMORY_GB = 8;
/** Start building this far out so the globe is ready as it scrolls in. */
const PREFETCH_MARGIN = "400px 0px";
const IDLE_BUILD_TIMEOUT_MS = 4000;
const FALLBACK_BUILD_DELAY_MS = 400;
const INTERACTIONS = ["scroll", "pointerdown", "keydown", "touchstart"] as const;

/**
 * three.js + three-globe is ~500 KB and ~1.5s of main-thread build on throttled
 * hardware, for an element that is decorative and below the fold. Anything that
 * can't comfortably absorb that keeps the CSS halo instead.
 */
function supportsGlobe(): boolean {
  if (!window.matchMedia("(min-width: 768px)").matches) return false;
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  if (nav.connection?.saveData) return false;
  return (nav.deviceMemory ?? ASSUMED_DEVICE_MEMORY_GB) >= MIN_DEVICE_MEMORY_GB;
}

type GlobeInstance = Awaited<ReturnType<typeof buildScene>>;

/**
 * Builds the configured globe into `el`. Split out so the effect below reads as
 * pure lifecycle — scheduling, pause/resume, teardown — rather than lifecycle
 * with fifty lines of scene configuration wedged into the middle.
 */
async function buildScene(el: HTMLDivElement, data: GlobeData) {
  const { default: Globe } = await import("globe.gl");
  const size = el.clientWidth;

  // `animateIn` tweens the globe up from scale 0 on a wall-clock timer that only
  // advances while the render loop runs. Because the loop is paused whenever the
  // globe is off-screen, that intro can freeze at scale 0 and never recover. The
  // container's opacity transition already provides the entrance.
  const globe = new Globe(el, { animateIn: false });

  globe
    .width(size)
    .height(size)
    .backgroundColor("rgba(0,0,0,0)")
    .showAtmosphere(true)
    .atmosphereColor("#25e07a")
    .atmosphereAltitude(0.16)
    .hexPolygonsData(data.countries)
    .hexPolygonResolution(data.hexResolution)
    .hexPolygonMargin(0.18)
    .hexPolygonUseDots(true)
    .hexPolygonColor(() => "rgba(110,240,170,0.98)")
    // Coastlines are plain lines. The previous polygons layer tessellated every
    // landmass into cap/side solids that were fully transparent, so all of that
    // geometry was built only to be unseen.
    .pathsData(data.coastlines)
    .pathPointLat((p) => (p as LatLng)[0])
    .pathPointLng((p) => (p as LatLng)[1])
    .pathPointAlt(0.008)
    .pathColor(() => "#5cf0a0")
    .pathStroke(null) // null → THREE.Line rather than a tube mesh
    .pathTransitionDuration(0)
    .arcsData(ARCS)
    .arcColor(() => ["rgba(74,222,128,0)", "rgba(150,255,195,0.9)"])
    .arcAltitudeAutoScale(0.45)
    .arcStroke(0.45)
    .arcDashLength(0.4)
    .arcDashGap(2)
    .arcDashInitialGap((d) => (d as Arc).gap)
    .arcDashAnimateTime(2600);

  // Mutating the existing Color instances avoids importing `three` purely for
  // its constructor, which would pin another module into this chunk's graph.
  const material = globe.globeMaterial() as unknown as {
    color: { set: (v: string) => void };
    emissive: { set: (v: string) => void };
    emissiveIntensity?: number;
    shininess?: number;
  };
  material.color.set("#04100a");
  material.emissive.set("#031008");
  material.emissiveIntensity = 0.15;
  material.shininess = 0.2;

  // Fully transparent canvas — the glow comes from the atmosphere shell plus a
  // CSS halo behind it, not from a bloom pass that would opaque the rectangle.
  globe.renderer().setClearColor(0x000000, 0);
  // Retina would quadruple the fragments shaded per frame on a ~960px canvas,
  // which is pure main-thread contention for a decorative element.
  globe.renderer().setPixelRatio(1);

  globe.pointOfView({ lat: 12, lng: -55, altitude: 1.95 });
  const controls = globe.controls();
  controls.autoRotate = true;
  controls.autoRotateSpeed = 3.2;
  controls.enableZoom = false;
  controls.enablePan = false;

  return globe;
}

export function Globe({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  // Drives the placeholder. Kept separate from `ready` so it never spins on the
  // paths that skip WebGL entirely (phones, low-memory devices, Save-Data) or
  // after a failed build.
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !supportsGlobe()) return;

    let disposed = false;
    const cleanups: Array<() => void> = [];
    const onCleanup = (fn: () => void) => cleanups.push(fn);

    const listen = (
      target: Window | Document,
      event: string,
      handler: () => void,
      options?: AddEventListenerOptions,
    ) => {
      target.addEventListener(event, handler, options);
      onCleanup(() => target.removeEventListener(event, handler, options));
    };

    const attach = (globe: GlobeInstance) => {
      onCleanup(() => globe._destructor());

      listen(window, "resize", () => {
        const size = containerRef.current?.clientWidth;
        if (size) globe.width(size).height(size);
      });

      // Rendering an off-screen or backgrounded scene is wasted frames that
      // contend with scrolling; rAF throttles in a hidden tab but never stops.
      let onScreen = true;
      const syncPlayback = () =>
        onScreen && !document.hidden
          ? globe.resumeAnimation()
          : globe.pauseAnimation();

      const visibility = new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
        syncPlayback();
      });
      visibility.observe(el);
      onCleanup(() => visibility.disconnect());
      listen(document, "visibilitychange", syncPlayback);
    };

    const build = async () => {
      setLoading(true);
      // Geometry is precomputed at build time and served as a static asset, so
      // the client pays a native JSON.parse instead of compiling ~163 KB of
      // topojson embedded in a JS chunk.
      const response = await fetch(GLOBE_DATA_URL);
      if (!response.ok) {
        throw new Error(`${GLOBE_DATA_URL} responded ${response.status}`);
      }
      const data = (await response.json()) as GlobeData;
      if (disposed) return;

      const globe = await buildScene(el, data);
      // The awaits above can straddle an unmount; by this point the scene is
      // already in the DOM, so it has to be torn down rather than abandoned.
      if (disposed) {
        globe._destructor();
        return;
      }
      attach(globe);
      setReady(true);
    };

    // The globe is decorative: if it can't be built, drop back to the CSS halo
    // and orbiting labels rather than leaving the placeholder spinning forever.
    const buildOrDegrade = () =>
      build().catch((error) => {
        console.error("[globe] build failed, falling back to static hero", error);
        if (!disposed) setLoading(false);
      });

    const scheduleBuild = () => {
      if (typeof window.requestIdleCallback !== "function") {
        const timer = window.setTimeout(buildOrDegrade, FALLBACK_BUILD_DELAY_MS);
        onCleanup(() => window.clearTimeout(timer));
        return;
      }
      const idle = window.requestIdleCallback(() => buildOrDegrade(), {
        timeout: IDLE_BUILD_TIMEOUT_MS,
      });
      onCleanup(() => window.cancelIdleCallback(idle));
    };

    // Nothing about the globe belongs in the initial page load: wait for a real
    // interaction, then build once it is genuinely approaching the viewport.
    let armed = false;
    const armViewportGate = () => {
      // Several interaction types can fire before their siblings unregister.
      if (armed) return;
      armed = true;
      const gate = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          gate.disconnect();
          scheduleBuild();
        },
        { rootMargin: PREFETCH_MARGIN },
      );
      gate.observe(el);
      onCleanup(() => gate.disconnect());
    };

    INTERACTIONS.forEach((event) =>
      listen(window, event, armViewportGate, { passive: true, once: true }),
    );

    return () => {
      disposed = true;
      cleanups.forEach((fn) => fn());
      el.innerHTML = "";
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
