"use server";

import prisma from "@/lib/prisma";
import { currentUserId } from "@/lib/session";

/**
 * The account's spendable balance, as a fixed-point string.
 *
 * A string rather than a number: `balanceUsd` is a database decimal, and
 * putting money through a JS float on the way to the screen is how a balance
 * ends up a cent short of the ledger that produced it.
 */
export async function getBalanceUsd(): Promise<string | null> {
  const userId = await currentUserId();
  if (userId === null) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balanceUsd: true },
    });
    return user ? user.balanceUsd.toFixed(2) : null;
  } catch (error) {
    // Null, not "0.00". A failed read that renders as zero tells someone their
    // money is gone.
    console.error("[balance]", error);
    return null;
  }
}
