import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";
import { FEATURES, type Feature } from "./data";

export function Performance() {
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

        <div className="mt-8 border-t border-bq-border">
          {FEATURES.map((f) => (
            <Reveal key={f.index}>
              <FeatureBlock feature={f} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureBlock({ feature }: { feature: Feature }) {
  const isGreen = feature.accent === "green";
  const accentText = isGreen ? "text-bq-green" : "text-bq-blue";
  const accentBg = isGreen ? "bg-bq-green" : "bg-bq-blue";
  const glow = isGreen
    ? "shadow-[0_0_10px_4px_rgba(74,222,128,0.33)]"
    : "shadow-[0_0_10px_4px_rgba(59,130,246,0.33)]";

  return (
    <div className="border-b border-bq-border">
      {/* top meta bar */}
      <div className="flex items-center justify-between py-4 font-plex text-[10px] uppercase tracking-[1.5px]">
        <div className="flex items-center gap-3">
          <span className={accentText}>{feature.index}</span>
          <span className="text-bq-dim">|</span>
          <span className="text-bq-muted">{feature.kicker}</span>
          <span className={cn("size-1.5 rounded-full", accentBg, glow)} />
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-bq-text sm:inline">{feature.meta}</span>
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1",
              isGreen
                ? "border-bq-green/30 bg-bq-green/5"
                : "border-bq-blue/30 bg-bq-blue/5",
            )}
          >
            <span className={cn("size-1.5 rounded-full", accentBg)} />
            <span className={accentText}>Live</span>
          </span>
          <span className="text-bq-dim">{feature.index} / 04</span>
        </div>
      </div>

      {/* body: empty visual rail (left) + content (right) */}
      <div className="grid gap-0 border-t border-bq-border-soft md:grid-cols-[1.4fr_1fr]">
        <div className="relative hidden min-h-[420px] overflow-hidden border-r border-bq-border-soft bg-bq-panel md:block">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 30% 45%, ${
                isGreen ? "rgba(74,222,128,0.06)" : "rgba(59,130,246,0.06)"
              }, transparent 55%)`,
            }}
          />
        </div>

        <div className="relative flex flex-col justify-center px-2 py-12 md:px-14">
          <span
            className={cn(
              "font-clash text-[80px] font-medium leading-none opacity-[0.08]",
              accentText,
            )}
          >
            {feature.index}
          </span>

          <div className="mt-6 flex items-center gap-2.5">
            <span className={cn("h-[1.5px] w-6 rounded-full", accentBg)} />
            <span
              className={cn(
                "font-plex text-[10px] uppercase tracking-[2px]",
                accentText,
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
                <span className={cn("size-[7px] rounded-[3.5px]", accentBg, glow)} />
                <span className="font-satoshi text-[13px] text-bq-text">{b}</span>
              </li>
            ))}
          </ul>

          <div className="mt-12 max-w-[380px]">
            <div
              className="h-px w-full"
              style={{
                background: `linear-gradient(to right, ${
                  isGreen ? "rgba(74,222,128,0.21)" : "rgba(59,130,246,0.21)"
                }, transparent)`,
              }}
            />
            <div className="mt-4 flex items-center justify-between">
              <span className="font-satoshi text-[9px] text-bq-dim">BlackLabs</span>
              <span className={cn("font-plex text-[9px] opacity-50", accentText)}>
                {feature.index} / 04
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
