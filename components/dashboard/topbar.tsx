"use client";

import { Menu, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { userIdentity } from "@/lib/user-display";
import { ThemeSwitcher } from "./theme-switcher";
import { SidebarBrand } from "./sidebar";
import { Notifications } from "./notifications";

export function DashboardTopbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user } = useUser();
  const { displayName, initials, uid } = userIdentity(user);
  const queryClient = useQueryClient();

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-bq-border bg-bq-bg/85 px-4 py-3 backdrop-blur md:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-md p-1.5 text-bq-text hover:bg-bq-overlay/5 md:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>

      <div className="md:hidden">
        <SidebarBrand />
      </div>

      {uid && (
        <span className="hidden font-plex text-[11px] tracking-[1px] text-bq-dim md:inline">
          UID: {uid}
        </span>
      )}

      <div className="ml-auto flex items-center gap-2 md:gap-3">
        <ThemeSwitcher className="hidden lg:flex" />
        <button
          onClick={() => {
            // Drops every cached query so the next render refetches; today that
            // is the notifications panel.
            queryClient.invalidateQueries();
            toast("Refreshed", { description: "Account data is up to date." });
          }}
          className="hidden rounded-lg border border-bq-border p-2 text-bq-muted transition-colors hover:text-bq-heading md:inline-flex"
          aria-label="Refresh"
        >
          <RotateCw className="size-4" />
        </button>
        <Notifications />
        <button
          onClick={() => toast("Account", { description: "Profile menu isn't wired up in the demo yet." })}
          className="flex items-center gap-2 rounded-full border border-bq-border py-1 pl-1 pr-1 transition-colors hover:bg-bq-overlay/5 sm:pr-2.5"
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-primary/20 text-[11px] font-bold text-primary">
            {initials}
          </span>
          <span className="hidden max-w-[140px] truncate text-[13px] text-bq-text sm:inline">
            {displayName}
          </span>
        </button>
      </div>
    </header>
  );
}
