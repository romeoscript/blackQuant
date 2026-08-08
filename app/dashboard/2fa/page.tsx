import { Shield, ShieldCheck, ShieldOff, Lock, type LucideIcon } from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { Card, StatPill, HeaderActions } from "@/components/dashboard/widgets";
import { TwoFactorSetup } from "@/components/dashboard/two-factor/setup";
import { EnabledPanel } from "@/components/dashboard/two-factor/enabled-panel";
import { getTwoFactorStatus } from "@/app/two-factor-actions";

const WHY: { text: string; icon: LucideIcon }[] = [
  { text: "Blocks logins with a stolen password", icon: ShieldCheck },
  { text: "Works offline, no SMS needed", icon: Shield },
  { text: "Backup codes for emergencies", icon: Lock },
];

export default async function TwoFactorPage() {
  const status = await getTwoFactorStatus();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="2 Factor Authentication"
        actions={<HeaderActions />}
      />

      {!status ? (
        <Card>
          <p className="text-[13px] text-bq-muted">
            We couldn&apos;t load your security settings. Try signing in again.
          </p>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-bq-border bg-bq-surface px-4 py-3">
            <p className="flex items-center gap-2.5 text-[13px] text-bq-text">
              {status.enabled ? (
                <ShieldCheck className="size-4 shrink-0 text-primary" />
              ) : (
                <ShieldOff className="size-4 shrink-0 text-bq-loss-text" />
              )}
              <span>
                <span className="font-semibold text-bq-heading">
                  {status.enabled
                    ? "Your account is protected"
                    : "Your account is not protected"}
                </span>
                <span className="block text-bq-dim">
                  {status.enabled
                    ? "A code from your authenticator is required to sign in."
                    : "Enable Auth Guard to add a second layer of security."}
                </span>
              </span>
            </p>
            <StatPill tone={status.enabled ? "green" : "red"}>
              {status.enabled ? "Active" : "Unconfigured"}
            </StatPill>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div className="space-y-6">
              {status.enabled ? (
                <EnabledPanel status={status} />
              ) : (
                <TwoFactorSetup />
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <Shield className="size-6 text-primary" />
                <h3 className="mt-3 font-semibold text-bq-heading">
                  Why enable Auth Guard?
                </h3>
                <p className="mt-1 text-[12px] leading-relaxed text-bq-muted">
                  Auth Guard adds a second verification step each time you log
                  in, so a leaked password alone is not enough to reach your
                  account.
                </p>
                <ul className="mt-4 space-y-2.5">
                  {WHY.map((w) => (
                    <li
                      key={w.text}
                      className="flex items-center gap-2.5 text-[13px] text-bq-text"
                    >
                      <w.icon className="size-4 shrink-0 text-primary" /> {w.text}
                    </li>
                  ))}
                </ul>
              </Card>

              <Card>
                <h3 className="font-semibold text-bq-heading">
                  What Auth Guard covers
                </h3>
                <p className="mt-3 text-[13px] text-bq-muted">
                  Signing in. Every login with your password also requires a code
                  from your authenticator, or one of your single-use backup
                  codes.
                </p>
                <p className="mt-3 border-t border-bq-border-soft pt-3 text-[11px] text-bq-dim">
                  Withdrawals and API keys are not covered yet, because those
                  features don&apos;t exist. Changing your password already
                  requires an emailed code.
                </p>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
