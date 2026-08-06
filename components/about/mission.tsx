import { Reveal } from "@/components/landing/reveal";
import { MISSION, PLATFORM_SNAPSHOT } from "./data";
import { AboutCard, AboutSection, SectionLabel } from "./section";

export function AboutMission() {
  return (
    <AboutSection className="py-8">
      <div className="grid gap-4 md:grid-cols-2">
        <Reveal className="h-full">
          <AboutCard className="h-full p-5 md:p-8">
            <SectionLabel>Our Mission</SectionLabel>
            <p className="mt-6 font-satoshi text-[17px] font-bold leading-[1.38] text-bq-heading md:mt-7 md:text-[21px]">
              {MISSION.headline}
            </p>
            <p className="mt-6 text-[13px] leading-[1.63] text-bq-muted md:mt-7">
              {MISSION.body}
            </p>
          </AboutCard>
        </Reveal>

        <Reveal delay={120} className="h-full">
          <AboutCard className="h-full p-5 md:p-8">
            <SectionLabel>Platform Snapshot</SectionLabel>
            <dl className="mt-4 divide-y divide-bq-border-soft md:mt-5">
              {PLATFORM_SNAPSHOT.map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <dt className="flex items-center gap-2.5 text-[13px] text-bq-muted">
                    <Icon className="size-3.5 shrink-0" />
                    {label}
                  </dt>
                  <dd className="text-[13px] font-bold text-bq-heading">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </AboutCard>
        </Reveal>
      </div>
    </AboutSection>
  );
}
