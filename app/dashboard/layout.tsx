"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { DashboardSidebar, SidebarBrand } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { ThemeSwitcher } from "@/components/dashboard/theme-switcher";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bq-bg font-satoshi text-bq-text">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-bq-border bg-bq-panel md:flex">
        <div className="px-5 py-5">
          <SidebarBrand />
        </div>
        <div className="flex-1 overflow-y-auto">
          <DashboardSidebar />
        </div>
      </aside>

      {/* mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[332px] max-w-[88%] flex-col overflow-y-auto border-r border-bq-border bg-bq-card">
            <div className="flex items-center justify-between border-b border-bq-border px-4 py-4">
              <SidebarBrand />
              <button
                onClick={() => setOpen(false)}
                className="flex size-8 items-center justify-center rounded-xl bg-bq-surface text-bq-muted transition-colors hover:text-white"
                aria-label="Close menu"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex items-center gap-2.5 border-b border-bq-border px-4 py-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[13px] font-bold text-primary">
                YN
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold text-white">YourNoCodeDev</p>
                <p className="font-plex text-[11px] text-bq-dim">UID: 12532723525</p>
              </div>
            </div>

            <div className="border-b border-bq-border px-4 py-3">
              <ThemeSwitcher full />
            </div>

            <DashboardSidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="md:pl-64">
        <DashboardTopbar onMenuClick={() => setOpen(true)} />
        <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
