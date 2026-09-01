"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Share controls for an article.
 *
 * The canonical URL is passed in from the server rather than read from
 * `window.location`, so a copied link never carries whatever tracking or filter
 * params the reader happened to arrive with.
 */
export function ShareRow({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("Link copied", { description: title });
      // Long enough to register, short enough that the button is ready again
      // if the reader wants to paste somewhere else.
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access needs a secure context and permission; when it is
      // refused the URL is in the address bar anyway, so this only has to say so.
      toast("Couldn't copy", { description: "Copy the link from your address bar." });
    }
  };

  const encoded = encodeURIComponent(url);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 font-plex text-[10px] uppercase tracking-[2px] text-bq-dim">
        Share
      </span>

      {/* Lucide 1.x removed its brand icons, so both marks are drawn inline
          rather than pulling in an icon pack for two glyphs. */}
      <ShareLink
        href={`https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encoded}`}
        label="Share on X"
      >
        <svg viewBox="0 0 24 24" aria-hidden className="size-3.5" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </ShareLink>

      <ShareLink
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`}
        label="Share on LinkedIn"
      >
        <svg viewBox="0 0 24 24" aria-hidden className="size-3.5" fill="currentColor">
          <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13M7.12 20.45H3.55V9h3.57zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0" />
        </svg>
      </ShareLink>

      <button
        type="button"
        onClick={copy}
        aria-label="Copy link to this article"
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors",
          copied
            ? "border-bq-green/30 bg-bq-green/[0.08] text-bq-green"
            : "border-bq-border bg-bq-card text-bq-muted hover:border-bq-green/20 hover:text-bq-heading",
        )}
      >
        {copied ? <Check className="size-3.5" /> : <Link2 className="size-3.5" />}
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}

function ShareLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex size-8 items-center justify-center rounded-full border border-bq-border bg-bq-card text-bq-muted transition-colors hover:border-bq-green/20 hover:text-bq-heading"
    >
      {children}
    </a>
  );
}
