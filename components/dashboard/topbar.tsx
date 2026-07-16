"use client";

import { Bell, Menu, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { ThemeSwitcher } from "./theme-switcher";
import { SidebarBrand } from "./sidebar";

export function DashboardTopbar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-bq-border bg-bq-bg/85 px-4 py-3 backdrop-blur md:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-md p-1.5 text-bq-text hover:bg-white/5 md:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>

      <div className="md:hidden">
        <SidebarBrand />
      </div>

      <span className="hidden font-plex text-[11px] tracking-[1px] text-bq-dim md:inline">
        UID: 12532723525
      </span>

      <div className="ml-auto flex items-center gap-2 md:gap-3">
        <ThemeSwitcher className="hidden lg:flex" />
        <button
          onClick={() => toast("Refreshed", { description: "Account data is up to date." })}
          className="hidden rounded-lg border border-bq-border p-2 text-bq-muted transition-colors hover:text-white md:inline-flex"
          aria-label="Refresh"
        >
          <RotateCw className="size-4" />
        </button>
        <button
          onClick={() => toast("Notifications", { description: "You're all caught up." })}
          className="rounded-lg border border-bq-border p-2 text-bq-muted transition-colors hover:text-white"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
        </button>
        <button
          onClick={() => toast("Account", { description: "Profile menu isn't wired up in the demo yet." })}
          className="flex items-center gap-2 rounded-full border border-bq-border py-1 pl-1 pr-1 transition-colors hover:bg-white/5 sm:pr-2.5"
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-primary/20 text-[11px] font-bold text-primary">
            YN
          </span>
          <span className="hidden text-[13px] text-bq-text sm:inline">YourNoCodeDev</span>
        </button>
      </div>
    </header>
  );
}
