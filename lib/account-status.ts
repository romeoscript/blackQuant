import type { KycStatus } from "@prisma/client";


export type VerificationStage = "approved" | "in-review" | "unverified";

type SubmissionLike = {
  status: KycStatus;
  livenessSimulated: boolean;
} | null;

export function verificationStage(submission: SubmissionLike): VerificationStage {
  if (submission?.status === "APPROVED") return "approved";
  if (submission?.status === "PENDING" && submission.livenessSimulated) {
    return "in-review";
  }
  return "unverified";
}

export type StatusBadge = { text: string; tone: "live" | "warn" | "danger" };

const VERIFICATION_BADGES: Record<VerificationStage, StatusBadge> = {
  approved: { text: "Verified", tone: "live" },
  "in-review": { text: "In review", tone: "warn" },
  unverified: { text: "Unverified", tone: "danger" },
};

export const verificationBadge = (stage: VerificationStage): StatusBadge =>
  VERIFICATION_BADGES[stage];

export const twoFactorBadge = (enabled: boolean): StatusBadge =>
  enabled
    ? { text: "Enabled", tone: "live" }
    : { text: "Unconfigured", tone: "danger" };
