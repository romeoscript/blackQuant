"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { currentUserId } from "@/lib/session";
import { isSubscription, storeItem, type StoreEntitlement } from "@/lib/store";

export type PurchaseState = { ok: boolean; message: string };

const FUND_PATH = "/dashboard/fund";

/**
 * What the account currently holds — an active subscription, and every add-on
 * ever bought. The store reads this to decide which items are still buyable.
 */
export async function listEntitlements(): Promise<StoreEntitlement[] | null> {
  const userId = await currentUserId();
  if (userId === null) return null;

  try {
    const purchases = await prisma.purchase.findMany({
      where: {
        userId,
        // An add-on has no expiry and is kept; a subscription counts only while
        // it is still running.
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: { itemId: true, expiresAt: true },
      orderBy: { createdAt: "desc" },
    });

    return purchases.map((purchase) => ({
      itemId: purchase.itemId,
      expiresAt: purchase.expiresAt?.toISOString() ?? null,
    }));
  } catch (error) {
    console.error("[store:entitlements]", error);
    return null;
  }
}

/**
 * Buys an item with the account's balance.
 *
 * Takes an id, never a price: the amount charged is read from the catalogue on
 * the server, so the browser cannot name its own.
 *
 * The debit is a conditional update rather than a read-then-write. Two clicks
 * arriving together would both pass a "can they afford it?" check made in
 * application code and both succeed; making the balance itself the condition
 * means the database rejects the second one, and a balance can never go
 * negative no matter how the request arrives.
 */
export async function purchaseItem(itemId: string): Promise<PurchaseState> {
  const userId = await currentUserId();
  if (userId === null)
    return { ok: false, message: "Your session has expired." };

  const item = storeItem(itemId);
  if (!item) return { ok: false, message: "That item isn't available." };

  const price = new Prisma.Decimal(item.priceUsd);
  const expiresAt =
    isSubscription(item) && item.days
      ? new Date(Date.now() + item.days * 86_400_000)
      : null;

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const held = await tx.purchase.findFirst({
          where: {
            userId,
            itemId,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          select: { id: true },
        });
        if (held) {
          return {
            ok: false,
            message: expiresAt
              ? "That subscription is already active."
              : "You already own that.",
          };
        }

        const debited = await tx.user.updateMany({
          where: { id: userId, balanceUsd: { gte: price } },
          data: { balanceUsd: { decrement: price } },
        });
        if (debited.count === 0) {
          return {
            ok: false,
            message: "Not enough balance. Deposit crypto to top up.",
          };
        }

        const purchase = await tx.purchase.create({
          data: { userId, itemId, priceUsd: price, expiresAt },
        });

        // Negative, because the ledger is signed and the balance is derived from
        // it. Nothing debits a balance without the entry that explains it.
        await tx.ledgerEntry.create({
          data: {
            userId,
            amountUsd: price.negated(),
            kind: "purchase",
            refId: String(purchase.id),
          },
        });

        await tx.notification.create({
          data: {
            userId,
            kind: "SYSTEM",
            title: `${item.name} activated`,
            body: expiresAt
              ? `$${item.priceUsd} was deducted from your balance. Active until ${expiresAt.toDateString()}.`
              : `$${item.priceUsd} was deducted from your balance.`,
          },
        });

        return { ok: true, message: `${item.name} is now active.` };
      },
      // Serializable because the "do they already own this?" check is a read
      // followed by a write: under the default isolation two clicks arriving
      // together both see "not owned" and both charge. The balance guard alone
      // does not catch it, since the account can afford both. Postgres aborts
      // the loser, which the catch below turns into a refusal.
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    // Only when something actually changed; a refused purchase has nothing to
    // revalidate.
    if (result.ok) revalidatePath(FUND_PATH);
    return result;
  } catch (error) {
    console.error("[store:purchase]", error);
    return {
      ok: false,
      message: "We couldn't complete that purchase. Your balance is unchanged.",
    };
  }
}
