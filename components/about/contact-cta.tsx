import Link from "next/link";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/landing/reveal";
import { CONTACT_ACTIONS } from "./data";
import { AboutCard, AboutSection } from "./section";

export function AboutContactCta() {
  return (
    <AboutSection>
      <Reveal>
        <AboutCard className="relative overflow-hidden p-5 md:p-8">
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
                Have a question or feedback?
              </h2>
              <p className="mt-1.5 max-w-[540px] text-[11px] leading-[1.43] text-bq-muted md:text-[13px]">
                Reach out through the Help Desk — our team typically responds
                within 2 hours. For partnership enquiries, use the dedicated
                form in the Knowledge Base.
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-2 md:flex-row md:items-center md:gap-3">
              {CONTACT_ACTIONS.map(
                ({ icon: Icon, prefix, label, href, primary }) => (
                  <Link
                    key={label}
                    href={href}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-bold transition-transform active:translate-y-px",
                      primary
                        ? "bg-bq-green text-bq-on-fill hover:bg-bq-green/90"
                        : "border border-bq-overlay/[0.12] bg-bq-surface text-bq-text hover:text-bq-heading",
                    )}
                  >
                    <Icon className="size-3.5 shrink-0" />
                    {/* One flex child, or the row gap lands between prefix and label. */}
                    <span>
                      <span className="hidden sm:inline">{prefix}</span>
                      {label}
                    </span>
                  </Link>
                ),
              )}
            </div>
          </div>
        </AboutCard>
      </Reveal>
    </AboutSection>
  );
}
