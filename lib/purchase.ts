import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { catalogueItem, isSubscription } from "@/lib/catalogue";
import { awardReferralCommissions } from "@/lib/referral";

export type PurchaseState = { ok: boolean; message: string };

/**
 * Buying, without a session.
 *
 * Lives here rather than beside the actions because both routes into it are
 * different: a click carries a signed-in user, and a crypto checkout settles
 * from a webhook where there is nobody to read. Both must debit and grant
 * identically, and a webhook must not have to import the auth stack to do it.
 */
/**
 * The purchase itself, without a session.
 *
 * Split out because a crypto checkout settles from a webhook, where there is no
 * signed-in user to read — and both routes must debit and grant identically.
 */
export async function purchaseFor(
  userId: number,
  itemId: string,
): Promise<PurchaseState> {
  const item = catalogueItem(itemId);
  if (!item) return { ok: false, message: "That item isn't available." };

  const price = new Prisma.Decimal(item.priceUsd);
  const expiresAt =
    isSubscription(item) && item.days
      ? new Date(Date.now() + item.days * 86_400_000)
      : null;

  try {
    const result = await withWriteConflictRetry(() =>
      prisma.$transaction(
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

          // Inside the sale's own transaction: a commission and the purchase
          // that earned it either both exist or neither does. Nothing retries
          // this the way NOWPayments retries a deposit, so paying it afterwards
          // would lose it outright on any failure.
          await awardReferralCommissions(tx, {
            id: purchase.id,
            buyerId: userId,
            priceUsd: price,
          });

          return { ok: true, message: `${item.name} is now active.` };
        },
        // Serializable because the "do they already own this?" check is a read
        // followed by a write: under the default isolation two clicks arriving
        // together both see "not owned" and both charge. The balance guard alone
        // does not catch it, since the account can afford both. Postgres aborts
        // the loser, which the catch below turns into a refusal.
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    );

    return result;
  } catch (error) {
    console.error("[store:purchase]", error);
    return {
      ok: false,
      message: "We couldn't complete that purchase. Your balance is unchanged.",
    };
  }
}

/**
 * Grants the item behind a settled payment intent.
 *
 * Called by the deposit callback once the money has been credited, so this only
 * spends a balance that already contains it. `fulfilledAt` is the guard: a
 * replayed callback finds the intent already settled and does nothing.
 */
export async function fulfilIntent(npPaymentId: string): Promise<void> {
  const intent = await prisma.paymentIntent.findUnique({
    where: { npPaymentId },
    select: { id: true, userId: true, itemId: true, fulfilledAt: true },
  });
  if (!intent || intent.fulfilledAt) return;

  const claimed = await prisma.paymentIntent.updateMany({
    where: { id: intent.id, fulfilledAt: null },
    data: { fulfilledAt: new Date() },
  });
  // Another callback claimed it first; it is buying the item, not us.
  if (claimed.count === 0) return;

  const result = await purchaseFor(intent.userId, intent.itemId);
  if (!result.ok) {
    // The money is in their balance either way, so this is recoverable by the
    // user rather than lost — but it needs to be visible.
    console.error("[store:fulfil]", { npPaymentId, message: result.message });
    await prisma.notification.create({
      data: {
        userId: intent.userId,
        kind: "SYSTEM",
        title: "Payment received, item not activated",
        body: `${result.message} The amount is in your balance and you can buy it from there.`,
      },
    });
  }
}

/** An active subscription or an add-on already owned, or null. */
export async function heldEntitlement(userId: number, itemId: string) {
  return prisma.purchase.findFirst({
    where: {
      userId,
      itemId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { id: true },
  });
}

/**
 * Retries a serializable transaction that lost a write conflict.
 *
 * Postgres aborts one side of a conflict with 40001 — Prisma's P2034 — and the
 * abort means nothing happened, so replaying is safe. Without this, the
 * isolation level that stops a double charge also fails the occasional
 * legitimate purchase that merely collided with one.
 */
async function withWriteConflictRetry<T>(run: () => Promise<T>): Promise<T> {
  const ATTEMPTS = 3;

  for (let attempt = 1; ; attempt++) {
    try {
      return await run();
    } catch (error) {
      const conflicted =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034";
      if (!conflicted || attempt === ATTEMPTS) throw error;

      // Staggered, so two callers retrying do not collide again in step.
      await new Promise((resolve) =>
        setTimeout(resolve, attempt * 25 + Math.random() * 25),
      );
    }
  }
}
