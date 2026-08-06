"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * One IntersectionObserver shared by every Reveal on the page. The landing page
 * mounts ~30 of them; a per-instance observer means 30 separate observers all
 * delivering callbacks on the same scroll.
 */
const onReveal = new WeakMap<Element, () => void>();
let sharedObserver: IntersectionObserver | null = null;

function getObserver(): IntersectionObserver {
  if (sharedObserver) return sharedObserver;
  const created = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        onReveal.get(entry.target)?.();
        onReveal.delete(entry.target);
        created.unobserve(entry.target);
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
  );
  sharedObserver = created;
  return created;
}

/** Fades + lifts children into view once, when scrolled near. */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = getObserver();
    onReveal.set(el, () => setShown(true));
    io.observe(el);
    return () => {
      onReveal.delete(el);
      io.unobserve(el);
    };
  }, []);

  return (
    <div
      ref={ref}
      // Exposed so descendants can stagger off the same trigger — needed where
      // the markup can't take a Reveal wrapper of its own, e.g. inside a grid
      // whose children must stay <li>. Pair with `group` on the same element.
      data-revealed={shown || undefined}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        // Only opacity and transform are animated — both composite on the GPU.
        // The previous `blur()` transition forced a full repaint of every
        // revealing section on every frame (Lighthouse: non-composited
        // animations), and `will-change` is dropped once the reveal is done so
        // ~30 elements aren't held in their own layers for the page's lifetime.
        "transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
        shown
          ? "translate-y-0 scale-100 opacity-100"
          : "translate-y-10 scale-[0.985] opacity-0 will-change-[transform,opacity]",
        className,
      )}
    >
      {children}
    </div>
  );
}
