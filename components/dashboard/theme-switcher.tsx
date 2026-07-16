"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const PALETTES = [
  { value: "emerald", label: "Default", dot: "bg-white" },
  { value: "midnight", label: "Midnight", dot: "bg-[#6366f1]" },
  { value: "crimson", label: "Crimson", dot: "bg-[#ef4444]" },
  { value: "gold", label: "Gold", dot: "bg-[#f59e0b]" },
];

function applyPalette(value: string) {
  const el = document.documentElement;
  el.className = el.className.replace(/\btheme-\S+/g, "").trim();
  el.classList.add(`theme-${value}`);
  document.cookie = `palette=${value}; path=/; max-age=31536000`;
}
function readPalette() {
  return document.cookie.match(/(?:^|;\s*)palette=([^;]*)/)?.[1] || "emerald";
}

export function ThemeSwitcher({ className, full = false }: { className?: string; full?: boolean }) {
  const [palette, setPalette] = useState("emerald");
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const p = readPalette();
    applyPalette(p);
    setPalette(p);
    setMounted(true);
  }, []);

  const select = (value: string) => {
    applyPalette(value);
    setPalette(value);
  };

  const group = cn(
    "flex items-center gap-1 border border-bq-border p-1",
    full ? "w-full rounded-[14px] bg-bq-surface" : "rounded-full bg-bq-card",
  );
  const pill = (on: boolean) =>
    cn(
      "flex items-center justify-center gap-1.5 whitespace-nowrap text-[11px] transition-colors",
      full ? "flex-1 rounded-lg py-1.5" : "rounded-full px-2.5 py-1",
      on
        ? full
          ? "bg-bq-bg font-semibold text-white"
          : "bg-bq-surface text-white"
        : "text-bq-dim hover:text-bq-text",
    );

  return (
    <div className={cn("flex gap-2", full ? "flex-col" : "flex-wrap items-center", className)}>
      <div className={group}>
        {PALETTES.map((p) => (
          <button key={p.value} onClick={() => select(p.value)} className={pill(palette === p.value)}>
            <span className={cn("size-1.5 shrink-0 rounded-full", p.dot)} />
            {p.label}
          </button>
        ))}
      </div>
      <div className={group}>
        {(["light", "dark"] as const).map((m) => (
          <button key={m} onClick={() => setTheme(m)} className={pill(mounted && resolvedTheme === m)}>
            {m === "light" ? <Sun className="size-3" /> : <Moon className="size-3" />}
            <span className="capitalize">{m}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
