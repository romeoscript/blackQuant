import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";
import { TESTIMONIALS, type Testimonial } from "./data";

/**
 * Each row drifts at its own pace, and the middle one against the other two, so
 * the wall never reads as one sliding sheet. The negative delays start the rows
 * part-way through their loop, giving the staggered edge on first paint rather
 * than three columns of cards lined up at the left.
 */
const ROWS = [
  { durationS: 72, delayS: 0, reverse: false },
  { durationS: 84, delayS: -18, reverse: true },
  { durationS: 66, delayS: -40, reverse: false },
] as const;

const PER_ROW = Math.ceil(TESTIMONIALS.length / ROWS.length);

const AVATAR_TONES = [
  "bg-bq-green/15 text-bq-green",
  "bg-bq-blue/15 text-bq-blue",
  "bg-bq-warn/15 text-bq-warn-text",
  "bg-bq-mint/15 text-bq-mint",
] as const;

export function Testimonials() {
  return (
    <section
      aria-labelledby="testimonials-heading"
      className="overflow-hidden bg-bq-bg pt-14 md:pt-28"
    >
      <Reveal className="flex flex-col items-center px-4 text-center sm:px-8 md:px-16">
        <span className="flex w-fit items-center gap-2 rounded-full border border-bq-green/30 bg-bq-green/5 px-3.5 py-1.5">
          <span className="size-1.5 rounded-full bg-bq-green" />
          <span className="font-plex text-[11px] uppercase tracking-[2px] text-bq-green">
            Testimonials
          </span>
        </span>
        <h2
          id="testimonials-heading"
          className="mt-6 font-satoshi text-[34px] font-bold tracking-tight sm:text-5xl md:text-[56px]"
        >
          <span className="text-bq-heading">What users</span>{" "}
          <span className="text-bq-muted">are saying.</span>
        </h2>
      </Reveal>

      {/* Capped so one set of cards is always wider than the strip showing it —
          past that, the end of the loop would scroll a gap into view. */}
      <div className="mx-auto mt-10 max-w-[1920px] [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] md:mt-14">
        {ROWS.map((row, r) => (
          <Reveal key={r} delay={r * 120}>
            <MarqueeRow
              items={TESTIMONIALS.slice(r * PER_ROW, (r + 1) * PER_ROW)}
              toneOffset={r * PER_ROW}
              {...row}
            />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function MarqueeRow({
  items,
  toneOffset,
  durationS,
  delayS,
  reverse,
}: {
  items: Testimonial[];
  toneOffset: number;
  durationS: number;
  delayS: number;
  reverse: boolean;
}) {
  return (
    // Vertical padding leaves room for the hover lift inside the clip. Under
    // reduced motion the track stands still, so the row scrolls by hand instead
    // and drops the duplicate set that only exists to make the loop seamless.
    <div className="group overflow-hidden py-1.5 motion-reduce:overflow-x-auto sm:py-2">
      <ul
        // `pl` matches `gap`, which makes half the track exactly one set wide —
        // the -50% the keyframe ends on lands on the seam.
        className="bq-marquee-track flex w-max gap-3 pl-3 group-hover:[animation-play-state:paused] sm:gap-4 sm:pl-4"
        style={{
          animationDuration: `${durationS}s`,
          animationDelay: `${delayS}s`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {[...items, ...items].map((t, i) => {
          const isDuplicate = i >= items.length;
          return (
            <li
              key={`${t.name}-${isDuplicate}`}
              aria-hidden={isDuplicate || undefined}
              className={cn("flex", isDuplicate && "motion-reduce:hidden")}
            >
              <TestimonialCard
                testimonial={t}
                tone={AVATAR_TONES[(toneOffset + (i % items.length)) % AVATAR_TONES.length]}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function TestimonialCard({
  testimonial: { quote, name, role },
  tone,
}: {
  testimonial: Testimonial;
  tone: string;
}) {
  return (
    <figure className="group/card relative flex min-h-[220px] w-[300px] flex-col justify-between gap-6 overflow-hidden rounded-2xl border border-bq-border bg-bq-card bg-gradient-to-br from-bq-overlay/[0.04] to-transparent p-5 transition-[transform,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-bq-green/30 sm:min-h-[240px] sm:w-[440px] sm:p-6">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-bq-green/70 to-transparent opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
      />
      <blockquote className="font-satoshi text-[14px] leading-relaxed text-bq-text sm:text-[15px]">
        “{quote}”
      </blockquote>
      <figcaption className="flex items-center gap-3">
        <span
          aria-hidden
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full font-plex text-[11px] font-semibold",
            tone,
          )}
        >
          {initialsOf(name)}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-satoshi text-[14px] font-bold text-bq-heading">
            {name}
          </span>
          <span className="block truncate text-[13px] text-bq-muted">{role}</span>
        </span>
      </figcaption>
    </figure>
  );
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}
