"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useLenis } from "lenis/react";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/logo";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NAV_LINKS } from "./data";

export function Nav() {
  const lenis = useLenis();
  const { resolvedTheme, setTheme } = useTheme();
  // next-themes resolves the theme from its pre-hydration script, so
  // `resolvedTheme` is already set on the client's first render while the
  // server rendered neither button active. Gating on mount keeps that first
  // render identical to the server's; without it React reports a mismatch on
  // the toggle's className.
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pendingTarget = useRef<string | null>(null);
  useEffect(() => setMounted(true), []);

  const goTo = (target: string) =>
    lenis?.scrollTo(`#${target}`, { offset: -80 });

  // Radix holds the body scroll-locked while the drawer is mounted, so the jump
  // is deferred to `onCloseAutoFocus` — the point at which the drawer has closed
  // and the lock is released.
  const closeThenGoTo = (target: string) => {
    pendingTarget.current = target;
    setMenuOpen(false);
  };

  const runPendingScroll = () => {
    const target = pendingTarget.current;
    if (!target) return;
    pendingTarget.current = null;
    goTo(target);
  };

  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <nav className="mx-auto flex h-[87px] max-w-[1440px] items-center justify-between px-6 md:px-16">
        <button
          onClick={() => lenis?.scrollTo(0)}
          className="flex items-center gap-3"
          aria-label="BlackQuant home"
        >
          <LogoMark />
          <span className="text-xl font-bold tracking-tight text-bq-heading">
            BlackQuant
          </span>
        </button>

        <ul className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.target}>
              <button
                onClick={() => goTo(link.target)}
                className="text-[13px] text-bq-text/70 transition-colors hover:text-bq-heading"
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-4 lg:flex">
          <ThemeToggle
            mounted={mounted}
            resolvedTheme={resolvedTheme}
            setTheme={setTheme}
          />
          <Link
            href="/login"
            className="text-[13px] text-bq-text/70 transition-colors hover:text-bq-heading"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full bg-bq-contrast px-5 py-2.5 text-[13px] font-semibold text-bq-on-fill transition-transform hover:scale-[1.03] active:translate-y-px"
          >
            Start Trading
          </Link>
        </div>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button
              aria-label="Open menu"
              className="-mr-2 flex size-10 items-center justify-center rounded-lg text-bq-heading transition-colors hover:bg-bq-overlay/5 lg:hidden"
            >
              <Menu className="size-5" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="right"
            onCloseAutoFocus={runPendingScroll}
            className="w-[300px] gap-0 border-bq-border bg-bq-panel p-0 font-satoshi text-bq-text sm:max-w-none"
          >
            <SheetHeader className="border-b border-bq-border px-5 py-[18px]">
              <SheetTitle className="flex items-center gap-2.5 font-satoshi text-bq-heading">
                <LogoMark className="size-7" />
                <span className="text-base font-bold tracking-tight">BlackQuant</span>
              </SheetTitle>
            </SheetHeader>

            <nav className="flex flex-col gap-0.5 p-3">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.target}
                  onClick={() => closeThenGoTo(link.target)}
                  className="rounded-lg px-3 py-3 text-left text-[15px] text-bq-text transition-colors hover:bg-bq-overlay/5 hover:text-bq-heading"
                >
                  {link.label}
                </button>
              ))}
            </nav>

            <SheetFooter className="gap-4 border-t border-bq-border px-5 py-5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-bq-muted">Theme</span>
                <ThemeToggle
                  mounted={mounted}
                  resolvedTheme={resolvedTheme}
                  setTheme={setTheme}
                />
              </div>
              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="rounded-full bg-bq-contrast py-3 text-center text-[13px] font-semibold text-bq-on-fill"
              >
                Start Trading
              </Link>
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="text-center text-[13px] text-bq-text/70 transition-colors hover:text-bq-heading"
              >
                Sign In
              </Link>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}

function ThemeToggle({
  mounted,
  resolvedTheme,
  setTheme,
}: {
  mounted: boolean;
  resolvedTheme?: string;
  setTheme: (theme: string) => void;
}) {
  return (
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
        active ? "bg-bq-overlay/10 text-bq-heading" : "text-bq-muted hover:text-bq-heading",
      )}
    >
      {children}
    </button>
  );
}
