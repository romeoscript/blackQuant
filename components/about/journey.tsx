import { cn } from "@/lib/utils";
import { Reveal } from "@/components/landing/reveal";
import { JOURNEY } from "./data";
import { AboutCard, AboutSection } from "./section";

/** Gap between each milestone's entrance, in ms. */
const STAGGER = 110;
/** Head start so the dots land before the copy beneath them. */
const COPY_OFFSET = 160;

export function AboutJourney() {
  return (
    <AboutSection label="Our Journey">
      {/* The timeline stagger keys off the card's own reveal rather than a
          Reveal per milestone: the <ol> is a grid of <li>, which a wrapper
          element would break. */}
      <Reveal className="group">
        <AboutCard className="p-4 md:p-8">
          <ol className="flex gap-1 md:grid md:grid-cols-6 md:gap-0">
            {JOURNEY.map((milestone, i) => (
              <li key={milestone.year} className="relative">
                {/* Runs from this dot's centre to the next one — a column apart. */}
                {i < JOURNEY.length - 1 && (
                  <span
                    aria-hidden
                    style={{
                      transitionDelay: `${i * STAGGER + STAGGER / 2}ms`,
                    }}
                    className="absolute left-3.5 top-[9.5px] hidden h-px w-full origin-left scale-x-0 bg-bq-overlay/10 transition-transform duration-500 ease-out group-data-revealed:scale-x-100 motion-reduce:scale-x-100 motion-reduce:transition-none md:block"
                  />
                )}
                <div
                  style={{ transitionDelay: `${i * STAGGER}ms` }}
                  className="relative flex w-7 scale-90 flex-col items-center gap-2 opacity-0 transition-[opacity,transform] duration-500 ease-out group-data-revealed:scale-100 group-data-revealed:opacity-100 motion-reduce:scale-100 motion-reduce:opacity-100 motion-reduce:transition-none"
                >
                  {milestone.current ? (
                    <span className="flex size-4 items-center justify-center rounded-full bg-bq-green md:size-5">
                      <span className="size-1.5 rounded-full bg-bq-on-fill md:size-2" />
                    </span>
                  ) : (
                    <span className="size-4 rounded-full border-2 border-bq-overlay/15 bg-bq-surface md:size-5" />
                  )}
                  <span
                    className={cn(
                      "font-satoshi text-[11px] font-bold",
                      milestone.current ? "text-bq-green" : "text-bq-dim",
                    )}
                  >
                    {milestone.year}
                  </span>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-4 flex flex-col gap-3 md:mt-8 md:grid md:grid-cols-6 md:gap-0">
            {JOURNEY.map((milestone, i) => (
              <div
                key={milestone.year}
                style={{ transitionDelay: `${i * STAGGER + COPY_OFFSET}ms` }}
                className="translate-y-2 rounded-[14px] bg-bq-overlay/[0.02] p-5 opacity-0 transition-[opacity,transform] duration-500 ease-out group-data-revealed:translate-y-0 group-data-revealed:opacity-100 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none md:rounded-none md:bg-transparent md:p-0 md:pr-4"
              >
                <h3
                  className={cn(
                    "font-satoshi text-[11px] font-bold md:text-[13px]",
                    milestone.current ? "text-bq-green" : "text-bq-heading",
                  )}
                >
                  {milestone.title}
                </h3>
                <p className="mt-1 text-[11px] leading-[1.38] text-bq-muted md:mt-1.5 md:leading-[1.66]">
                  {milestone.body}
                </p>
              </div>
            ))}
          </div>
        </AboutCard>
      </Reveal>
    </AboutSection>
  );
}
