"use client";

import { useEffect, useState } from "react";

/**
 * Live-ticking network metrics. Executions climb and latency jitters on an
 * interval so the panel reads as a running system, not a static snapshot.
 */
export function LiveMetrics() {
  const [executions, setExecutions] = useState(1842);
  const [latency, setLatency] = useState(4);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setExecutions((n) => n + 1 + Math.floor(Math.random() * 4));
      setLatency(3 + Math.floor(Math.random() * 4));
      setBump(true);
      setTimeout(() => setBump(false), 320);
    }, 2400);
    return () => clearInterval(id);
  }, []);

  const rows = [
    { label: "Executions Processed", value: executions.toLocaleString("en-US"), live: true },
    { label: "Available Liquidity Sources", value: "14" },
    { label: "Node clusters", value: "5" },
    { label: "Avg latency", value: `${latency}ms` },
  ];

  return (
    <ul className="mt-3 space-y-2.5">
      {rows.map((m) => (
        <li key={m.label} className="flex items-center justify-between text-[12px]">
          <span className="text-bq-muted">{m.label}</span>
          <span
            className={`font-satoshi font-bold tabular-nums transition-colors duration-300 ${
              m.live && bump ? "text-bq-green" : "text-white"
            }`}
          >
            {m.value}
          </span>
        </li>
      ))}
    </ul>
  );
}
