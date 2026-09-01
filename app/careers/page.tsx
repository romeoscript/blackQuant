import type { Metadata } from "next";
import { Briefcase, Mail, Users } from "lucide-react";
import { Reveal } from "@/components/landing/reveal";
import { ContactCta } from "@/components/landing/contact-cta";
import {
  Band,
  BandHeading,
  Card,
  PageHero,
  PageShell,
} from "@/components/marketing/page-shell";
import {
  BENEFITS,
  CAREERS_INBOX,
  HIRING_PROCESS,
  HOW_WE_WORK,
  ROLES,
} from "@/components/careers/data";
import { FeaturedRoleCard, RoleCard } from "@/components/careers/role-card";

const STAGGER = 70;

export const metadata: Metadata = {
  title: "Careers · BlackQuant",
  description:
    "Open roles at BlackQuant — including a Fractional CEO. Small team, published compensation bands, remote by default, building non-custodial execution infrastructure.",
  alternates: { canonical: "/careers" },
};

export default function CareersPage() {
  const featured = ROLES.find((r) => r.featured);
  const rest = ROLES.filter((r) => !r.featured);

  return (
    <PageShell>
      <PageHero
        icon={Briefcase}
        eyebrow={`${ROLES.length} open roles`}
        title="Build the infrastructure, not the hype"
        subtitle="We are a small team building non-custodial execution infrastructure. Bands are published, the process is written down, and we hire slowly on purpose."
      />

      <Band>
        <Reveal>
          <BandHeading sub="Four things that are true about working here, including the inconvenient one.">
            How we work
          </BandHeading>
        </Reveal>
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {HOW_WE_WORK.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={i * STAGGER} className="h-full">
              <Card>
                <Icon className="size-5 text-bq-green" />
                <h3 className="mt-3 font-satoshi text-[15px] font-bold text-bq-heading">
                  {title}
                </h3>
                <p className="mt-2 text-[13px] leading-[1.7] text-bq-muted">{body}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Band>

      <Band divider>
        <Reveal>
          <BandHeading sub="Every listing states its compensation. Expand a role to see what it owns and what it needs.">
            Open roles
          </BandHeading>
        </Reveal>

        {featured && (
          <Reveal className="mt-7 block">
            <FeaturedRoleCard role={featured} />
          </Reveal>
        )}

        <div className="mt-4 flex flex-col gap-4">
          {rest.map((role, i) => (
            <Reveal key={role.slug} delay={i * STAGGER}>
              <RoleCard role={role} />
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-6 block">
          <p className="text-[13px] leading-[1.7] text-bq-muted">
            Nothing here that fits?{" "}
            <a
              href={`mailto:${CAREERS_INBOX}?subject=${encodeURIComponent("Speculative application")}`}
              className="font-bold text-bq-green underline underline-offset-[3px] hover:opacity-75"
            >
              Write to us anyway
            </a>
            . We have made roles for people before.
          </p>
        </Reveal>
      </Band>

      <Band divider className="bg-bq-overlay/[0.01]">
        <Reveal>
          <BandHeading>Benefits</BandHeading>
        </Reveal>
        <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={i * STAGGER} className="h-full">
              <Card>
                <Icon className="size-5 text-bq-green" />
                <h3 className="mt-3 font-satoshi text-[14px] font-bold text-bq-heading">
                  {title}
                </h3>
                <p className="mt-1.5 text-[12px] leading-[1.7] text-bq-muted">{body}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Band>

      <Band divider>
        <Reveal>
          <BandHeading sub="Five steps, roughly three weeks end to end. We tell you where you stand at every one.">
            How we hire
          </BandHeading>
        </Reveal>
        {/* A left rule threads the steps together so they read as a sequence
            rather than five unrelated cards. */}
        <ol className="mt-7 flex flex-col border-l border-bq-border">
          {HIRING_PROCESS.map((stage, i) => (
            <Reveal key={stage.step} delay={i * STAGGER}>
              <li className="relative flex gap-5 pb-7 pl-6 last:pb-0">
                <span
                  aria-hidden
                  className="absolute -left-[5px] top-1.5 size-2.5 rounded-full border border-bq-green bg-bq-bg"
                />
                <div>
                  <span className="font-plex text-[10px] uppercase tracking-[2px] text-bq-green">
                    {stage.step}
                  </span>
                  <h3 className="mt-1.5 font-satoshi text-[15px] font-bold text-bq-heading">
                    {stage.title}
                  </h3>
                  <p className="mt-1.5 max-w-[560px] text-[13px] leading-[1.7] text-bq-muted">
                    {stage.body}
                  </p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </Band>

      <Band divider className="py-10 md:py-12">
        <Reveal>
          <ContactCta
            title="Questions before you apply?"
            body="Ask anything — the band, the equity, what the first ninety days look like. A person replies, usually within two working days."
            actions={[
              { icon: Users, label: "About us", href: "/about" },
              {
                icon: Mail,
                prefix: "Email ",
                label: "careers",
                href: `mailto:${CAREERS_INBOX}`,
                primary: true,
              },
            ]}
          />
        </Reveal>
      </Band>
    </PageShell>
  );
}
