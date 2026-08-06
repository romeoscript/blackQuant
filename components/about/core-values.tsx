import { Reveal } from "@/components/landing/reveal";
import { CountUp } from "@/components/landing/count-up";
import { CORE_VALUES } from "./data";
import { AboutCard, AboutSection } from "./section";

/** Gap between each card's entrance, in ms. */
const STAGGER = 90;

export function AboutCoreValues() {
  return (
    <AboutSection label="Core Values">
      <div className="grid gap-4 md:grid-cols-4">
        {CORE_VALUES.map(({ icon: Icon, title, body, stat, statLabel }, i) => (
          <Reveal key={title} delay={i * STAGGER} className="h-full">
            <AboutCard className="flex h-full flex-col p-4 md:p-6">
              {/* Icon sits beside the copy on mobile and above it from md up. */}
              <div className="flex flex-1 items-start gap-3 md:flex-col md:gap-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-bq-green/15 bg-bq-green/[0.08] md:size-9">
                  <Icon className="size-3.5 text-bq-green md:size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-satoshi text-[13px] font-bold text-bq-heading md:text-[15px]">
                    {title}
                  </h3>
                  <p className="mt-0.5 text-[11px] leading-[1.63] text-bq-muted md:mt-4">
                    {body}
                  </p>
                </div>
              </div>

              <div className="mt-4 border-t border-bq-border-soft pt-2.5 md:pt-3">
                <CountUp
                  value={stat}
                  className="block font-satoshi text-[22px] font-bold tracking-tight tabular-nums text-bq-green md:text-[26px]"
                />
                <p className="mt-0.5 text-[11px] text-bq-dim">{statLabel}</p>
              </div>
            </AboutCard>
          </Reveal>
        ))}
      </div>
    </AboutSection>
  );
}
