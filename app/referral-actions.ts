"use server";

import prisma from "@/lib/prisma";
import { currentUserId } from "@/lib/session";
import { env } from "@/lib/env";
import { userIdentity } from "@/lib/user-display";
import {
  EARNINGS_MONTHS,
  REFERRAL_TIERS,
  ensureReferralCode,
  monthStarts,
  ratePercent,
  referralLink,
  type EarningsPoint,
} from "@/lib/referral";

/** One referred account, as the downline table shows it. */
export type DownlineRow = {
  id: number;
  name: string;
  initials: string;
  joinedAt: string;
  /** Holds a live plan or add-on. What the programme means by "active". */
  active: boolean;
  earnedUsd: string;
};

export type ReferralSummary = {
  code: string;
  link: string;
  tiers: { label: string; rate: string }[];
  totalReferrals: number;
  activeReferrals: number;
  totalEarnedUsd: string;
  last30DaysUsd: string;
  earnings: EarningsPoint[];
  downline: DownlineRow[];
  /** Referrals beyond the rows returned, so the table can say so honestly. */
  hiddenCount: number;
};

/** How many downline rows the table shows before it would need paging. */
const DOWNLINE_LIMIT = 100;

const monthLabel = new Intl.DateTimeFormat("en-GB", {
  month: "narrow",
  timeZone: "UTC",
});

/**
 * The Referral Hub in one round trip.
 *
 * Every figure here is derived from `ReferralCommission` rather than kept as a
 * running total on the account: a cached total that disagrees with the rows
 * explaining it is the one failure this screen cannot recover from, and the
 * rows are the thing a user will dispute.
 */
export async function getReferralSummary(): Promise<ReferralSummary | null> {
  const userId = await currentUserId();
  if (userId === null) return null;

  try {
    return await summarise(userId);
  } catch (error) {
    // Returned rather than rethrown, for the same reason the treasury does it:
    // a thrown server action still answers 200, so the caller cannot tell
    // "earned nothing" from "we could not read your earnings".
    console.error("[referral:summary]", error);
    return null;
  }
}

async function summarise(userId: number): Promise<ReferralSummary> {
  const code = await ensureReferralCode(userId);
  const buckets = monthStarts(EARNINGS_MONTHS);
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000);

  const [referrals, totalReferrals, earnedTotal, recent, commissions, perReferral] =
    await Promise.all([
      prisma.user.findMany({
        where: { referredById: userId },
        select: { id: true, name: true, email: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: DOWNLINE_LIMIT,
      }),
      prisma.user.count({ where: { referredById: userId } }),
      prisma.referralCommission.aggregate({
        where: { earnerId: userId },
        _sum: { amountUsd: true },
      }),
      prisma.referralCommission.aggregate({
        where: { earnerId: userId, createdAt: { gte: thirtyDaysAgo } },
        _sum: { amountUsd: true },
      }),
      // Only what the chart window covers; the all-time total above is its own
      // aggregate rather than a sum of these.
      prisma.referralCommission.findMany({
        where: { earnerId: userId, createdAt: { gte: buckets[0] } },
        select: { amountUsd: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      // Tier 2 earnings come from a purchase made by someone this account did
      // not refer directly, so this is grouped and then matched to the rows
      // rather than joined onto them.
      prisma.referralCommission.groupBy({
        by: ["sourceUserId"],
        where: { earnerId: userId },
        _sum: { amountUsd: true },
      }),
    ]);

  const referralIds = referrals.map((referral) => referral.id);

  // One query for who is active, rather than one per row. "Active" is the same
  // predicate the store uses for an entitlement: a live subscription, or an
  // add-on, which never lapses.
  const activeHolders = referralIds.length
    ? await prisma.purchase.findMany({
        where: {
          userId: { in: referralIds },
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        select: { userId: true },
        distinct: ["userId"],
      })
    : [];
  const active = new Set(activeHolders.map((purchase) => purchase.userId));

  const earnedBySource = new Map(
    perReferral.map((row) => [
      row.sourceUserId,
      row._sum.amountUsd?.toFixed(2) ?? "0.00",
    ]),
  );

  let cursor = 0;
  const earnings = buckets.map((start, index) => {
    const end = buckets[index + 1] ?? new Date(8.64e15);
    let total = 0;
    while (cursor < commissions.length && commissions[cursor].createdAt < end) {
      total += commissions[cursor].amountUsd.toNumber();
      cursor++;
    }
    return { label: monthLabel.format(start), value: Number(total.toFixed(2)) };
  });

  const origin = env.AUTH_URL ?? "http://localhost:3000";

  return {
    code,
    link: referralLink(code, origin),
    tiers: REFERRAL_TIERS.map((tier) => ({
      label: tier.label,
      rate: ratePercent(tier.rateBps),
    })),
    totalReferrals,
    activeReferrals: active.size,
    totalEarnedUsd: (earnedTotal._sum.amountUsd ?? 0).toFixed(2),
    last30DaysUsd: (recent._sum.amountUsd ?? 0).toFixed(2),
    earnings,
    downline: referrals.map((referral) => {
      // A name, not an address. The identity helper falls back to the email's
      // local part when an account has none — the least it can show, and no
      // more than someone who invited that person already knows.
      const identity = userIdentity({
        name: referral.name,
        email: referral.email,
      });
      return {
        id: referral.id,
        name: identity.displayName,
        initials: identity.initials,
        joinedAt: referral.createdAt.toISOString(),
        active: active.has(referral.id),
        earnedUsd: earnedBySource.get(referral.id) ?? "0.00",
      };
    }),
    hiddenCount: Math.max(0, totalReferrals - referrals.length),
  };
}
