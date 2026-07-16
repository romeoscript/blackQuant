"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Wallet,
  CirclePlus,
  Activity,
  Layers,
  CircleArrowDown,
  Users,
  Cpu,
  BookOpen,
  User,
  Shield,
  KeyRound,
  BadgeCheck,
  Headset,
  LogOut,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = {
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: { text: string; tone: "live" | "danger" };
  chevron?: boolean;
  danger?: boolean;
};
type Section = { title: string; items: Item[] };

const SECTIONS: Section[] = [
  {
    title: "Main",
    items: [{ label: "Control Center", icon: LayoutGrid, href: "/dashboard" }],
  },
  {
    title: "Apps",
    items: [
      { label: "Treasury", icon: Wallet, href: "/dashboard/treasury", chevron: true },
      { label: "Fund Account", icon: CirclePlus, href: "/dashboard/fund", chevron: true },
      { label: "Signal Plan", icon: Activity, href: "/dashboard/signal-plan", chevron: true },
      { label: "Positions", icon: Layers, href: "/dashboard/positions", chevron: true },
      { label: "Withdrawals", icon: CircleArrowDown, href: "/dashboard/withdrawals", chevron: true },
      { label: "Referral Hub", icon: Users, href: "/dashboard/referrals", chevron: true },
      { label: "Signal Engine", icon: Cpu, href: "/dashboard/signal-engine", badge: { text: "Live", tone: "live" } },
      { label: "Knowledge Base", icon: BookOpen, href: "/dashboard/knowledge" },
    ],
  },
  {
    title: "Personal",
    items: [
      { label: "My Profile", icon: User, href: "/dashboard/profile" },
      { label: "2FA / Auth Guard", icon: Shield, href: "/dashboard/2fa", badge: { text: "Unconfigured", tone: "danger" } },
      { label: "Reset Credentials", icon: KeyRound, href: "/dashboard/reset" },
      { label: "Verification", icon: BadgeCheck, href: "/dashboard/verification", badge: { text: "Unverified", tone: "danger" } },
    ],
  },
  {
    title: "Others",
    items: [
      { label: "Help Desk", icon: Headset, href: "/dashboard/help" },
      { label: "Sign Out", icon: LogOut, href: "/login", danger: true },
    ],
  },
];

function NavBadge({ text, tone }: NonNullable<Item["badge"]>) {
  return (
    <span
      className={cn(
        "ml-auto shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold",
        tone === "live"
          ? "bg-bq-mint/15 text-bq-mint"
          : "bg-[#ff3b5c]/15 text-[#ff6a83]",
      )}
    >
      {text}
    </span>
  );
}

export function DashboardSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-6 px-3 pb-6">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="px-2 pb-2 font-plex text-[10px] uppercase tracking-[1.5px] text-bq-dim">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-colors",
                        active
                          ? "bg-bq-surface text-white"
                          : item.danger
                            ? "text-[#ff6a83] hover:bg-[#ff3b5c]/10"
                            : "text-bq-muted hover:bg-white/[0.03] hover:text-bq-text",
                      )}
                    >
                      <item.icon className="size-4 shrink-0" strokeWidth={1.8} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && <NavBadge {...item.badge} />}
                      {!item.badge && item.chevron && (
                        <ChevronRight className="size-3.5 shrink-0 text-bq-dim" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
    </nav>
  );
}

export function SidebarBrand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-8 items-center justify-center rounded-lg bg-white text-[15px] font-bold text-black">
        B
      </span>
      <span className="text-[18px] font-bold tracking-tight text-white">BlackQuant</span>
    </div>
  );
}
