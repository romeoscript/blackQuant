"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Sparkles, X } from "lucide-react";

// The chat panel is only ever seen after a deliberate click, so its markup and
// deps stay out of the landing page's initial JS and load on first open.
const AssistantChat = dynamic(
  () => import("./assistant-chat").then((m) => m.AssistantChat),
  { ssr: false },
);

/** Floating assistant launcher — mounted on the public landing page. */
export function AssistantWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-[60] h-[min(560px,72vh)] w-[min(384px,calc(100vw-2rem))] origin-bottom-right md:right-6">
          <AssistantChat className="h-full shadow-2xl shadow-black/50" onClose={() => setOpen(false)} />
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close assistant" : "Chat with the assistant"}
        className="fixed bottom-6 right-4 z-[60] flex size-14 items-center justify-center rounded-full bg-bq-mint text-black shadow-lg shadow-black/40 transition hover:scale-105 active:translate-y-px md:right-6"
      >
        {open ? <X className="size-6" /> : <Sparkles className="size-6" />}
      </button>
    </>
  );
}
