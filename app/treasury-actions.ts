"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { assetByCurrency } from "@/lib/deposit";
import {
  balanceRangeDays,
  bucketsByMonth,
  DEFAULT_BALANCE_RANGE,
  type AssetDeposits,
  type BalancePoint,
  type BalanceRange,
} from "@/lib/treasury";

export type TreasurySummary = {
  balanceUsd: string;
  totalDepositedUsd: string;
  totalWithdrawnUsd: string;
  pendingCount: number;
  byAsset: AssetDeposits[];
  history: BalancePoint[];
};

const EMPTY: TreasurySummary = {
  balanceUsd: "0.00",
  totalDepositedUsd: "0.00",
  totalWithdrawnUsd: "0.00",
  pendingCount: 0,
  byAsset: [],
  history: [],
};

const monthLabel = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  timeZone: "UTC",
});
const dayLabel = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});

/**
 * Start of each bucket in the window, oldest first, as UTC instants.
 *
 * Buckets are built forwards from the window start rather than by subtracting
 * months from today, so a run on the 31st cannot produce a short February and
 * a duplicate March.
 */
function bucketStarts(days: number): Date[] {
  const byMonth = bucketsByMonth(days);
  const starts: Date[] = [];

  if (byMonth) {
    const months = Math.round(days / 30.4);
    const first = new Date();
    first.setUTCDate(1);
    first.setUTCHours(0, 0, 0, 0);
    first.setUTCMonth(first.getUTCMonth() - (months - 1));

    for (let i = 0; i < months; i++) {
      const start = new Date(first);
      start.setUTCMonth(first.getUTCMonth() + i);
      starts.push(start);
    }
    return starts;
  }

  const first = new Date();
  first.setUTCHours(0, 0, 0, 0);
  first.setUTCDate(first.getUTCDate() - (days - 1));

  for (let i = 0; i < days; i++) {
    const start = new Date(first);
    start.setUTCDate(first.getUTCDate() + i);
    starts.push(start);
  }
  return starts;
}

/**
 * The treasury screen in one round trip.
 *
 * This is the user's dollar balance and where it came from. It is deliberately
 * not a portfolio: deposits are converted on arrival and credited as dollars,
 * so the account holds no crypto to value, and nothing here needs a price feed.
 */
export async function getTreasurySummary(
  range: BalanceRange = DEFAULT_BALANCE_RANGE,
): Promise<TreasurySummary> {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!Number.isInteger(userId)) return EMPTY;

  const buckets = bucketStarts(balanceRangeDays(range));
  const windowStart = buckets[0];

  const [user, deposited, withdrawn, pendingCount, deposits, opening, entries] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { balanceUsd: true },
      }),
      prisma.ledgerEntry.aggregate({
        where: { userId, kind: "deposit" },
        _sum: { amountUsd: true },
      }),
      prisma.ledgerEntry.aggregate({
        where: { userId, kind: "withdrawal" },
        _sum: { amountUsd: true },
      }),
      prisma.depositEvent.count({
        where: { userId, status: { in: ["WAITING", "CONFIRMING"] } },
      }),
      prisma.depositEvent.groupBy({
        by: ["currency"],
        where: { userId, status: "CONFIRMED" },
        _sum: { payAmount: true, usdCredited: true },
      }),
      // The balance the window opens at, as one sum rather than by replaying
      // every entry the account has ever had.
      prisma.ledgerEntry.aggregate({
        where: { userId, createdAt: { lt: windowStart } },
        _sum: { amountUsd: true },
      }),
      prisma.ledgerEntry.findMany({
        where: { userId, createdAt: { gte: windowStart } },
        select: { amountUsd: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

  if (!user) return EMPTY;

  const totalCredited = deposits.reduce(
    (total, row) => total + (row._sum.usdCredited?.toNumber() ?? 0),
    0,
  );

  const byAsset: AssetDeposits[] = deposits
    .map((row) => {
      const asset = assetByCurrency(row.currency);
      const usdCredited = row._sum.usdCredited?.toNumber() ?? 0;
      return {
        symbol: asset?.symbol ?? row.currency.toUpperCase(),
        name: asset?.name ?? row.currency,
        color: asset?.color ?? "#8b93a7",
        amount: (row._sum.payAmount ?? 0).toString(),
        usdCredited: usdCredited.toFixed(2),
        share: totalCredited === 0 ? 0 : Math.round((usdCredited / totalCredited) * 100),
      };
    })
    .sort((a, b) => Number(b.usdCredited) - Number(a.usdCredited));

  // Each point closes at the bucket's end, so the line reads as "what the
  // balance was", not "what moved".
  const byMonth = bucketsByMonth(balanceRangeDays(range));
  let running = opening._sum.amountUsd?.toNumber() ?? 0;
  let cursor = 0;

  const history = buckets.map((start, index) => {
    const end = buckets[index + 1] ?? new Date(8.64e15);
    while (cursor < entries.length && entries[cursor].createdAt < end) {
      running += entries[cursor].amountUsd.toNumber();
      cursor++;
    }
    return {
      label: (byMonth ? monthLabel : dayLabel).format(start),
      balanceUsd: Number(running.toFixed(2)),
    };
  });

  return {
    balanceUsd: user.balanceUsd.toFixed(2),
    totalDepositedUsd: (deposited._sum.amountUsd ?? 0).toFixed(2),
    // Withdrawals are stored as negative entries; the total reads positive.
    totalWithdrawnUsd: Math.abs(withdrawn._sum.amountUsd?.toNumber() ?? 0).toFixed(2),
    pendingCount,
    byAsset,
    history,
  };
}
