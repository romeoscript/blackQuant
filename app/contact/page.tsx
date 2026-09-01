import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Clock, MessageSquare } from "lucide-react";
import {
  Band,
  BandHeading,
  Card,
  PageHero,
  PageShell,
} from "@/components/marketing/page-shell";
import { Reveal } from "@/components/landing/reveal";
import { CHANNELS, CONTACT_INBOX, type Channel } from "@/components/contact/data";
import { ContactForm } from "@/components/contact/contact-form";

const STAGGER = 60;

export const metadata: Metadata = {
  title: "Contact · BlackQuant",
  description:
    "Talk to BlackQuant — account support, security disclosures, press, partnerships and careers, each with a named route and a stated response time.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <PageShell>
      <PageHero
        icon={MessageSquare}
        eyebrow="Contact"
        title="Talk to a person"
        subtitle="Five direct routes below, each with a response time we hold ourselves to. If none of them fit, the form reaches the whole team."
      />

      <Band>
        <Reveal>
          <BandHeading sub="Pick the route that matches — it reaches the right person faster than a general enquiry does.">
            Where to send it
          </BandHeading>
        </Reveal>
        <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CHANNELS.map((channel, i) => (
            <Reveal key={channel.title} delay={i * STAGGER} className="h-full">
              <ChannelCard channel={channel} />
            </Reveal>
          ))}
        </div>
      </Band>

      <Band divider className="bg-bq-overlay/[0.01]">
        <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
          <Reveal>
            <BandHeading sub="For anything that doesn't fit a route above. It lands in a shared inbox that a person reads.">
              Send us a message
            </BandHeading>
            <div className="mt-7">
              <ContactForm />
            </div>
          </Reveal>

          <Reveal delay={STAGGER}>
            <Card className="flex flex-col gap-5">
              <div>
                <p className="font-plex text-[10px] uppercase tracking-[2px] text-bq-dim">
                  Prefer email?
                </p>
                <a
                  href={`mailto:${CONTACT_INBOX}`}
                  className="mt-2 flex w-fit items-center gap-1.5 text-[14px] font-bold text-bq-green underline underline-offset-[3px] hover:opacity-75"
                >
                  {CONTACT_INBOX}
                </a>
              </div>

              <div className="border-t border-bq-border-soft pt-5">
                <p className="font-plex text-[10px] uppercase tracking-[2px] text-bq-dim">
                  Registered office
                </p>
                <p className="mt-2 text-[13px] leading-[1.7] text-bq-muted">
                  BlackQuant
                  <br />
                  Singapore
                </p>
              </div>

              <div className="border-t border-bq-border-soft pt-5">
                <p className="font-plex text-[10px] uppercase tracking-[2px] text-bq-dim">
                  Hours
                </p>
                <p className="mt-2 text-[13px] leading-[1.7] text-bq-muted">
                  The desk runs on Singapore hours. The platform runs continuously
                  — anything urgent and account-related should go to the Help
                  Desk, which is monitored around the clock.
                </p>
              </div>

              <p className="border-t border-bq-border-soft pt-5 text-[12px] leading-[1.65] text-bq-dim">
                We will never ask for your seed phrase, private keys, or a
                transfer to a &ldquo;recovery&rdquo; address. Nobody from
                BlackQuant will contact you first asking for either.
              </p>
            </Card>
          </Reveal>
        </div>
      </Band>
    </PageShell>
  );
}

function ChannelCard({ channel }: { channel: Channel }) {
  const { icon: Icon, action } = channel;
  // A route can point at a page or an address; only the former should go
  // through the router.
  const isExternal = action.href.startsWith("mailto:");

  return (
    <Card className="flex flex-col">
      <Icon className="size-5 text-bq-green" />
      <h3 className="mt-3 font-satoshi text-[15px] font-bold text-bq-heading">
        {channel.title}
      </h3>
      <p className="mt-2 flex-1 text-[13px] leading-[1.7] text-bq-muted">
        {channel.body}
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-bq-border-soft pt-4">
        {isExternal ? (
          <a
            href={action.href}
            className="flex items-center gap-1.5 text-[12px] font-bold text-bq-green hover:opacity-75"
          >
            {action.label}
            <ArrowUpRight className="size-3.5" />
          </a>
        ) : (
          <Link
            href={action.href}
            className="flex items-center gap-1.5 text-[12px] font-bold text-bq-green hover:opacity-75"
          >
            {action.label}
            <ArrowUpRight className="size-3.5" />
          </Link>
        )}
        <span className="flex items-center gap-1.5 text-[11px] text-bq-dim">
          <Clock className="size-3" />
          {channel.sla}
        </span>
      </div>
    </Card>
  );
}
