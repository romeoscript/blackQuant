"use client";

import { useActionState, useEffect, useRef } from "react";
import { CheckCircle2, Loader2, Send, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CONTACT_INITIAL,
  submitContact,
  type ContactState,
} from "@/app/contact-actions";
import { CONTACT_TOPICS } from "./data";

const FIELD =
  "w-full rounded-xl border border-bq-border bg-bq-surface px-3.5 py-2.5 text-[13px] text-bq-heading outline-none transition-colors placeholder:text-bq-dim focus:border-bq-green/40";

export function ContactForm() {
  const [state, formAction, pending] = useActionState<ContactState, FormData>(
    submitContact,
    CONTACT_INITIAL,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the fields once the message is away, so a second enquiry starts from
  // a blank form rather than the previous one's text.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  const errors = state.fieldErrors;

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" error={errors?.name}>
          <input
            name="name"
            required
            maxLength={100}
            autoComplete="name"
            placeholder="Ada Lovelace"
            aria-invalid={Boolean(errors?.name)}
            className={FIELD}
          />
        </Field>

        <Field label="Email" error={errors?.email}>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            aria-invalid={Boolean(errors?.email)}
            className={FIELD}
          />
        </Field>
      </div>

      <Field label="Topic" error={errors?.topic}>
        <select
          name="topic"
          required
          defaultValue={CONTACT_TOPICS[0]}
          aria-invalid={Boolean(errors?.topic)}
          className={cn(FIELD, "appearance-none")}
        >
          {CONTACT_TOPICS.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Message" error={errors?.message}>
        <textarea
          name="message"
          required
          rows={6}
          minLength={20}
          maxLength={5000}
          placeholder="What can we help with?"
          aria-invalid={Boolean(errors?.message)}
          className={cn(FIELD, "resize-y")}
        />
      </Field>

      {/* Honeypot: off-screen rather than `display: none`, which some bots skip,
          and excluded from tab order and the accessibility tree. */}
      <div aria-hidden className="absolute left-[-9999px]">
        <label>
          Company
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 rounded-full bg-bq-contrast px-5 py-2.5 text-[13px] font-bold text-bq-on-fill transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-3.5" />
          )}
          {pending ? "Sending…" : "Send message"}
        </button>

        {state.message && (
          // `role="status"` announces the outcome to a screen reader without
          // stealing focus from wherever the person already is.
          <p
            role="status"
            className={cn(
              "flex items-center gap-2 text-[12px]",
              state.ok ? "text-bq-green" : "text-bq-loss-text",
            )}
          >
            {state.ok ? (
              <CheckCircle2 className="size-3.5 shrink-0" />
            ) : (
              <TriangleAlert className="size-3.5 shrink-0" />
            )}
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-plex text-[10px] uppercase tracking-[1.5px] text-bq-dim">
        {label}
      </span>
      {children}
      {error && <span className="text-[11px] text-bq-loss-text">{error}</span>}
    </label>
  );
}
