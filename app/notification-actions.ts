"use server";

import type { NotificationKind } from "@prisma/client";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export type Notification = {
  id: number;
  kind: NotificationKind;
  title: string;
  body: string;
  /** ISO string — server actions cannot return a Date to a client component. */
  createdAt: string;
  isRead: boolean;
};

/** Enough to fill the panel; it is not a paginated inbox. */
const PANEL_LIMIT = 20;

/**
 * The signed-in user's id, or null. Every query below scopes on this rather
 * than on anything the caller passes, so one account can never address
 * another's notifications.
 */
async function currentUserId(): Promise<number | null> {
  const session = await auth();
  const id = Number(session?.user?.id);
  return Number.isInteger(id) ? id : null;
}

export async function listNotifications(): Promise<Notification[]> {
  const userId = await currentUserId();
  if (!userId) return [];

  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: PANEL_LIMIT,
    select: {
      id: true,
      kind: true,
      title: true,
      body: true,
      createdAt: true,
      readAt: true,
    },
  });

  return rows.map(({ readAt, createdAt, ...rest }) => ({
    ...rest,
    createdAt: createdAt.toISOString(),
    isRead: readAt !== null,
  }));
}

/** Marks one notification read. Silently no-ops if it belongs to someone else. */
export async function markNotificationRead(id: number): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;

  // updateMany, not update: the userId in the filter is what stops one account
  // marking another's row, and update-by-id alone could not express that.
  await prisma.notification.updateMany({
    where: { id, userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function markAllNotificationsRead(): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;

  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
