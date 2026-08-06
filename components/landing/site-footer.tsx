"use client";

import Link from "next/link";
import { toast } from "sonner";
import { LogoMark } from "@/components/logo";
import { AUDITS, CHAINS, FOOTER_COLUMNS, FOOTER_LINK_HREFS, LEGAL_LINKS } from "./data";

/**
 * Site-wide footer. Extracted from the landing page's CTA block so marketing
 * pages outside `/` can mount it without dragging the Luminary Circle form
 * along with it.
 */
export function SiteFooter() {
  const notify = (label: string) =>
    toast(label, { description: "This destination isn't wired up in the demo yet." });

  return (
    <footer
      id="about"
      className="mt-14 border-t border-bq-border bg-bq-bg px-4 py-12 sm:px-8 md:mt-24 md:px-16 md:py-16"
    >
      <div className="mx-auto max-w-[1312px]">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_repeat(5,1fr)]">
          <div>
            <div className="flex items-center gap-3">
              <LogoMark />
              <span className="text-xl font-bold tracking-tight text-bq-heading">BlackQuant</span>
            </div>
            <p className="mt-5 max-w-xs text-[13px] leading-relaxed text-bq-muted">
              A high-performance decentralized execution infrastructure.
              Human-centric, blockchain-bound.
            </p>
            <span className="mt-6 flex w-fit items-center gap-2 rounded-full border border-bq-green/30 bg-bq-green/5 px-3 py-1.5">
              <span className="size-1.5 rounded-full bg-bq-green" />
              <span className="text-[12px] text-bq-green">Live on Mainnet</span>
            </span>
            <div className="mt-4 flex flex-wrap gap-2">
              {AUDITS.map((a) => (
                <span
                  key={a.firm}
                  className="rounded-full border border-bq-border px-2.5 py-1 text-[11px] text-bq-muted"
                >
                  {a.firm}
                </span>
              ))}
            </div>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading}>
              <p className="font-plex text-[11px] uppercase tracking-[1.5px] text-bq-muted">
                {col.heading}
              </p>
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => {
                  const href = FOOTER_LINK_HREFS[link];
                  const className =
                    "text-[13px] text-bq-text/70 transition-colors hover:text-bq-heading";
                  return (
                    <li key={link}>
                      {href ? (
                        <Link href={href} className={className}>
                          {link}
                        </Link>
                      ) : (
                        <button onClick={() => notify(link)} className={className}>
                          {link}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-bq-border pt-6 text-[12px] text-bq-muted md:flex-row md:items-center md:justify-between">
          <span>© 2025 BlackQuant · Non-Custodial · Elevation Hub</span>
          <div className="flex gap-6">
            {LEGAL_LINKS.map(({ label, href }) =>
              href ? (
                <Link key={label} href={href} className="hover:text-bq-heading">
                  {label}
                </Link>
              ) : (
                <button
                  key={label}
                  onClick={() => notify(label)}
                  className="hover:text-bq-heading"
                >
                  {label}
                </button>
              ),
            )}
          </div>
          <div className="flex items-center gap-2">
            <span>Built on</span>
            {CHAINS.map((c) => (
              <span
                key={c}
                className="rounded border border-bq-border px-1.5 py-0.5 font-plex text-[10px] text-bq-text"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
