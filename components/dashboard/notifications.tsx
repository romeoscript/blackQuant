"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CircleAlert, PartyPopper, Info, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
} from "@/app/notification-actions";

const QUERY_KEY = ["notifications"];
/** Past this the badge stops counting and says so. */
const BADGE_CAP = 9;

const KIND_STYLES: Record<Notification["kind"], { icon: LucideIcon; tone: string }> = {
  WELCOME: { icon: PartyPopper, tone: "text-bq-mint" },
  SECURITY: { icon: CircleAlert, tone: "text-bq-loss-text" },
  SYSTEM: { icon: Info, tone: "text-bq-muted" },
};

export function Notifications() {
  const queryClient = useQueryClient();
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => listNotifications(),
  });

  const notifications = data ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  const readOne = useMutation({ mutationFn: markNotificationRead, onSuccess: invalidate });
  const readAll = useMutation({ mutationFn: markAllNotificationsRead, onSuccess: invalidate });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={
            unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"
          }
          className="relative rounded-lg border border-bq-border p-2 text-bq-muted transition-colors hover:text-bq-heading"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-bq-mint px-1 font-plex text-[9px] font-bold text-bq-on-fill">
              {unreadCount > BADGE_CAP ? `${BADGE_CAP}+` : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[min(360px,calc(100vw-2rem))] border-bq-border bg-bq-card p-0 font-satoshi"
      >
        <div className="flex items-center justify-between border-b border-bq-border px-4 py-3">
          <p className="text-[13px] font-bold text-bq-heading">Notifications</p>
          {unreadCount > 0 && (
            <button
              onClick={() => readAll.mutate()}
              disabled={readAll.isPending}
              className="text-[11px] font-medium text-bq-mint transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-[min(420px,60vh)] overflow-y-auto" data-lenis-prevent>
          {isPending && <PanelMessage icon={Loader2} spin>Loading…</PanelMessage>}

          {isError && (
            <PanelMessage icon={CircleAlert}>
              Couldn&apos;t load notifications.{" "}
              <button onClick={() => refetch()} className="text-bq-mint hover:underline">
                Retry
              </button>
            </PanelMessage>
          )}

          {!isPending && !isError && notifications.length === 0 && (
            <PanelMessage icon={Bell}>You&apos;re all caught up.</PanelMessage>
          )}

          {notifications.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onRead={() => readOne.mutate(notification.id)}
            />
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationRow({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: () => void;
}) {
  const { icon: Icon, tone } = KIND_STYLES[notification.kind];

  return (
    <button
      onClick={onRead}
      disabled={notification.isRead}
      className={cn(
        "flex w-full gap-3 border-b border-bq-border-soft px-4 py-3 text-left last:border-b-0",
        notification.isRead
          ? "opacity-60"
          : "bg-bq-overlay/[0.03] transition-colors hover:bg-bq-overlay/[0.06]",
      )}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", tone)} />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-bq-heading">{notification.title}</p>
        <p className="mt-0.5 text-[12px] leading-[1.5] text-bq-muted">{notification.body}</p>
        <p className="mt-1 font-plex text-[10px] text-bq-dim">
          {relativeTime(notification.createdAt)}
        </p>
      </div>
      {!notification.isRead && (
        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-bq-mint" />
      )}
    </button>
  );
}

function PanelMessage({
  icon: Icon,
  spin,
  children,
}: {
  icon: LucideIcon;
  spin?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <Icon className={cn("size-5 text-bq-dim", spin && "animate-spin")} />
      <p className="text-[12px] text-bq-muted">{children}</p>
    </div>
  );
}

const MINUTE = 60_000;
const UNITS: [limit: number, ms: number, label: Intl.RelativeTimeFormatUnit][] = [
  [60 * MINUTE, MINUTE, "minute"],
  [24 * 60 * MINUTE, 60 * MINUTE, "hour"],
  [7 * 24 * 60 * MINUTE, 24 * 60 * MINUTE, "day"],
  [Number.POSITIVE_INFINITY, 7 * 24 * 60 * MINUTE, "week"],
];

const relativeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function relativeTime(iso: string): string {
  const elapsed = Date.now() - new Date(iso).getTime();
  if (elapsed < MINUTE) return "just now";

  const [, ms, unit] = UNITS.find(([limit]) => elapsed < limit) ?? UNITS[UNITS.length - 1];
  return relativeFormatter.format(-Math.round(elapsed / ms), unit);
}
