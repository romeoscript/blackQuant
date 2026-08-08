import { Info } from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { Card, HeaderActions } from "@/components/dashboard/widgets";
import { ResetWizard } from "@/components/dashboard/reset/reset-wizard";
import { getCredentialAccount } from "@/app/credential-actions";
import { maskEmail } from "@/lib/credential-reset";

export default async function ResetPage() {
  const account = await getCredentialAccount();

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Reset Credentials" actions={<HeaderActions />} />

      {!account ? (
        <Card>
          <p className="text-[13px] text-bq-muted">
            We couldn&apos;t load your account. Try signing in again.
          </p>
        </Card>
      ) : !account.hasPassword ? (
        <Card>
          <h2 className="font-semibold text-bq-heading">
            This account has no password
          </h2>
          <p className="mt-1 text-[13px] text-bq-muted">
            You sign in through a connected provider, so there are no credentials
            to reset here. Manage access from that provider instead.
          </p>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-2.5 rounded-xl border border-bq-border bg-bq-surface px-4 py-3 text-[13px] text-bq-muted">
            <Info className="size-4 shrink-0 text-bq-dim" />
            For your security, changing your password requires a code sent to
            your registered email address.
          </div>

          <ResetWizard
            email={account.email}
            maskedEmail={maskEmail(account.email)}
            emailVerified={account.emailVerified}
          />
        </>
      )}
    </div>
  );
}
