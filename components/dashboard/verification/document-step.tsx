"use client";

import { useActionState, useEffect, useState } from "react";
import { CreditCard, BookOpen, Car, Upload, Loader2, CircleCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card, StatPill } from "@/components/dashboard/widgets";
import {
  DOCUMENT_TYPES,
  REQUIREMENTS,
  UPLOAD_ACCEPT_ATTRIBUTE,
  humanBytes,
  MAX_UPLOAD_BYTES,
  sidesFor,
  type DocumentTypeId,
} from "@/lib/kyc";
import { submitDocuments, type KycState } from "@/app/kyc-actions";

const IDLE: KycState = { ok: false, message: "" };

const ICONS = { id: CreditCard, passport: BookOpen, licence: Car } as const;

export function DocumentStep({ onSubmitted }: { onSubmitted: () => void }) {
  const [documentType, setDocumentType] = useState<DocumentTypeId>(DOCUMENT_TYPES[0].id);
  const [state, formAction, pending] = useActionState(submitDocuments, IDLE);
  const sides = sidesFor(documentType);

  useEffect(() => {
    if (!state.ok) return;
    toast.success(state.message);
    onSubmitted();
  }, [state, onSubmitted]);

  return (
    <Card>
      <h2 className="font-semibold text-bq-heading">Step 1 of 3: your document</h2>
      <p className="text-[12px] text-bq-dim">
        Choose a government-issued document and upload a clear photo of it.
      </p>

      <form action={formAction}>
        <input type="hidden" name="documentType" value={documentType} />

        <div className="mt-4 space-y-2">
          {DOCUMENT_TYPES.map((doc) => {
            const Icon = ICONS[doc.id];
            const selected = documentType === doc.id;
            return (
              <button
                key={doc.id}
                type="button"
                onClick={() => setDocumentType(doc.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border px-4 py-3.5 text-left transition-colors",
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-bq-border hover:bg-bq-overlay/[0.03]",
                )}
              >
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-bq-bg text-bq-muted">
                  <Icon className="size-4" />
                </span>
                <span className="flex-1">
                  <span className="text-[13px] font-semibold text-bq-heading">
                    {doc.name}
                  </span>
                  <span className="mt-0.5 block text-[12px] text-bq-dim">
                    {doc.sub}
                  </span>
                </span>
                <span
                  className={cn(
                    "mt-1 size-4 shrink-0 rounded-full border",
                    selected ? "border-[5px] border-primary" : "border-bq-border",
                  )}
                />
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <FilePicker name="DOCUMENT_FRONT" label={sides === 1 ? "Photo page" : "Front"} />
          {sides === 2 && <FilePicker name="DOCUMENT_BACK" label="Back" />}
        </div>

        <ul className="mt-4 space-y-1.5">
          {REQUIREMENTS.map((r) => (
            <li key={r} className="flex items-center gap-2 text-[12px] text-bq-muted">
              <CircleCheck className="size-3.5 shrink-0 text-bq-dim" /> {r}
            </li>
          ))}
        </ul>

        {!state.ok && state.message && (
          <p role="alert" className="mt-3 text-[12px] text-bq-loss-text">
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-4 flex items-center gap-2 rounded-lg bg-bq-contrast px-5 py-2.5 text-[13px] font-semibold text-bq-on-fill transition-transform hover:scale-[1.02] active:translate-y-px disabled:opacity-60"
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          {pending ? "Uploading…" : "Continue to face capture"}
        </button>
      </form>
    </Card>
  );
}

function FilePicker({ name, label }: { name: string; label: string }) {
  const [file, setFile] = useState<File | null>(null);
  const tooBig = file !== null && file.size > MAX_UPLOAD_BYTES;

  return (
    <label className="cursor-pointer">
      <span className="text-[12px] text-bq-muted">{label}</span>
      <div
        className={cn(
          "mt-1.5 flex items-center gap-2 rounded-lg border border-dashed px-3 py-4 transition-colors",
          tooBig ? "border-bq-loss/50" : "border-bq-border hover:border-primary/50",
        )}
      >
        <Upload className="size-4 shrink-0 text-bq-dim" />
        <span className="min-w-0 flex-1 truncate text-[13px] text-bq-heading">
          {file ? file.name : "Click to upload"}
        </span>
        {file && <StatPill tone={tooBig ? "red" : "neutral"}>{humanBytes(file.size)}</StatPill>}
      </div>
      <input
        type="file"
        name={name}
        accept={UPLOAD_ACCEPT_ATTRIBUTE}
        required
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="hidden"
      />
      {tooBig && (
        <span className="mt-1 block text-[11px] text-bq-loss-text">
          Must be under {humanBytes(MAX_UPLOAD_BYTES)}.
        </span>
      )}
    </label>
  );
}
