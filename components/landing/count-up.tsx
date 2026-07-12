"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animates the numeric part of a stat string (e.g. "$2.4B+", "98.7%") from 0
 * to its target on mount, preserving any prefix/suffix. Respects reduced motion.
 */
export function CountUp({
  value,
  className,
  duration = 1300,
}: {
  value: string;
  className?: string;
  duration?: number;
}) {
  const parts = value.match(/^([^\d.-]*)([\d.,]+)(.*)$/);
  const zero = parts ? `${parts[1]}0${parts[3]}` : value;
  const [display, setDisplay] = useState(zero);
  const ran = useRef(false);

  useEffect(() => {
    if (!parts) {
      setDisplay(value);
      return;
    }
    if (ran.current) return;
    ran.current = true;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }

    const [, prefix, numStr, suffix] = parts;
    const target = parseFloat(numStr.replace(/,/g, ""));
    const decimals = (numStr.split(".")[1] || "").length;
    const fmt = (n: number) =>
      `${prefix}${n.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}${suffix}`;

    let raf = 0;
    let start = 0;
    const step = (t: number) => {
      if (!start) start = t;
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(p < 1 ? fmt(target * eased) : value);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span className={className}>{display}</span>;
}
