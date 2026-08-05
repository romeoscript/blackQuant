"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { useEffect, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import "lenis/dist/lenis.css";

/**
 * Drives Lenis from GSAP's ticker (autoRaf disabled) and keeps ScrollTrigger
 * in sync with Lenis' smooth scroll position. Rendered inside <ReactLenis>.
 */
function LenisGsapSync() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    lenis.on("scroll", ScrollTrigger.update);

    const onTick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.off("scroll", ScrollTrigger.update);
      gsap.ticker.remove(onTick);
    };
  }, [lenis]);

  return null;
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,
        smoothWheel: true,
        // Off by default, which makes Lenis consume every wheel event and scroll
        // the page even when the cursor is over a nested scroll container — the
        // dashboard sidebar, the mobile drawer, tall dialogs. Enabling it lets
        // those scroll natively; an `overscroll-contain` child additionally keeps
        // the page still once the child hits its top or bottom.
        allowNestedScroll: true,
        // GSAP's ticker drives the RAF loop (see LenisGsapSync).
        autoRaf: false,
      }}
    >
      <LenisGsapSync />
      {children}
    </ReactLenis>
  );
}
