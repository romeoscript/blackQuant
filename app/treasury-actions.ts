"use server";

import type { DepositStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { currentUserId } from "@/lib/session";
import { assetByCurrency } from "@/lib/deposit";
import { storeItem } from "@/lib/store";
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
): Promise<TreasurySummary | null> {
  const userId = await currentUserId();
  if (userId === null) return null;

  try {
    return await summarise(userId, range);
  } catch (error) {
    // Returned rather than rethrown: a server action that throws still answers
    // 200, so the caller sees a resolved promise and cannot tell failure from
    // an account with nothing in it. Null is the difference between "no money"
    // and "we could not read your money".
    console.error("[treasury:summary]", error);
    return null;
  }
}

async function summarise(
  userId: number,
  range: BalanceRange,
): Promise<TreasurySummary> {

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

  if (!user) throw new Error(`no such user: ${userId}`);

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

/**
 * Every movement of money on the account, newest first.
 *
 * A discriminated union rather than one wide row: a deposit carries a chain
 * status and a confirmation count that a purchase has no meaning for, and a
 * type with both would let a caller read a confirmation count off a
 * subscription.
 */
export type TransactionView =
  | {
      type: "deposit";
      id: string;
      createdAt: string;
      symbol: string;
      color: string;
      payAmount: string;
      usdCredited: string;
      status: DepositStatus;
      confirmations: number;
      requiredConfirmations: number;
    }
  | {
      type: "spend";
      id: string;
      createdAt: string;
      /** "purchase" | "withdrawal" | "adjustment". */
      kind: string;
      title: string;
      amountUsd: string;
    };

/** How many movements the treasury screen shows before paging would be needed. */
const TRANSACTION_LIMIT = 25;

export async function listTransactions(): Promise<TransactionView[] | null> {
  const userId = await currentUserId();
  if (userId === null) return null;

  try {
    // Deposits come from their own record rather than the ledger: an uncredited
    // one has no ledger entry yet, and dropping it would hide the deposit
    // someone is watching confirm.
    const [deposits, spends] = await Promise.all([
      prisma.depositEvent.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: TRANSACTION_LIMIT,
        select: {
          id: true,
          currency: true,
          payAmount: true,
          usdCredited: true,
          status: true,
          confirmations: true,
          createdAt: true,
        },
      }),
      prisma.ledgerEntry.findMany({
        where: { userId, kind: { not: "deposit" } },
        orderBy: { createdAt: "desc" },
        take: TRANSACTION_LIMIT,
        select: { id: true, kind: true, amountUsd: true, refId: true, createdAt: true },
      }),
    ]);

    // One query for the names rather than one per row.
    const purchases = await prisma.purchase.findMany({
      where: {
        id: { in: spends.map((s) => Number(s.refId)).filter(Number.isInteger) },
      },
      select: { id: true, itemId: true },
    });
    const itemById = new Map(purchases.map((p) => [String(p.id), p.itemId]));

    const rows: TransactionView[] = [
      ...deposits.map((row): TransactionView => {
        const asset = assetByCurrency(row.currency);
        return {
          type: "deposit",
          id: `deposit:${row.id}`,
          createdAt: row.createdAt.toISOString(),
          symbol: asset?.symbol ?? row.currency.toUpperCase(),
          color: asset?.color ?? "#8b93a7",
          payAmount: row.payAmount.toString(),
          usdCredited: row.usdCredited.toFixed(2),
          status: row.status,
          confirmations: row.confirmations,
          requiredConfirmations: asset?.confirmations ?? 0,
        };
      }),
      ...spends.map((row): TransactionView => {
        const itemId = itemById.get(row.refId);
        return {
          type: "spend",
          id: `ledger:${row.id}`,
          createdAt: row.createdAt.toISOString(),
          kind: row.kind,
          title: itemId
            ? (storeItem(itemId)?.name ?? itemId)
            : row.kind.charAt(0).toUpperCase() + row.kind.slice(1),
          amountUsd: row.amountUsd.toFixed(2),
        };
      }),
    ];

    return rows
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, TRANSACTION_LIMIT);
  } catch (error) {
    console.error("[treasury:transactions]", error);
    return null;
  }
}
