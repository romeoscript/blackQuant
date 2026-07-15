"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animates the numeric part of a stat string (e.g. "$2.4B+", "98.7%") from 0
 * to its target when it scrolls into view, preserving any prefix/suffix.
 * Respects reduced motion.
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
  const ref = useRef<HTMLSpanElement>(null);
  const ran = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!parts || !el) {
      setDisplay(value);
      return;
    }

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
    const animate = () => {
      if (ran.current) return;
      ran.current = true;
      let start = 0;
      const step = (t: number) => {
        if (!start) start = t;
        const p = Math.min((t - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setDisplay(p < 1 ? fmt(target * eased) : value);
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          animate();
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
