"use server";

import { verificationStage, type VerificationStage } from "@/lib/account-status";
import { getTwoFactorStatus } from "@/app/two-factor-actions";
import { getLatestSubmission } from "@/app/kyc-actions";

export type AccountStatus = {
  twoFactorEnabled: boolean;
  verification: VerificationStage;
};

/**
 * The security state the dashboard chrome badges. Composed from the readers the
 * 2FA and verification screens already use, so a badge can never disagree with
 * the page it links to. Both are independent, so they run concurrently.
 */
export async function getAccountStatus(): Promise<AccountStatus> {
  const [twoFactor, submission] = await Promise.all([
    getTwoFactorStatus(),
    getLatestSubmission(),
  ]);

  return {
    twoFactorEnabled: twoFactor?.enabled ?? false,
    verification: verificationStage(submission),
  };
}
