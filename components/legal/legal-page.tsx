import Link from "next/link";
import { CircleQuestionMark, Headset, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/landing/reveal";
import { ScrollProgress } from "@/components/landing/scroll-progress";
import { Nav } from "@/components/landing/nav";
import { SiteFooter } from "@/components/landing/site-footer";
import { AssistantWidget } from "@/components/assistant/assistant-widget";
import type { LegalDoc } from "./types";

/** Shared outer padding — the clause column is narrower than the bands below it. */
const PAD = "px-6 sm:px-8 md:px-16";

function BandHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-satoshi text-[17px] font-bold tracking-tight text-bq-heading md:text-[26px]">
      {children}
    </h2>
  );
}

function Hero({ doc }: { doc: LegalDoc }) {
  const { icon: BadgeIcon } = doc.badge;
  return (
    <section className={cn("relative overflow-hidden bg-bq-bg pt-[87px]", PAD)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in srgb, var(--bq-green) 8%, transparent), transparent 70%)",
        }}
      />
      <div className="relative mx-auto flex max-w-[768px] flex-col items-center gap-5 py-14 text-center md:py-20">
        <span className="flex items-center gap-2 rounded-full border border-bq-green/20 bg-bq-green/[0.08] px-4 py-1.5">
          <BadgeIcon className="size-3 text-bq-green" />
          <span className="text-[11px] font-bold text-bq-green">{doc.badge.label}</span>
        </span>
        <h1 className="font-satoshi text-[28px] font-bold leading-[1.25] tracking-tight text-bq-heading md:text-[48px]">
          {doc.title}
        </h1>
        <p className="text-[13px] leading-[1.63] text-bq-muted md:text-[18px]">{doc.subtitle}</p>
        <p className="text-[11px] text-bq-dim md:text-[13px]">{doc.updated}</p>
      </div>
    </section>
  );
}

function Clauses({ sections }: { sections: LegalDoc["sections"] }) {
  return (
    <section className={cn("bg-bq-bg py-12 md:py-16", PAD)}>
      <div className="mx-auto flex max-w-[768px] flex-col gap-8 md:gap-10">
        {sections.map((section) => (
          <Reveal key={section.title}>
            <h2 className="font-satoshi text-[17px] font-bold tracking-tight text-bq-heading md:text-[26px]">
              {section.title}
            </h2>
            <span className="mt-2 block h-0.5 w-12 rounded-full bg-bq-green" />

            {section.body && (
              <p className="mt-4 text-[13px] leading-[1.63] text-bq-muted">{section.body}</p>
            )}

            {section.cards && (
              <div className="mt-4 flex flex-col gap-4">
                {section.cards.map((card) => (
                  <div
                    key={card.title}
                    className="rounded-3xl border border-bq-border bg-bq-overlay/[0.02] p-5"
                  >
                    <h3 className="font-satoshi text-[13px] font-bold text-bq-heading md:text-[15px]">
                      {card.title}
                    </h3>
                    <p className="mt-2 text-[13px] leading-[1.63] text-bq-muted">{card.body}</p>
                  </div>
                ))}
              </div>
            )}
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Highlights({ highlights }: { highlights: LegalDoc["highlights"] }) {
  const warn = highlights.tone === "warn";
  return (
    <section
      className={cn("border-t border-bq-border bg-bq-overlay/[0.01] py-12 md:py-16", PAD)}
    >
      <div className="mx-auto max-w-[896px]">
        <BandHeading>{highlights.heading}</BandHeading>
        <div className="mt-6 grid gap-4 md:mt-8 md:grid-cols-3 md:gap-6">
          {highlights.cards.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={i * 90} className="h-full">
              <div className="relative h-full overflow-hidden rounded-2xl border border-bq-border bg-bq-card p-5 md:p-6">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    backgroundImage: `radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--bq-${
                      warn ? "loss" : "green"
                    }) 5%, transparent), transparent 70%)`,
                  }}
                />
                <div className="relative">
                  <Icon className={cn("size-6", warn ? "text-bq-warn-text" : "text-bq-green")} />
                  <h3 className="mt-2 font-satoshi text-[15px] font-bold text-bq-heading">
                    {title}
                  </h3>
                  <p className="mt-1.5 text-[11px] leading-[1.63] text-bq-muted">{body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq({ faq }: { faq: LegalDoc["faq"] }) {
  return (
    <section className={cn("border-t border-bq-border bg-bq-bg py-12 md:py-16", PAD)}>
      <div className="mx-auto max-w-[896px]">
        <BandHeading>{faq.heading}</BandHeading>
        <div className="mt-6 grid gap-2.5 md:mt-8 md:grid-cols-2">
          {faq.items.map(({ question, answer }, i) => (
            <Reveal key={question} delay={i * 70} className="h-full">
              <div className="h-full rounded-2xl border border-bq-border bg-bq-card p-5 md:p-6">
                <span className="flex size-6 items-center justify-center rounded-[14px] border border-bq-green/15 bg-bq-green/[0.08]">
                  <CircleQuestionMark className="size-3 text-bq-green" />
                </span>
                <h3 className="mt-2.5 font-satoshi text-[13px] font-bold text-bq-heading">
                  {question}
                </h3>
                <p className="mt-1.5 text-[11px] leading-[1.63] text-bq-muted">{answer}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactCta({ cta }: { cta: LegalDoc["cta"] }) {
  return (
    <section className={cn("bg-bq-bg py-10", PAD)}>
      <Reveal className="mx-auto max-w-[1040px]">
        <div className="relative overflow-hidden rounded-2xl border border-bq-border bg-bq-card p-5 md:p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 60% 80% at 0% 50%, color-mix(in srgb, var(--bq-green) 5%, transparent), transparent 70%)",
            }}
          />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:gap-8">
            <div>
              <h2 className="font-satoshi text-[17px] font-bold tracking-tight text-bq-heading md:text-[21px]">
                {cta.title}
              </h2>
              <p className="mt-1.5 max-w-[540px] text-[11px] leading-[1.43] text-bq-muted md:text-[13px]">
                {cta.body}
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-2 md:flex-row md:items-center md:gap-3">
              <a
                href={`mailto:${cta.email}`}
                className="flex items-center justify-center gap-2 rounded-full border border-bq-overlay/[0.12] bg-bq-surface px-5 py-2.5 text-[13px] font-bold text-bq-text transition-transform hover:text-bq-heading active:translate-y-px"
              >
                <Mail className="size-3.5 shrink-0" />
                {cta.emailLabel}
              </a>
              <Link
                href="/dashboard/help"
                className="flex items-center justify-center gap-2 rounded-full bg-bq-green px-5 py-2.5 text-[13px] font-bold text-bq-on-fill transition-transform hover:bg-bq-green/90 active:translate-y-px"
              >
                <Headset className="size-3.5 shrink-0" />
                {/* One flex child, or the row gap lands between prefix and label. */}
                <span>
                  <span className="hidden sm:inline">Open </span>Help Desk
                </span>
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <main className="min-h-screen bg-bq-bg font-satoshi text-bq-heading">
      <ScrollProgress />
      <Nav />
      <Hero doc={doc} />
      <Clauses sections={doc.sections} />
      <Highlights highlights={doc.highlights} />
      <Faq faq={doc.faq} />
      <ContactCta cta={doc.cta} />
      <SiteFooter />
      <AssistantWidget />
    </main>
  );
}
