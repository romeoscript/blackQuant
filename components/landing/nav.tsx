"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useLenis } from "lenis/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "./data";

export function Nav() {
  const lenis = useLenis();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const goTo = (target: string) =>
    lenis?.scrollTo(`#${target}`, { offset: -80 });

  const startTrading = () =>
    toast("Start Trading", {
      description: "Connect a wallet to launch the BlackQuant execution engine.",
    });

  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <nav className="mx-auto flex h-[87px] max-w-[1440px] items-center justify-between px-8 md:px-16">
        <button
          onClick={() => lenis?.scrollTo(0)}
          className="flex items-center gap-3"
          aria-label="BlackQuant home"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-white text-[15px] font-bold text-black">
            B
          </span>
          <span className="text-xl font-bold tracking-tight text-white">
            BlackQuant
          </span>
        </button>

        <ul className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.target}>
              <button
                onClick={() => goTo(link.target)}
                className="text-[13px] text-bq-text/70 transition-colors hover:text-white"
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 rounded-full border border-bq-border bg-bq-panel/60 p-1">
            <ThemeButton
              active={mounted && resolvedTheme === "dark"}
              onClick={() => setTheme("dark")}
              label="Dark theme"
            >
              <Moon className="size-3.5" />
            </ThemeButton>
            <ThemeButton
              active={mounted && resolvedTheme === "light"}
              onClick={() => setTheme("light")}
              label="Light theme"
            >
              <Sun className="size-3.5" />
            </ThemeButton>
          </div>
          <button
            onClick={startTrading}
            className="rounded-full bg-white px-5 py-2.5 text-[13px] font-semibold text-black transition-transform hover:scale-[1.03] active:translate-y-px"
          >
            Start Trading
          </button>
        </div>
      </nav>
    </header>
  );
}

function ThemeButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex size-7 items-center justify-center rounded-full transition-colors",
        active ? "bg-white/10 text-white" : "text-bq-muted hover:text-white",
      )}
    >
      {children}
    </button>
  );
}
