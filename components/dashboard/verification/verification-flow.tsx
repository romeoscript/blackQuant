"use client";

import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { Stepper, Card } from "@/components/dashboard/widgets";
import { DocumentStep } from "./document-step";
import type { KycSubmissionView } from "@/app/kyc-actions";

/**
 * Browser-only: the face detector needs a camera and WebGL, and its dependency
 * chain resolves to `@tensorflow/tfjs-node` when bundled for SSR. Excluding it
 * also keeps OpenCV and the TensorFlow runtime out of every other page.
 */
const LivenessCapture = dynamic(
  () => import("./liveness-capture").then((m) => m.LivenessCapture),
  {
    ssr: false,
    loading: () => (
      <Card>
        <span className="flex items-center gap-2 text-[13px] text-bq-muted">
          <Loader2 className="size-4 animate-spin" /> Loading face check…
        </span>
      </Card>
    ),
  },
);

const STEPS = ["Upload document", "Face capture", "Review"];

/**
 * Which step to show is derived from the submission rather than held in state,
 * so a reload lands the user exactly where they left off.
 */
export function VerificationFlow({
  submission,
}: {
  submission: KycSubmissionView | null;
}) {
  const router = useRouter();
  const refresh = () => router.refresh();

  const step = !submission ? 0 : submission.livenessSimulated ? 2 : 1;

  return (
    <>
      <Card>
        <Stepper steps={STEPS} current={step} />
      </Card>

      {step === 0 && <DocumentStep onSubmitted={refresh} />}
      {step === 1 && <LivenessCapture onSubmitted={refresh} />}
    </>
  );
}
