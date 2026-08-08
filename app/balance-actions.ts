"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

/**
 * The account's spendable balance, as a fixed-point string.
 *
 * A string rather than a number: `balanceUsd` is a database decimal, and
 * putting money through a JS float on the way to the screen is how a balance
 * ends up a cent short of the ledger that produced it.
 */
export async function getBalanceUsd(): Promise<string> {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!Number.isInteger(userId)) return "0.00";

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { balanceUsd: true },
  });
  return (user?.balanceUsd ?? 0).toFixed(2);
}
