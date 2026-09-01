"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { TocEntry } from "@/lib/blog-render";

/**
 * Sticky contents rail with a reading indicator.
 *
 * The ids come from the same pass that rendered the article (see
 * lib/blog-render.ts), so they always match the anchors in the body.
 *
 * The observer's `rootMargin` collapses the viewport to a band near the top:
 * without it every heading on a long screen is "intersecting" at once and the
 * highlight lands on whichever fired last. The band makes "current" mean the
 * heading that has most recently crossed under the nav, which is what a reader
 * takes it to mean.
 */
export function TableOfContents({ entries }: { entries: TocEntry[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (entries.length === 0) return;

    const headings = entries
      .map((e) => document.getElementById(e.id))
      .filter((el): el is HTMLElement => el !== null);
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (records) => {
        const visible = records
          .filter((r) => r.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -70% 0px" },
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [entries]);

  if (entries.length === 0) return null;

  return (
    <nav aria-label="On this page" className="flex flex-col gap-3">
      <p className="font-plex text-[10px] uppercase tracking-[2px] text-bq-dim">
        On this page
      </p>
      <ul className="flex flex-col gap-0.5 border-l border-bq-border">
        {entries.map((entry) => (
          <li key={entry.id}>
            <a
              href={`#${entry.id}`}
              className={cn(
                "-ml-px block border-l py-1.5 pr-2 text-[12px] leading-[1.5] transition-colors",
                entry.depth === 3 ? "pl-6" : "pl-3.5",
                entry.id === activeId
                  ? "border-bq-green font-bold text-bq-heading"
                  : "border-transparent text-bq-muted hover:text-bq-heading",
              )}
            >
              {entry.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
