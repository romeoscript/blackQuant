import { CircleQuestionMark } from "lucide-react";
import { Reveal } from "@/components/landing/reveal";
import { ABOUT_FAQ } from "./data";
import { AboutCard, AboutSection } from "./section";

/** Gap between each card's entrance, in ms. */
const STAGGER = 70;

export function AboutFaq() {
  return (
    <AboutSection label="Frequently Asked">
      <div className="grid gap-4 md:grid-cols-2">
        {ABOUT_FAQ.map(({ question, answer }, i) => (
          <Reveal key={question} delay={i * STAGGER} className="h-full">
            <AboutCard className="h-full p-5 md:p-6">
              <h3 className="flex items-center gap-3 font-satoshi text-[11px] font-bold text-bq-heading md:text-[13px]">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-[14px] border border-bq-green/15 bg-bq-green/[0.08] md:size-6">
                  <CircleQuestionMark className="size-3 text-bq-green" />
                </span>
                {question}
              </h3>
              <p className="mt-2.5 pl-8 text-[11px] leading-[1.63] text-bq-muted md:pl-9">
                {answer}
              </p>
            </AboutCard>
          </Reveal>
        ))}
      </div>
    </AboutSection>
  );
}
