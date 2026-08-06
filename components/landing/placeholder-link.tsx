"use client";

import { toast } from "sonner";

/** Shown for nav/footer destinations that have no page in this build. */
export function notifyUnwired(label: string) {
  toast(label, { description: "This destination isn't wired up in the demo yet." });
}

/**
 * A link-shaped button for a destination that doesn't exist yet. Isolating the
 * toast here keeps its containers (the footer) renderable on the server.
 */
export function PlaceholderLink({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <button onClick={() => notifyUnwired(label)} className={className}>
      {label}
    </button>
  );
}
