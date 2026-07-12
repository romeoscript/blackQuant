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
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const n = RING_LABELS.length;
    let raf = 0;
    let phase = 0;
    let last = 0;
    const speed = (Math.PI * 2) / RING_PERIOD_MS;

    const tick = (t: number) => {
      const wrap = wrapRef.current;
      if (wrap) {
        if (!last) last = t;
        const dt = t - last;
        last = t;
        if (!reduce) phase += dt * speed;
        const radius = (wrap.clientWidth / 2) * 0.96;
        for (let i = 0; i < n; i++) {
          const el = itemRefs.current[i];
          if (!el) continue;
          const a = (i / n) * Math.PI * 2 + phase - Math.PI / 2;
          const x = Math.cos(a) * radius;
          const y = Math.sin(a) * radius * 0.92; // slight vertical squash
          el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
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
          <span className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-bq-border bg-bq-panel/80 px-2.5 py-1 text-[11px] font-medium text-bq-text/80 backdrop-blur-sm">
            <span
              className={cn(
                "size-1.5 rounded-full",
                d.live
                  ? "bg-bq-blue shadow-[0_0_6px_2px_rgba(59,130,246,0.55)]"
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

export function Globe({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let world: { _destructor?: () => void } | null = null;
    let disposed = false;
    let onResize: (() => void) | null = null;

    (async () => {
      const [{ default: Globe }, THREE, topojson, countriesTopo, landTopo, h3] =
        await Promise.all([
          import("globe.gl"),
          import("three"),
          import("topojson-client"),
          import("world-atlas/countries-110m.json"),
          import("world-atlas/land-110m.json"),
          import("h3-js"),
        ]);
      if (disposed || !containerRef.current) return;

      const cTopo = (countriesTopo.default ?? countriesTopo) as unknown as {
        objects: { countries: unknown };
      };
      const lTopo = (landTopo.default ?? landTopo) as unknown as {
        objects: { land: unknown };
      };
      const HEX_RES = 4;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allFeatures = (topojson.feature(cTopo as any, cTopo.objects.countries as any) as any)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .features as { geometry: any }[];
      // Drop any polygon h3 can't hex-bin so a bad country never throws.
      const countries = allFeatures.filter((f) => {
        const g = f.geometry;
        const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
        try {
          for (const poly of polys) h3.polygonToCells(poly, HEX_RES, true);
          return true;
        } catch {
          return false;
        }
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const land = (topojson.feature(lTopo as any, lTopo.objects.land as any) as any)
        .features as object[];

      const size = el.clientWidth;
      const g = new Globe(el, { animateIn: true })
        .width(size)
        .height(size)
        .backgroundColor("rgba(0,0,0,0)")
        .showAtmosphere(true)
        .atmosphereColor("#2b74ff")
        .atmosphereAltitude(0.16)
        // dotted continents
        .hexPolygonsData(countries)
        .hexPolygonResolution(HEX_RES)
        .hexPolygonMargin(0.18)
        .hexPolygonUseDots(true)
        .hexPolygonColor(() => "rgba(130,190,255,0.98)")
        // glowing coastline outlines
        .polygonsData(land)
        .polygonCapColor(() => "rgba(0,0,0,0)")
        .polygonSideColor(() => "rgba(0,0,0,0)")
        .polygonStrokeColor(() => "#6cb6ff")
        .polygonAltitude(0.008)
        // animated flying arcs (GitHub-globe style)
        .arcsData(ARCS)
        .arcColor(() => ["rgba(74,158,255,0)", "rgba(130,200,255,0.9)"])
        .arcAltitudeAutoScale(0.45)
        .arcStroke(0.45)
        .arcDashLength(0.4)
        .arcDashGap(2)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .arcDashInitialGap((d: any) => d.gap)
        .arcDashAnimateTime(2600);

      // dark navy globe surface — only the dots/coastlines should glow
      const mat = g.globeMaterial() as {
        color?: unknown;
        emissive?: unknown;
        emissiveIntensity?: number;
        shininess?: number;
      };
      mat.color = new THREE.Color("#04060e");
      mat.emissive = new THREE.Color("#02030a");
      mat.emissiveIntensity = 0.15;
      mat.shininess = 0.2;

      // Keep the canvas fully transparent — no bloom/EffectComposer (which would
      // wash the whole canvas into an opaque rectangle). Glow comes from the
      // transparent atmosphere shell plus a CSS halo behind the canvas.
      g.renderer().setClearColor(0x000000, 0);

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
      world = g as unknown as typeof world;
      setReady(true);
    })();

    return () => {
      disposed = true;
      if (onResize) window.removeEventListener("resize", onResize);
      world?._destructor?.();
      if (el) el.innerHTML = "";
    };
  }, []);

  return (
    <div className={cn("relative aspect-square", className)}>
      {/* soft blue halo behind the globe (fades out well within the box) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[16%] rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(circle, rgba(45,116,255,0.22), rgba(45,116,255,0.06) 45%, transparent 66%)",
          animation: "bq-glow 7s ease-in-out infinite",
        }}
      />
      {/* tight cyan rim highlight (top-right), like the reference */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-[64%] top-[28%] size-28 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
        style={{
          background: "radial-gradient(circle, rgba(34,211,238,0.22), transparent 72%)",
        }}
      />

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
