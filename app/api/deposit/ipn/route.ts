import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { env } from "@/lib/env";
import { depositStatus, furthestStatus, isUsdDenominated } from "@/lib/deposit";
import { ipnPayloadSchema } from "@/lib/nowpayments";
import { publishDeposit } from "@/lib/events";

/**
 * The NOWPayments callback. The only place in the application where a balance
 * goes up, and — without the signature check below — an unauthenticated "give
 * this user money" endpoint. Nothing here trusts the client.
 *
 * Anything we decide not to act on still answers 200: a non-200 makes
 * NOWPayments retry, and retrying a callback we deliberately ignored only
 * generates noise.
 */

/** Sorted keys, recursively — the form the signature is computed over. */
function canonicalise(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalise);
  if (value && typeof value === "object") {
    return Object.keys(value as object)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = canonicalise((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return value;
}

function verify(raw: string, signature: string | null): boolean {
  if (!signature || !env.NOWPAYMENTS_IPN_SECRET) return false;

  let canonical: string;
  try {
    canonical = JSON.stringify(canonicalise(JSON.parse(raw)));
  } catch {
    // Unparseable body: rejected as unsigned rather than thrown, so a malformed
    // POST is a 401 and not a 500.
    return false;
  }

  const expected = crypto
    .createHmac("sha512", env.NOWPAYMENTS_IPN_SECRET)
    .update(canonical)
    .digest();
  const received = Buffer.from(signature, "hex");

  return (
    expected.length === received.length &&
    crypto.timingSafeEqual(expected, received)
  );
}

/** The schema normalises every amount to a numeric string; never a float. */
const decimal = (value: string) => new Prisma.Decimal(value);

export async function POST(req: Request) {
  const raw = await req.text();

  if (!verify(raw, req.headers.get("x-nowpayments-sig"))) {
    console.warn("[deposit:ipn] signature rejected");
    return Response.json({ error: "bad signature" }, { status: 401 });
  }

  // Kept as received for the record, parsed for use. A dispute six months from
  // now is answered by the bytes NOWPayments actually sent, not by our reading.
  const rawPayload = JSON.parse(raw) as Prisma.InputJsonValue;

  const parsed = ipnPayloadSchema.safeParse(rawPayload);
  if (!parsed.success) {
    // Signed but unusable. Acknowledged rather than retried: the same body will
    // fail the same way every time.
    console.error(
      "[deposit:ipn] unusable payload",
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    );
    return Response.json({ ok: true });
  }
  const evt = parsed.data;
  const npPaymentId = evt.payment_id;

  // Resolved from the address the money actually touched, not from order_id,
  // which can be stale or reused.
  //
  // On XRP the address is shared by every user and the destination tag is what
  // distinguishes them, so both halves are matched together. Anything that does
  // not resolve to exactly one row is left for a human: crediting the wrong
  // account is far worse than crediting late.
  const { pay_address: payAddress, payin_extra_id: extraId } = evt;

  const matches = await prisma.depositAddress.findMany({
    where: { address: payAddress, extraId },
    select: { userId: true, currency: true },
    take: 2,
  });

  if (matches.length !== 1) {
    console.error(
      `[deposit:ipn] ${matches.length === 0 ? "unknown" : "ambiguous"} address`,
      { payAddress, extraId, npPaymentId },
    );
    return Response.json({ ok: true });
  }
  const [{ userId, currency }] = matches;

  const status = depositStatus(evt.payment_status);
  const outcomeCurrency = evt.outcome_currency;
  const outcomeAmount = decimal(evt.outcome_amount);

  // Rounded down, never up: the balance must not exceed what arrived.
  const usd = outcomeAmount.toDecimalPlaces(2, Prisma.Decimal.ROUND_DOWN);

  // Auto-conversion turns every incoming asset into a stablecoin, which is what
  // makes `outcome_amount` readable as dollars. If it is ever switched off the
  // outcome is the asset itself, and crediting it as USD would be wrong by
  // orders of magnitude — so hold it and page someone instead.
  let heldReason: string | null = null;
  if (status === "CONFIRMED") {
    if (!isUsdDenominated(outcomeCurrency)) {
      heldReason = `outcome currency ${outcomeCurrency ?? "unknown"} is not dollar-denominated — check auto-conversion`;
    } else if (usd.lessThanOrEqualTo(0)) {
      heldReason = "confirmed with no outcome amount";
    }
  }
  if (heldReason) {
    console.error("[deposit:ipn] held for review", { npPaymentId, heldReason });
  }
  const creditable = status === "CONFIRMED" && heldReason === null;

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.depositEvent.findUnique({
        where: { npPaymentId },
        select: { status: true },
      });

      const event = await tx.depositEvent.upsert({
        where: { npPaymentId },
        create: {
          userId,
          currency,
          payAmount: decimal(evt.actually_paid),
          outcomeAmount,
          outcomeCurrency,
          usdCredited: creditable ? usd : new Prisma.Decimal(0),
          confirmations: evt.confirmations,
          txHash: evt.payin_hash,
          status,
          npPaymentId,
          heldReason,
          rawPayload,
        },
        update: {
          payAmount: decimal(evt.actually_paid),
          outcomeAmount,
          outcomeCurrency,
          confirmations: evt.confirmations,
          txHash: evt.payin_hash,
          // Callbacks arrive out of order; a deposit never moves backwards.
          status: furthestStatus(status, existing?.status),
          heldReason,
          rawPayload,
          ...(creditable ? { usdCredited: usd } : {}),
        },
        select: { id: true },
      });

      if (!creditable) return;

      // The retry case, which is the common one. The unique constraint below is
      // what covers the concurrent one: the loser's whole transaction rolls
      // back, so the balance cannot be incremented twice.
      const refId = String(event.id);
      const credited = await tx.ledgerEntry.findUnique({
        where: { kind_refId: { kind: "deposit", refId } },
        select: { id: true },
      });
      if (credited) return;

      await tx.ledgerEntry.create({
        data: { userId, amountUsd: usd, kind: "deposit", refId },
      });
      await tx.user.update({
        where: { id: userId },
        data: { balanceUsd: { increment: usd } },
      });
      await tx.notification.create({
        data: {
          userId,
          kind: "SYSTEM",
          title: "Deposit credited",
          body: `Your ${currency.toUpperCase()} deposit of $${usd.toFixed(2)} has been added to your balance.`,
        },
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // Two callbacks for the same payment landed at once and the other one
      // credited it. Expected on retries, not an error.
      return Response.json({ ok: true });
    }
    console.error("[deposit:ipn]", error);
    throw error;
  }

  // After the commit, never inside it: a subscriber must not be told a balance
  // moved by a transaction that could still roll back.
  publishDeposit(userId, {
    type: "deposit",
    npPaymentId,
    status,
    confirmations: evt.confirmations,
  });

  return Response.json({ ok: true });
}
