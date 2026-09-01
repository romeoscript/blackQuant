"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Boilerplate with a copy button.
 *
 * The point of a press kit is that the wording arrives in print unchanged, so
 * the copy affordance sits on the text itself rather than expecting a
 * journalist to select it accurately from a styled block.
 */
export function CopyBlock({
  label,
  text,
  className,
}: {
  label: string;
  text: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast("Copied", { description: label });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Needs a secure context and permission. When refused, the text is on the
      // page and selectable — this only has to stop pretending it worked.
      toast("Couldn't copy", { description: "Select the text and copy it manually." });
    }
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl border border-bq-border bg-bq-card p-5 md:p-6",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="font-plex text-[10px] uppercase tracking-[2px] text-bq-dim">
          {label}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label}`}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition-colors",
            copied
              ? "border-bq-green/30 bg-bq-green/[0.08] text-bq-green"
              : "border-bq-border text-bq-muted hover:border-bq-green/20 hover:text-bq-heading",
          )}
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="mt-3 text-[13px] leading-[1.75] text-bq-text md:text-[14px]">{text}</p>
    </div>
  );
}
