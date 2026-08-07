"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Loader2, ScanFace, TriangleAlert, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card } from "@/components/dashboard/widgets";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { submitLivenessCapture, type KycState } from "@/app/kyc-actions";

const IDLE: KycState = { ok: false, message: "" };

/** Actions the user must perform. Two is the library's own recommendation. */
const ACTION_COUNT = 2;
const ACTION_TIMEOUT_MS = 15_000;

/** Staged into public/ by scripts/copy-face-models.mjs. */
const MODEL_PATH = "/models";

type Phase = "idle" | "loading" | "detecting" | "captured";

/** Only the surface this component drives; the package's own types are looser. */
type Engine = {
  initialize: () => Promise<void>;
  startDetection: (video: HTMLVideoElement) => Promise<void>;
  stopDetection: (success: boolean) => void;
  on: (event: string, handler: (data: never) => void) => void;
};

export function LivenessCapture({ onSubmitted }: { onSubmitted: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [prompt, setPrompt] = useState("");
  const [done, setDone] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [shot, setShot] = useState<{ url: string; blob: Blob } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const teardown = useCallback(() => {
    engineRef.current?.stopDetection(false);
    engineRef.current = null;
    const stream = videoRef.current?.srcObject;
    if (stream instanceof MediaStream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  }, []);

  // Releases the camera and the engine on unmount. Without this the device
  // stays held and the hardware indicator remains lit after navigating away.
  useEffect(() => teardown, [teardown]);

  useEffect(
    () => () => {
      if (shot) URL.revokeObjectURL(shot.url);
    },
    [shot],
  );

  const capture = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );

    teardown();
    if (!blob) {
      setError("The capture failed. Try again.");
      setPhase("idle");
      return;
    }
    setShot({ url: URL.createObjectURL(blob), blob });
    setPhase("captured");
    setOpen(false);
  }, [teardown]);

  function close() {
    teardown();
    setOpen(false);
    setPhase("idle");
    setPrompt("");
    setDone(0);
  }

  async function start() {
    setError(null);
    setPrompt("");
    setDone(0);
    setShot(null);
    setOpen(true);
    setPhase("loading");

    try {
      // Imported here rather than at module scope: the detector pulls in OpenCV
      // and TensorFlow, which must never reach the bundle of the users who
      // never open this step.
      const { default: FaceDetectionEngine } = await import(
        "@sssxyd/face-liveness-detector"
      );

      const engine = new FaceDetectionEngine({
        human_model_path: MODEL_PATH,
        // WebGL, so the TensorFlow WASM binaries need not be served too.
        tensorflow_backend: "webgl",
        detect_video_ideal_width: 640,
        detect_video_ideal_height: 480,
        action_liveness_action_count: ACTION_COUNT,
        action_liveness_verify_timeout: ACTION_TIMEOUT_MS,
      }) as unknown as Engine;
      engineRef.current = engine;

      engine.on("detector-action", ((data: {
        action: string;
        status: string;
      }) => {
        setPrompt(promptFor(data.action, data.status));
        if (data.status === "SUCCESS") setDone((n) => Math.min(n + 1, ACTION_COUNT));
      }) as (data: never) => void);

      engine.on("detector-error", ((data: { message?: string }) => {
        teardown();
        setOpen(false);
        setPhase("idle");
        setError(data.message ?? "Face detection failed. Try again.");
      }) as (data: never) => void);

      engine.on("detector-finish", ((data: { success: boolean }) => {
        if (!data.success) {
          teardown();
          setOpen(false);
          setPhase("idle");
          setError("We couldn't confirm a live face. Try again in better light.");
          return;
        }
        void capture();
      }) as (data: never) => void);

      // Split from the camera step below because they fail for unrelated
      // reasons: this one means the models did not load, and telling the user
      // to grant camera access would send them somewhere useless.
      try {
        await engine.initialize();
      } catch (cause) {
        console.error("[liveness] model load failed", cause);
        teardown();
        setOpen(false);
        setPhase("idle");
        setError(
          "The face check couldn't load its models. Refresh the page and try again.",
        );
        return;
      }

      // The <video> lives inside the portaled dialog, so it only exists once
      // React has committed the open state. Waiting beats bailing out, which
      // would leave the dialog up with nothing happening.
      const video = await waitForElement(videoRef);
      if (!video) {
        teardown();
        setOpen(false);
        setPhase("idle");
        setError("The camera preview didn't load. Try again.");
        return;
      }

      setPhase("detecting");
      setPrompt("Look straight at the camera");
      await engine.startDetection(video);
    } catch (cause) {
      console.error("[liveness] camera failed", cause);
      teardown();
      setOpen(false);
      setPhase("idle");
      setError(
        "We couldn't start the camera. Allow camera access in your browser, or use a device that has one.",
      );
    }
  }

  async function submit() {
    if (!shot) return;
    setSubmitting(true);
    setSubmitError(null);
    const data = new FormData();
    data.append("selfie", new File([shot.blob], "selfie.jpg", { type: "image/jpeg" }));
    const result = await submitLivenessCapture(IDLE, data);
    setSubmitting(false);
    if (result.ok) {
      toast.success(result.message);
      onSubmitted();
    } else {
      setSubmitError(result.message);
    }
  }

  return (
    <Card>
      <div className="flex items-center gap-2">
        <ScanFace className="size-5 text-primary" />
        <h2 className="font-semibold text-bq-heading">
          Step 2 of 3: face capture
        </h2>
      </div>
      <p className="mt-1 text-[12px] text-bq-dim">
        A short check opens in a window. Follow the prompts, and we capture a
        photo to compare against your document.
      </p>

      <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-bq-warn/25 bg-bq-warn/[0.06] px-3 py-2.5">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-bq-warn-text" />
        <p className="text-[12px] text-bq-muted">
          <span className="font-semibold text-bq-warn-text">Advisory check.</span>{" "}
          Liveness is measured in your browser, so the result is a quality signal
          rather than proof. A reviewer still compares the photo with your
          document.
        </p>
      </div>

      {shot ? (
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <span className="relative size-24 shrink-0 overflow-hidden rounded-full border border-bq-border">
            {/* eslint-disable-next-line @next/next/no-img-element -- object URL, not a served asset */}
            <img src={shot.url} alt="Your captured photo" className="size-full object-cover" />
          </span>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={submit}
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-bq-contrast px-5 py-2.5 text-[13px] font-semibold text-bq-on-fill transition-transform hover:scale-[1.02] active:translate-y-px disabled:opacity-60"
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitting ? "Submitting…" : "Submit for review"}
            </button>
            <button
              onClick={start}
              className="rounded-lg border border-bq-border px-4 py-2.5 text-[13px] font-medium text-bq-text transition-colors hover:bg-bq-overlay/5"
            >
              Retake
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={start}
          className="mt-4 flex items-center gap-2 rounded-lg bg-bq-contrast px-5 py-2.5 text-[13px] font-semibold text-bq-on-fill transition-transform hover:scale-[1.02] active:translate-y-px"
        >
          <Camera className="size-4" /> Start face check
        </button>
      )}

      {error && (
        <p role="alert" className="mt-3 text-[12px] text-bq-loss-text">
          {error}
        </p>
      )}
      {submitError && (
        <p role="alert" className="mt-3 text-[12px] text-bq-loss-text">
          {submitError}
        </p>
      )}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) close();
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-w-md border-bq-border bg-bq-panel"
          // Closing mid-scan must go through `close()` so the camera is released.
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogTitle className="text-center text-bq-heading">
            Face check
          </DialogTitle>
          <DialogDescription className="text-center text-[12px] text-bq-dim">
            Keep your face inside the circle in an evenly lit room.
          </DialogDescription>

          <div className="relative mx-auto mt-2 size-64">
            <div
              className={cn(
                "size-full overflow-hidden rounded-full border-2 bg-bq-bg transition-colors",
                phase === "detecting" ? "border-primary" : "border-bq-border",
              )}
            >
              <video
                ref={videoRef}
                muted
                playsInline
                className="size-full scale-x-[-1] object-cover"
              />
            </div>

            {phase === "loading" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-full bg-bq-bg/85 text-bq-muted">
                <Loader2 className="size-7 animate-spin" />
                <span className="text-[12px]">Loading face models…</span>
              </div>
            )}

            {phase === "detecting" && (
              <span className="pointer-events-none absolute inset-0 animate-pulse rounded-full ring-4 ring-primary/25" />
            )}
          </div>

          <p className="min-h-6 text-center text-[15px] font-medium text-bq-heading">
            {prompt}
          </p>

          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: ACTION_COUNT }, (_, i) => (
              <span
                key={i}
                aria-hidden
                className={cn(
                  "flex size-5 items-center justify-center rounded-full border text-[10px] transition-colors",
                  i < done
                    ? "border-primary bg-primary text-bq-on-fill"
                    : "border-bq-border text-bq-dim",
                )}
              >
                {i < done ? <Check className="size-3" /> : i + 1}
              </span>
            ))}
            <span className="sr-only">
              {done} of {ACTION_COUNT} actions complete
            </span>
          </div>

          <button
            onClick={close}
            className="mx-auto rounded-lg border border-bq-border px-4 py-2 text-[13px] font-medium text-bq-text transition-colors hover:bg-bq-overlay/5"
          >
            Cancel
          </button>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/** Polls a ref for a few frames, resolving null if the node never appears. */
async function waitForElement<T>(
  ref: React.RefObject<T | null>,
  attempts = 30,
): Promise<T | null> {
  for (let i = 0; i < attempts; i++) {
    if (ref.current) return ref.current;
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
  return ref.current;
}

/** Turns the library's action enum into something a person can follow. */
function promptFor(action: string, status: string): string {
  const instructions: Record<string, string> = {
    BLINK: "Blink slowly",
    MOUTH_OPEN: "Open your mouth",
    NOD_DOWN: "Nod your head down",
    NOD_UP: "Tilt your head up",
    SHAKE_LEFT: "Turn your head left",
    SHAKE_RIGHT: "Turn your head right",
  };
  const instruction = instructions[action] ?? "Follow the prompt";
  return status === "SUCCESS" ? `${instruction}: done` : instruction;
}
