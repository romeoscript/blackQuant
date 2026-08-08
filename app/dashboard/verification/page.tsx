import {
  BadgeCheck,
  ScanFace,
  Clock,
  CircleX,
  Lock,
  EyeOff,
  TriangleAlert,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { Card, StatPill, HeaderActions } from "@/components/dashboard/widgets";
import { VerificationFlow } from "@/components/dashboard/verification/verification-flow";
import { getLatestSubmission, getStorageMode } from "@/app/kyc-actions";
import { verificationStage } from "@/lib/account-status";

export default async function VerificationPage() {
  const [submission, storageMode] = await Promise.all([
    getLatestSubmission(),
    getStorageMode(),
  ]);

  // Same rule the sidebar badge reads, so the two cannot disagree. The explicit
  // null check is what lets TypeScript narrow `submission` inside the branches
  // these flags guard.
  const stage = verificationStage(submission);
  const approved = submission !== null && stage === "approved";
  const awaitingReview = submission !== null && stage === "in-review";

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Verification" actions={<HeaderActions />} />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-bq-border bg-bq-surface px-4 py-3">
        <p className="flex items-center gap-2.5 text-[13px] text-bq-text">
          {approved ? (
            <BadgeCheck className="size-4 shrink-0 text-primary" />
          ) : (
            <ScanFace className="size-4 shrink-0 text-bq-loss-text" />
          )}
          <span>
            <span className="font-semibold text-bq-heading">
              {approved
                ? "Your identity is verified"
                : awaitingReview
                  ? "Your submission is under review"
                  : "Your identity is not verified"}
            </span>
            <span className="block text-bq-dim">
              {approved
                ? `Approved ${submission.reviewedAt ? formatDate(submission.reviewedAt) : ""}`
                : awaitingReview
                  ? "We'll notify you once a decision is made."
                  : "Verify your identity to raise your withdrawal limits."}
            </span>
          </span>
        </p>
        <StatPill tone={approved ? "green" : awaitingReview ? "amber" : "red"}>
          {approved ? "Verified" : awaitingReview ? "Pending" : "Unverified"}
        </StatPill>
      </div>

      {storageMode === "local-dev" && (
        <div className="flex items-start gap-2.5 rounded-xl border border-bq-warn/25 bg-bq-warn/[0.06] px-4 py-3">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-bq-warn-text" />
          <p className="text-[12px] text-bq-muted">
            <span className="font-semibold text-bq-warn-text">
              No object store configured.
            </span>{" "}
            Uploads are written unencrypted to <code>.uploads/</code> on this
            machine. Set the <code>S3_*</code> variables before any real use.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {submission?.status === "REJECTED" && (
            <Card className="border-bq-loss/25 bg-bq-loss/[0.04]">
              <div className="flex items-start gap-3">
                <CircleX className="mt-0.5 size-5 shrink-0 text-bq-loss-text" />
                <div>
                  <h2 className="font-semibold text-bq-heading">
                    Not approved
                  </h2>
                  <p className="mt-1 text-[13px] text-bq-muted">
                    {submission.reviewNote ??
                      "Your submission couldn't be verified. Please try again with clearer photos."}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {approved ? (
            <Card>
              <BadgeCheck className="size-8 text-primary" />
              <h2 className="mt-3 font-semibold text-bq-heading">
                Verification complete
              </h2>
              <p className="mt-1 text-[13px] text-bq-muted">
                Submitted {formatDate(submission.submittedAt)} ·{" "}
                {submission.documentCount} document
                {submission.documentCount === 1 ? "" : "s"} on file.
              </p>
            </Card>
          ) : awaitingReview ? (
            <Card>
              <Clock className="size-8 text-bq-warn-text" />
              <h2 className="mt-3 font-semibold text-bq-heading">
                Under review
              </h2>
              <p className="mt-1 text-[13px] text-bq-muted">
                Submitted {formatDate(submission.submittedAt)}.
                A reviewer will compare your document with your face capture.
              </p>
            </Card>
          ) : (
            <VerificationFlow
              submission={
                submission?.status === "PENDING" ? submission : null
              }
            />
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="font-semibold text-bq-heading">
              What verification unlocks
            </h3>
            <p className="mt-2 text-[13px] text-bq-muted">
              A verified identity is what withdrawal limits and institutional
              features will be gated on.
            </p>
            <p className="mt-3 border-t border-bq-border-soft pt-3 text-[11px] text-bq-dim">
              Tiered limits aren&apos;t enforced yet. Funding and withdrawals have no
              data model, so no limit is applied today.
            </p>
          </Card>

          <Card>
            <Lock className="size-6 text-primary" />
            <h3 className="mt-3 font-semibold text-bq-heading">
              How your documents are handled
            </h3>
            <ul className="mt-3 space-y-2.5 text-[13px] text-bq-muted">
              <li className="flex items-start gap-2.5">
                <EyeOff className="mt-0.5 size-4 shrink-0 text-bq-dim" />
                Stored privately, never served from a public URL.
              </li>
              <li className="flex items-start gap-2.5">
                <Lock className="mt-0.5 size-4 shrink-0 text-bq-dim" />
                Reviewers open them through short-lived signed links.
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
