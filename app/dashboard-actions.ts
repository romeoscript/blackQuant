"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { verificationStage, type VerificationStage } from "@/lib/account-status";
import {
  activityDays,
  DEFAULT_ACTIVITY_RANGE,
  type ActivityDay,
  type ActivityRange,
} from "@/lib/dashboard";
import { getLatestSubmission } from "@/app/kyc-actions";

/**
 * Deliberately no balance here. `getBalanceUsd` is the one reader for that
 * number and every screen shares its cache entry — two actions returning the
 * same balance is two things that can disagree.
 */
export type ControlCenterSummary = {
  /** Everything ever credited, so the balance has something to be read against. */
  totalDepositedUsd: string;
  /** Deposits seen on chain but not yet credited. */
  pending: { count: number; label: string | null };
  depositCount: number;
  verification: VerificationStage;
  twoFactorEnabled: boolean;
  activity: ActivityDay[];
  activityTotalUsd: string;
};

const EMPTY: ControlCenterSummary = {
  totalDepositedUsd: "0.00",
  pending: { count: 0, label: null },
  depositCount: 0,
  verification: "unverified",
  twoFactorEnabled: false,
  activity: [],
  activityTotalUsd: "0.00",
};

const dayKey = (date: Date) => date.toISOString().slice(0, 10);

/**
 * Everything the Control Center renders, in one round trip.
 *
 * Deliberately one action rather than five: the screen is a single view of an
 * account, and five independent queries would let its cards disagree with each
 * other for a moment after a deposit lands.
 */
export async function getControlCenterSummary(
  range: ActivityRange = DEFAULT_ACTIVITY_RANGE,
): Promise<ControlCenterSummary> {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!Number.isInteger(userId)) return EMPTY;

  // The range crosses from the client, so it is resolved through the allow-list
  // rather than indexed with directly.
  const days = activityDays(range);
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - (days - 1));
  since.setUTCHours(0, 0, 0, 0);

  const [user, deposited, pending, depositCount, entries, submission] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { twoFactorEnabledAt: true },
      }),
      prisma.ledgerEntry.aggregate({
        where: { userId, kind: "deposit" },
        _sum: { amountUsd: true },
      }),
      prisma.depositEvent.findMany({
        where: { userId, status: { in: ["WAITING", "CONFIRMING"] } },
        select: { currency: true },
      }),
      prisma.depositEvent.count({ where: { userId, status: "CONFIRMED" } }),
      prisma.ledgerEntry.findMany({
        where: { userId, createdAt: { gte: since } },
        select: { amountUsd: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      getLatestSubmission(),
    ]);

  if (!user) return EMPTY;

  // Every day in the window, including the empty ones: a chart that omits them
  // would compress a quiet fortnight into a busy-looking week.
  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const day = new Date(since);
    day.setUTCDate(day.getUTCDate() + i);
    buckets.set(dayKey(day), 0);
  }
  for (const entry of entries) {
    const key = dayKey(entry.createdAt);
    if (buckets.has(key)) {
      buckets.set(key, buckets.get(key)! + entry.amountUsd.toNumber());
    }
  }

  const activity = [...buckets].map(([date, netUsd]) => ({ date, netUsd }));

  return {
    totalDepositedUsd: (deposited._sum.amountUsd ?? 0).toFixed(2),
    pending: {
      count: pending.length,
      label:
        pending.length === 0
          ? null
          : [...new Set(pending.map((p) => p.currency.toUpperCase()))].join(", "),
    },
    depositCount,
    verification: verificationStage(submission),
    twoFactorEnabled: user.twoFactorEnabledAt !== null,
    activity,
    activityTotalUsd: activity
      .reduce((total, day) => total + day.netUsd, 0)
      .toFixed(2),
  };
}
