import { Reveal } from "./reveal";
import { INTEGRATIONS } from "./data";

export function Integrations() {
  return (
    <section className="border-y border-bq-border bg-bq-bg px-8 py-14 md:px-16">
      <Reveal className="mx-auto max-w-[1312px]">
        <p className="text-center font-plex text-[11px] uppercase tracking-[1.5px] text-bq-muted">
          Integrated with leading DeFi infrastructure
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-x-14 gap-y-6">
          {INTEGRATIONS.map((name) => (
            <span
              key={name}
              className="font-satoshi text-2xl font-bold text-bq-muted/30 transition-colors hover:text-bq-muted/60"
            >
              {name}
            </span>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
