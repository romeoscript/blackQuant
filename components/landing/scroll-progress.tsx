"use client";

import { useEffect, useState } from "react";

/** Thin top bar that fills as the page scrolls. rAF-throttled. */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      setProgress(max > 0 ? Math.min(window.scrollY / max, 1) : 0);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[2px]">
      <div
        className="h-full origin-left bg-bq-green"
        style={{
          transform: `scaleX(${progress})`,
          boxShadow: "0 0 10px rgba(74,222,128,0.7)",
        }}
      />
    </div>
  );
}
