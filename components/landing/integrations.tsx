import Image from "next/image";
import { Reveal } from "./reveal";
import { DEFI_PARTNERS, PARTNERS } from "./data";

/**
 * Rendered height of the strip (`md:h-7`). PARTNERS stores each file's
 * intrinsic size, which is up to 1941px wide — handing that to next/image made
 * it emit a srcset around the source resolution for a 28px-tall logo. Deriving
 * the display box instead keeps the generated variants at the size actually
 * painted.
 */
const LOGO_H = 28;

export function Integrations() {
  return (
    <section className="border-y border-bq-border bg-bq-bg py-14 max-md:py-6">
      <Reveal>
        <p className="px-6 text-center font-plex text-[11px] uppercase tracking-[1.5px] text-bq-muted sm:px-8 md:px-16">
          Integrated with partners across the ecosystem
        </p>

        {/* Below md the marquee is replaced by a static wrapped list: twenty
            lazy logo images scrolling on a phone is a lot of payload and
            motion for a strip only a few of which fit on screen. Kept as a
            CSS swap so neither variant hydrates differently from the server. */}
        <div className="mt-3 flex flex-wrap justify-center gap-1 px-6 md:hidden">
          {DEFI_PARTNERS.map((name) => (
            <span
              key={name}
              className="flex h-[29px] items-center rounded-full border border-bq-border px-4 text-[13px] text-bq-muted"
            >
              {name}
            </span>
          ))}
        </div>

        {/* auto-scrolling logo marquee — pauses on hover */}
        <div className="group relative mt-9 hidden overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] md:block">
          <div className="bq-marquee-track flex w-max items-center gap-14 pl-14 group-hover:[animation-play-state:paused]">
            {[...PARTNERS, ...PARTNERS].map((p, i) => (
              <Image
                key={`${p.src}-${i}`}
                src={p.src}
                alt=""
                aria-hidden
                width={Math.round((p.w / p.h) * LOGO_H)}
                height={LOGO_H}
                loading="lazy"
                // Pin the box to the source ratio. The served variant is
                // resized to a whole number of pixels, so its own ratio is off
                // by a fraction — enough that `w-auto` painted a width a pixel
                // or two from the declared one while the height matched
                // exactly, which is precisely what next/image's "width or
                // height modified, but not the other" warning looks for.
                style={{ aspectRatio: `${p.w} / ${p.h}` }}
                // Every partner mark is supplied white-on-transparent, so on a
                // light background they need flattening to black rather than a
                // theme token. `brightness-0` does that without touching hue —
                // three of the marks carry a colour accent that `invert` would
                // flip to its complement. That also means the hover colour
                // reveal only makes sense on the dark surface.
                className="h-6 w-auto shrink-0 opacity-55 brightness-0 transition duration-300 hover:opacity-80 md:h-7 dark:opacity-40 dark:grayscale dark:brightness-100 dark:hover:opacity-90 dark:hover:grayscale-0"
              />
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
