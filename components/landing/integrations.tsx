import Image from "next/image";
import { Reveal } from "./reveal";
import { PARTNERS } from "./data";

export function Integrations() {
  return (
    <section className="border-y border-bq-border bg-bq-bg py-14">
      <Reveal>
        <p className="px-8 text-center font-plex text-[11px] uppercase tracking-[1.5px] text-bq-muted md:px-16">
          Integrated with partners across the ecosystem
        </p>

        {/* auto-scrolling logo marquee — pauses on hover */}
        <div className="group relative mt-9 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
          <div className="bq-marquee-track flex w-max items-center gap-14 pl-14 group-hover:[animation-play-state:paused]">
            {[...PARTNERS, ...PARTNERS].map((p, i) => (
              <Image
                key={`${p.src}-${i}`}
                src={p.src}
                alt=""
                aria-hidden
                width={p.w}
                height={p.h}
                className="h-6 w-auto shrink-0 opacity-40 grayscale transition duration-300 hover:opacity-90 hover:grayscale-0 md:h-7"
              />
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
