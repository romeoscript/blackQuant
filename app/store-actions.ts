"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { currentUserId } from "@/lib/session";
import { env } from "@/lib/env";
import { qrSvg } from "@/lib/qr";
import { rateLimit, type Limit } from "@/lib/rate-limit";
import { DEPOSIT_ASSETS } from "@/lib/deposit";
import { createCheckout, isDepositsConfigured } from "@/lib/nowpayments";
import { Prisma } from "@prisma/client";
import { catalogueItem, type Entitlement } from "@/lib/catalogue";
import {
  heldEntitlement,
  purchaseFor,
  type PurchaseState,
} from "@/lib/purchase";

const FUND_PATH = "/dashboard/fund";

/** Each checkout mints an upstream payment, so it is capped per user. */
const CHECKOUT_LIMIT: Limit = { windowMs: 60 * 60_000, max: 10 };

/**
 * What the account currently holds — an active subscription, and every add-on
 * ever bought. The store reads this to decide which items are still buyable.
 */
export async function listEntitlements(): Promise<Entitlement[] | null> {
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

  const result = await purchaseFor(userId, itemId);
  // Only when something actually changed; a refused purchase has nothing to
  // revalidate.
  if (result.ok) revalidatePath(FUND_PATH);
  return result;
}

export type CheckoutView = {
  itemName: string;
  priceUsd: string;
  payCurrency: string;
  payAmount: string;
  address: string;
  extraId: string | null;
  qrSvg: string;
};

export type CheckoutResult =
  ({ ok: true } & CheckoutView) | { ok: false; message: string };

/**
 * Raises a crypto payment for one item, instead of spending the balance.
 *
 * The money still arrives through the ordinary deposit path — the callback
 * credits the balance exactly as a top-up does — and the intent recorded here
 * is what tells the handler to spend it on this item once it lands. That keeps
 * one way for money to enter the system, and keeps the ledger explaining the
 * balance: credited in, spent out, both visible.
 */
export async function startCheckout(
  itemId: string,
  payCurrency: string,
): Promise<CheckoutResult> {
  const userId = await currentUserId();
  if (userId === null)
    return { ok: false, message: "Your session has expired." };

  const item = catalogueItem(itemId);
  if (!item) return { ok: false, message: "That item isn't available." };

  const asset = DEPOSIT_ASSETS.find((a) => a.currency === payCurrency);
  if (!asset) return { ok: false, message: "Choose a supported coin." };

  if (!isDepositsConfigured()) {
    return {
      ok: false,
      message:
        "Paying by crypto isn't available yet. Use your balance instead.",
    };
  }

  const held = await heldEntitlement(userId, itemId);
  if (held) {
    return { ok: false, message: "You already have that." };
  }

  const limit = rateLimit(`checkout:${userId}`, CHECKOUT_LIMIT);
  if (!limit.ok) {
    return {
      ok: false,
      message: "Too many attempts. Wait a minute and try again.",
    };
  }

  try {
    const payment = await createCheckout({
      priceUsd: item.priceUsd,
      payCurrency,
      orderId: `${userId}:${itemId}`,
      description: `BlackQuant — ${item.name}`,
      callbackUrl: `${env.AUTH_URL ?? "http://localhost:3000"}/api/deposit/ipn`,
    });

    const intent = await prisma.paymentIntent.create({
      data: {
        userId,
        itemId,
        priceUsd: new Prisma.Decimal(item.priceUsd),
        npPaymentId: String(payment.payment_id),
        payAddress: payment.pay_address,
        payExtraId: payment.payin_extra_id ?? null,
        payCurrency,
      },
    });

    return {
      ok: true,
      itemName: item.name,
      priceUsd: intent.priceUsd.toFixed(2),
      payCurrency: asset.symbol,
      payAmount: String(payment.pay_amount),
      address: payment.pay_address,
      extraId: payment.payin_extra_id ?? null,
      qrSvg: qrSvg(payment.pay_address),
    };
  } catch (error) {
    console.error("[store:checkout]", error);
    return {
      ok: false,
      message: "We couldn't start that payment. Please try again.",
    };
  }
}
