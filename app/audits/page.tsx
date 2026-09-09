import type { Metadata } from "next";
import {
  ArrowUpRight,
  Download,
  FileText,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/landing/reveal";
import { ContactCta } from "@/components/landing/contact-cta";
import {
  Band,
  BandHeading,
  Card,
  PageHero,
  PageShell,
} from "@/components/marketing/page-shell";
import { AUDIT_LOGOS } from "@/components/landing/audit-logos";
import { CONTRACTS_REPO } from "@/components/landing/data";
import {
  AUDIT_REPORTS,
  EMPTY_SEVERITY_STYLE,
  SECURITY_INBOX,
  SEVERITY_LABELS,
  SEVERITY_STYLES,
  type AuditReport,
} from "@/components/security/data";

const STAGGER = 60;

export const metadata: Metadata = {
  title: "Audit Reports · BlackQuant",
  description:
    "Third-party security reviews covering BlackQuant and the on-chain components it builds on — full PDFs, unedited, with the scope each firm actually reviewed.",
  alternates: { canonical: "/audits" },
};

export default function AuditsPage() {
  return (
    <PageShell>
      <PageHero
        icon={ShieldCheck}
        eyebrow="Security"
        title="Audit reports"
        subtitle="The full PDFs as the firms delivered them — no summaries standing in for the document, no gate. Each entry states the codebase that was reviewed, because that is the part a summary usually loses."
      />

      <Band>
        <Reveal>
          <BandHeading sub="Reviews of the on-chain components our contracts inherit from. They are published here because a dependency's audit is part of our surface too — but they are audits of that dependency, not of BlackQuant's own contracts.">
            Upstream dependencies
          </BandHeading>
        </Reveal>
        <div className="mt-7 flex flex-col gap-4">
          {AUDIT_REPORTS.filter((r) => r.upstream).map((report, i) => (
            <Reveal key={report.id} delay={i * STAGGER}>
              <ReportCard report={report} />
            </Reveal>
          ))}
        </div>
      </Band>

      <Band divider className="bg-bq-overlay/[0.01]">
        <Reveal>
          <BandHeading sub="An audit is a snapshot of specific commits over a fixed window, by people who had a fixed number of days. It is evidence that the code was looked at carefully, not a proof that it is safe — and a report covering a dependency says nothing about the code we wrote on top of it. Read the scope section of each PDF before drawing a conclusion from it; that is why the whole document is here rather than a score.">
            How to read these
          </BandHeading>
        </Reveal>
      </Band>

      <Band divider className="py-10 md:py-12">
        <Reveal>
          <ContactCta
            title="Found something?"
            body="Report a vulnerability directly to the security inbox. We acknowledge within one working day and will not take legal action against good-faith research."
            actions={[
              {
                icon: FileText,
                label: "Read the contracts",
                href: CONTRACTS_REPO,
              },
              {
                icon: Mail,
                prefix: "Email ",
                label: "security",
                href: `mailto:${SECURITY_INBOX}`,
                primary: true,
              },
            ]}
          />
        </Reveal>
      </Band>
    </PageShell>
  );
}

/** `id` sits on a wrapper so a link can address one report; `Card` takes none. */
function ReportCard({ report }: { report: AuditReport }) {
  const { Logo, className: logoClass } = AUDIT_LOGOS[report.logoSlug];

  return (
    <section id={report.id} className="scroll-mt-24">
      <Card>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
          <div className="min-w-0 flex-1">
            {/* Fixed-height box so wordmarks of very different proportions
                share one baseline down the column, as in the landing page's
                audit row. The SVGs are `currentColor` and carry their own
                `aria-label`, so the heading announces the firm without a
                duplicate text node beside it. */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <h3 className="flex h-[40px] items-center text-bq-heading">
                <Logo className={logoClass} />
              </h3>
              <time
                dateTime={report.publishedIso}
                className="font-plex text-[11px] text-bq-dim"
              >
                {report.published}
              </time>
            </div>

            <p className="mt-1 text-[13px] leading-[1.6] text-bq-text">
              {report.title}
            </p>

            {/* The scope line, not the firm's name, is what tells a reader whether
              this report says anything about the code they are about to trust. */}
            <dl className="mt-4 flex flex-col gap-2 border-l border-bq-border pl-4">
              <ScopeRow label="Reviewed">{report.subject}</ScopeRow>
              <ScopeRow label="Window">{report.window}</ScopeRow>
              <ScopeRow label="Target">
                <a
                  href={report.repo.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-bq-green transition-opacity hover:opacity-75"
                >
                  {report.repo.label}
                  <ArrowUpRight className="size-3" />
                </a>
              </ScopeRow>
            </dl>

            <p className="mt-4 text-[12px] leading-[1.7] text-bq-muted">
              {report.summary}
            </p>

            <ul className="mt-4 flex flex-wrap gap-2">
              {report.findings.map((finding) => (
                <li
                  key={finding.severity}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-2.5 py-1",
                    finding.count === 0
                      ? EMPTY_SEVERITY_STYLE
                      : SEVERITY_STYLES[finding.severity],
                  )}
                >
                  <span className="font-plex text-[11px] font-bold">
                    {finding.count}
                  </span>
                  <span className="text-[11px]">
                    {SEVERITY_LABELS[finding.severity]}
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-3 text-[12px] leading-[1.6] text-bq-green">
              {report.resolution}
            </p>
          </div>

          <a
            href={report.href}
            target="_blank"
            rel="noreferrer"
            className="flex w-fit shrink-0 items-center gap-2 rounded-full border border-bq-border px-4 py-2 text-[12px] font-bold text-bq-heading transition-colors hover:border-bq-green/30 hover:text-bq-green"
          >
            <Download className="size-3.5" />
            PDF
            <span className="font-plex text-[11px] font-normal text-bq-dim">
              {report.size}
            </span>
          </a>
        </div>
      </Card>
    </section>
  );
}

function ScopeRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="font-plex text-[10px] uppercase tracking-[1.5px] text-bq-dim sm:w-[72px] sm:shrink-0 sm:pt-0.5">
        {label}
      </dt>
      <dd className="text-[12px] leading-[1.6] text-bq-text">{children}</dd>
    </div>
  );
}
