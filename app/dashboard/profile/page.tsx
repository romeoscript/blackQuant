import Link from "next/link";
import {
  MapPin,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Bell,
  type LucideIcon,
} from "lucide-react";
import type { NotificationKind } from "@prisma/client";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { Card, StatPill, HeaderActions } from "@/components/dashboard/widgets";
import { PersonalInfo } from "@/components/dashboard/profile/personal-info";
import { DangerZone } from "@/components/dashboard/profile/danger-zone";
import { getProfile } from "@/app/profile-actions";
import { listNotifications } from "@/app/notification-actions";
import { userIdentity } from "@/lib/user-display";

const ACTIVITY_ICONS: Record<NotificationKind, LucideIcon> = {
  WELCOME: Calendar,
  SECURITY: ShieldCheck,
  SYSTEM: Bell,
};

const monthYear = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  year: "numeric",
});
const dayMonth = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

export default async function ProfilePage() {
  const [profile, activity] = await Promise.all([
    getProfile(),
    listNotifications(),
  ]);

  if (!profile) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="My Profile" actions={<HeaderActions />} />
        <Card>
          <p className="text-[13px] text-bq-muted">
            We couldn&apos;t load your profile. Try signing in again.
          </p>
        </Card>
      </div>
    );
  }

  const { displayName, initials } = userIdentity(profile);

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="My Profile" actions={<HeaderActions />} />

      <Card>
        <div className="flex flex-wrap items-center gap-5">
          <div className="relative">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/20 text-xl font-bold text-primary">
              {initials}
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full border-2 border-bq-surface bg-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-bq-heading">{displayName}</h2>
            <p className="text-[13px] text-bq-muted">{profile.email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-bq-dim">
              {profile.country && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" /> {profile.country}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="size-3.5" /> Member since{" "}
                {monthYear.format(new Date(profile.memberSince))}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <PersonalInfo profile={profile} />

        <div className="space-y-6">
          <Card>
            <h2 className="font-semibold text-bq-heading">Security</h2>
            <div className="mt-4 space-y-2">
              <Link
                href="/dashboard/2fa"
                className="flex items-center gap-3 rounded-lg border border-bq-border px-3 py-3 transition-colors hover:bg-bq-overlay/5"
              >
                <ShieldAlert className="size-4 shrink-0 text-bq-warn-text" />
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-bq-heading">
                    Auth Guard (2FA)
                  </p>
                  <p className="text-[11px] text-bq-dim">
                    Not configured. Your account has one factor
                  </p>
                </div>
                <StatPill tone="amber">Set up</StatPill>
              </Link>

              <div className="flex items-center gap-3 rounded-lg border border-bq-border px-3 py-3">
                <Lock className="size-4 shrink-0 text-bq-muted" />
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-bq-heading">Password</p>
                  <p className="text-[11px] text-bq-dim">
                    {profile.passwordChangedAt
                      ? `Last changed ${daysSince(profile.passwordChangedAt)} days ago`
                      : "Never changed since signup"}
                  </p>
                </div>
                <Link
                  href="/dashboard/reset"
                  className="text-[12px] font-medium text-bq-text hover:text-bq-heading"
                >
                  Change
                </Link>
              </div>
            </div>
          </Card>

          <DangerZone />
        </div>
      </div>

      <Card>
        <div>
          <h2 className="font-semibold text-bq-heading">Recent Activity</h2>
          <p className="text-[12px] text-bq-dim">Your latest account events</p>
        </div>
        {activity.length === 0 ? (
          <p className="mt-4 text-[13px] text-bq-muted">
            Nothing yet. Account events will appear here as you use BlackQuant.
          </p>
        ) : (
          <ul className="mt-3">
            {activity.map((item) => {
              const Icon = ACTIVITY_ICONS[item.kind];
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-3 border-b border-bq-border-soft py-3 last:border-0"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-bq-bg text-bq-muted">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-bq-heading">
                      {item.title}
                    </p>
                    <p className="truncate text-[11px] text-bq-dim">{item.body}</p>
                  </div>
                  <span className="shrink-0 font-plex text-[11px] text-bq-dim">
                    {dayMonth.format(new Date(item.createdAt))}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
