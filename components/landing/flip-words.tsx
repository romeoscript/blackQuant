"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Cycles a single headline line through several phrases with a 3D card-flip.
 * A single element flips out (rotateX 90°), swaps text on the hidden far side,
 * then flips back in — giving a continuous flip through the list.
 */
export function FlipWords({
  words,
  className,
  interval = 2600,
}: {
  words: string[];
  className?: string;
  interval?: number;
}) {
  const [i, setI] = useState(0);
  const elRef = useRef<HTMLSpanElement>(null);
  const idx = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const TRANS = "transform .4s ease, opacity .4s ease";
    const id = window.setInterval(() => {
      const el = elRef.current;
      if (!el) return;
      el.style.transition = TRANS;
      el.style.transform = "rotateX(90deg)";
      el.style.opacity = "0";
      window.setTimeout(() => {
        el.style.transition = "none";
        el.style.transform = "rotateX(-90deg)";
        idx.current = (idx.current + 1) % words.length;
        setI(idx.current);
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            el.style.transition = TRANS;
            el.style.transform = "rotateX(0deg)";
            el.style.opacity = "1";
          }),
        );
      }, 420);
    }, interval);
    return () => window.clearInterval(id);
  }, [words.length, interval]);

  const widest = words.reduce((a, b) => (b.length > a.length ? b : a), "");

  return (
    <span className={cn("relative block text-center", className)}>
      <span className="relative inline-block [perspective:800px]">
        <span aria-hidden className="invisible whitespace-nowrap">
          {widest}
        </span>
        <span
          ref={elRef}
          aria-live="polite"
          className="absolute inset-0 flex items-center justify-center whitespace-nowrap [backface-visibility:hidden] [transform-style:preserve-3d]"
        >
          {words[i]}
        </span>
      </span>
    </span>
  );
}
