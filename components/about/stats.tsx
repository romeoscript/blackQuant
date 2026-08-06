import { Reveal } from "@/components/landing/reveal";
import { CountUp } from "@/components/landing/count-up";
import { ABOUT_STATS } from "./data";
import { AboutCard, AboutSection } from "./section";

/** Gap between each card's entrance, in ms. */
const STAGGER = 90;

export function AboutStats() {
  return (
    <AboutSection className="py-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {ABOUT_STATS.map((stat, i) => (
          <Reveal key={stat.label} delay={i * STAGGER}>
            <AboutCard className="h-full rounded-3xl px-5 py-[19px]">
              <CountUp
                value={stat.value}
                className="block font-satoshi text-[28px] font-bold leading-[1.2] tracking-tight tabular-nums text-bq-heading md:text-[32px]"
              />
              <p className="mt-1.5 text-[12px] text-bq-muted md:text-[13px]">
                {stat.label}
              </p>
              <p className="mt-2 text-[11px] font-bold text-bq-green">
                {stat.delta}
              </p>
            </AboutCard>
          </Reveal>
        ))}
      </div>
    </AboutSection>
  );
}
