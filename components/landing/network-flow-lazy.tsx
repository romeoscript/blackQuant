"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

/**
 * `@xyflow/react` (plus its stylesheet) is ~200 KB for what is a decorative,
 * non-interactive diagram sitting well below the fold. Loading it eagerly put
 * the whole graph library on the landing page's critical path, so it is split
 * into its own chunk and only fetched once the panel scrolls near the viewport.
 */
const NetworkFlow = dynamic(
  () => import("./network-flow").then((m) => m.NetworkFlow),
  { ssr: false },
);

export function NetworkFlowLazy() {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShow(true);
          io.disconnect();
        }
      },
      // Start fetching a screen early so the diagram is ready on arrival.
      { rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // The placeholder reserves the exact height NetworkFlow renders at, so the
  // swap costs no layout shift.
  return (
    <div ref={ref} className="h-[360px] w-full sm:h-[440px]">
      {show ? <NetworkFlow /> : null}
    </div>
  );
}
