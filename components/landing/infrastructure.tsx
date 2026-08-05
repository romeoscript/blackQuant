import { Reveal } from "./reveal";
import { INFRA_TAGS } from "./data";
import { NexusPanel, ArborPanel } from "./infra-panels";

export function Infrastructure() {
  return (
    <section id="infrastructure" className="bg-bq-bg px-4 py-14 sm:px-8 md:px-16 md:py-28">
      <div className="mx-auto max-w-[1312px]">
        <Reveal className="flex flex-col max-md:items-start max-md:text-left md:items-center md:text-center">
          <span className="flex items-center gap-2 rounded-full border border-bq-green/30 bg-bq-green/5 px-3.5 py-1.5">
            <span className="size-1.5 rounded-full bg-bq-green" />
            <span className="font-plex text-[11px] uppercase tracking-[2px] text-bq-green">
              Infrastructure
            </span>
          </span>
          <h2 className="mt-7 max-w-4xl font-satoshi text-4xl font-bold tracking-tight text-bq-heading md:text-[52px]">
            A Distributed Financial Execution Network.
          </h2>
          <p className="mt-6 max-w-2xl font-satoshi text-[15px] leading-relaxed text-bq-muted">
            Human-centric blockchain bound. Decentralized execution
            infrastructure with integrated optional liquidity optimization, both
            engines running simultaneously in real time.
          </p>
          <div className="mt-8 flex flex-wrap gap-2 max-md:justify-start md:justify-center md:gap-3">
            {INFRA_TAGS.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-bq-border px-3 py-1.5 text-[12px] text-bq-text/70 md:px-4 md:py-2 md:text-[13px]"
              >
                {tag}
              </span>
            ))}
          </div>
        </Reveal>

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <NexusPanel />
          </Reveal>
          <Reveal delay={100}>
            <ArborPanel />
          </Reveal>
        </div>

        <Reveal className="mt-6">
          <div className="grid gap-y-4 rounded-2xl border border-bq-border bg-bq-panel px-8 py-6 text-[13px] md:grid-cols-3 md:divide-x md:divide-bq-border">
            <p className="text-bq-muted md:pr-6">
              <span className="font-semibold text-bq-heading">Nexus Bot</span> —
              generates active trading profits via HFT-style MEV
            </p>
            <p className="text-bq-muted md:px-6">
              <span className="font-semibold text-bq-heading">Arbor Bot</span> —
              generates passive base yield via liquidity optimization
            </p>
            <p className="text-bq-muted md:pl-6">
              Both running simultaneously in real time.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
