import crypto from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { POST } from "@/app/api/deposit/ipn/route";

/**
 * The deposit callback is the only unauthenticated endpoint in this application
 * that can increase a balance. Every test here is a way it could pay out money
 * it should not: a forged signature, a replayed callback, a shared address
 * attributed to the wrong user, an amount that is not really dollars.
 */

const SECRET = "test-ipn-secret";
const prisma = new PrismaClient();

/** Sorted keys, recursively — the form NOWPayments signs over. */
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

const sign = (body: unknown) =>
  crypto
    .createHmac("sha512", SECRET)
    .update(JSON.stringify(canonicalise(body)))
    .digest("hex");

/** `signature: null` omits the header; a string sends it verbatim. */
function post(body: unknown, signature?: string | null): Promise<Response> {
  const header = signature === undefined ? sign(body) : signature;
  return POST(
    new Request("http://localhost/api/deposit/ipn", {
      method: "POST",
      body: JSON.stringify(body),
      headers: header ? { "x-nowpayments-sig": header } : {},
    }),
  );
}

const balanceOf = async (userId: number) =>
  (
    await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { balanceUsd: true },
    })
  ).balanceUsd.toFixed(2);

const ledgerCount = (userId: number) =>
  prisma.ledgerEntry.count({ where: { userId } });

const eventFor = (npPaymentId: string) =>
  prisma.depositEvent.findUnique({ where: { npPaymentId } });

let alice: number;
let bob: number;

beforeAll(async () => {
  const stamp = Date.now();
  alice = (await prisma.user.create({ data: { email: `alice-${stamp}@ipn.test` } })).id;
  bob = (await prisma.user.create({ data: { email: `bob-${stamp}@ipn.test` } })).id;

  await prisma.depositAddress.createMany({
    data: [
      { userId: alice, currency: "btc", address: `btc-${stamp}`, npPaymentId: "seed-1" },
      // XRP: one address shared by both users, told apart only by the tag.
      { userId: alice, currency: "xrp", address: `xrp-${stamp}`, extraId: "111111", npPaymentId: "seed-2" },
      { userId: bob, currency: "xrp", address: `xrp-${stamp}`, extraId: "222222", npPaymentId: "seed-3" },
    ],
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { endsWith: "@ipn.test" } } });
  await prisma.$disconnect();
});

/** Built per test so each gets its own payment id and cannot collide. */
async function btcPayload(overrides: Record<string, unknown> = {}) {
  const address = await prisma.depositAddress.findFirstOrThrow({
    where: { userId: alice, currency: "btc" },
  });
  return {
    payment_id: `pay-${Math.random().toString(36).slice(2)}`,
    pay_address: address.address,
    payment_status: "finished",
    actually_paid: "0.01842",
    outcome_amount: "100.00",
    outcome_currency: "usdttrc20",
    confirmations: 6,
    ...overrides,
  };
}

describe("signature verification", () => {
  it("rejects a callback with no signature", async () => {
    expect((await post(await btcPayload(), null)).status).toBe(401);
  });

  it("rejects a wrong signature", async () => {
    expect((await post(await btcPayload(), "ab".repeat(64))).status).toBe(401);
  });

  it("rejects a body altered after signing", async () => {
    const body = await btcPayload();
    const forged = { ...body, outcome_amount: "999999" };
    expect((await post(forged, sign(body))).status).toBe(401);
  });

  it("rejects unparseable JSON as unsigned rather than throwing", async () => {
    const response = await POST(
      new Request("http://localhost/api/deposit/ipn", {
        method: "POST",
        body: "{not json",
        headers: { "x-nowpayments-sig": "ab".repeat(64) },
      }),
    );
    expect(response.status).toBe(401);
  });

  it("credits nothing when a signature is rejected", async () => {
    const before = await balanceOf(alice);
    await post(await btcPayload(), null);
    expect(await balanceOf(alice)).toBe(before);
  });
});

describe("address resolution", () => {
  it("acknowledges an unknown address without recording it", async () => {
    const body = await btcPayload({ pay_address: "nobody-owns-this" });
    expect((await post(body)).status).toBe(200);
    expect(await eventFor(String(body.payment_id))).toBeNull();
  });

  it("routes a shared address by destination tag", async () => {
    const shared = await prisma.depositAddress.findFirstOrThrow({
      where: { userId: bob, currency: "xrp" },
    });
    const before = await balanceOf(alice);

    await post({
      payment_id: `xrp-${Date.now()}`,
      pay_address: shared.address,
      payin_extra_id: "222222",
      payment_status: "finished",
      actually_paid: "500",
      outcome_amount: "250.00",
      outcome_currency: "usdttrc20",
    });

    expect(await balanceOf(bob)).toBe("250.00");
    // The other holder of the same address must be untouched.
    expect(await balanceOf(alice)).toBe(before);
  });

  it("credits nobody when a shared address arrives with no tag", async () => {
    const shared = await prisma.depositAddress.findFirstOrThrow({
      where: { userId: bob, currency: "xrp" },
    });
    const before = { alice: await balanceOf(alice), bob: await balanceOf(bob) };
    const paymentId = `untagged-${Date.now()}`;

    expect(
      (
        await post({
          payment_id: paymentId,
          pay_address: shared.address,
          payment_status: "finished",
          actually_paid: "500",
          outcome_amount: "250.00",
          outcome_currency: "usdttrc20",
        })
      ).status,
    ).toBe(200);

    expect(await balanceOf(alice)).toBe(before.alice);
    expect(await balanceOf(bob)).toBe(before.bob);
    expect(await eventFor(paymentId)).toBeNull();
  });
});

describe("payload parsing", () => {
  it("acknowledges a signed callback that identifies no deposit", async () => {
    const body: Record<string, unknown> = await btcPayload();
    delete body.pay_address;

    expect((await post(body)).status).toBe(200);
    expect(await eventFor(String(body.payment_id))).toBeNull();
  });

  it("records a malformed amount as zero rather than crediting it", async () => {
    const body = await btcPayload({ outcome_amount: "not-a-number" });
    const before = await balanceOf(alice);

    await post(body);

    const event = await eventFor(String(body.payment_id));
    expect(event?.usdCredited.toFixed(2)).toBe("0.00");
    expect(event?.heldReason).toBeTruthy();
    expect(await balanceOf(alice)).toBe(before);
  });

  it("accepts numeric fields sent as numbers rather than strings", async () => {
    const body = await btcPayload({ outcome_amount: 12.5, payment_id: Date.now() });
    const before = await balanceOf(alice);

    await post(body);

    expect(await balanceOf(alice)).toBe((Number(before) + 12.5).toFixed(2));
  });
});

describe("deposit progression", () => {
  it("records confirmations without crediting, then credits once finished", async () => {
    const body = await btcPayload({ payment_status: "confirming", confirmations: 2, outcome_amount: "0" });
    const paymentId = String(body.payment_id);
    const before = await balanceOf(alice);

    await post(body);
    expect((await eventFor(paymentId))?.status).toBe("CONFIRMING");
    expect(await balanceOf(alice)).toBe(before);

    // A repeat `confirming` must advance the counter. Rejecting it as a
    // duplicate would freeze the n/N display the deposit list renders.
    await post({ ...body, confirmations: 5 });
    expect((await eventFor(paymentId))?.confirmations).toBe(5);
    expect(await prisma.depositEvent.count({ where: { npPaymentId: paymentId } })).toBe(1);

    await post({ ...body, payment_status: "finished", outcome_amount: "40.00", confirmations: 6 });
    expect((await eventFor(paymentId))?.status).toBe("CONFIRMED");
    expect(await balanceOf(alice)).toBe((Number(before) + 40).toFixed(2));
  });

  it("does not walk a credited deposit backwards", async () => {
    const body = await btcPayload({ outcome_amount: "10.00" });
    const paymentId = String(body.payment_id);
    await post(body);
    const credited = await balanceOf(alice);

    await post({ ...body, payment_status: "confirming", confirmations: 4 });

    expect((await eventFor(paymentId))?.status).toBe("CONFIRMED");
    expect(await balanceOf(alice)).toBe(credited);
  });

  it("rounds down, never up", async () => {
    const before = await balanceOf(alice);
    await post(await btcPayload({ outcome_amount: "1142.3067" }));
    expect(await balanceOf(alice)).toBe((Number(before) + 1142.3).toFixed(2));
  });
});

describe("idempotency", () => {
  it("credits a replayed callback only once", async () => {
    const body = await btcPayload({ outcome_amount: "75.00" });
    const before = { balance: await balanceOf(alice), entries: await ledgerCount(alice) };

    await post(body);
    await post(body);
    await post(body);

    expect(await balanceOf(alice)).toBe((Number(before.balance) + 75).toFixed(2));
    expect(await ledgerCount(alice)).toBe(before.entries + 1);
  });

  it("credits once when identical callbacks arrive concurrently", async () => {
    const body = await btcPayload({ outcome_amount: "30.00" });
    const before = { balance: await balanceOf(alice), entries: await ledgerCount(alice) };

    const responses = await Promise.all(Array.from({ length: 8 }, () => post(body)));

    expect(responses.every((r) => r.status === 200)).toBe(true);
    expect(await balanceOf(alice)).toBe((Number(before.balance) + 30).toFixed(2));
    expect(await ledgerCount(alice)).toBe(before.entries + 1);
  });
});

describe("outcome currency", () => {
  it("holds a confirmed deposit whose outcome is not dollar-denominated", async () => {
    const body = await btcPayload({ outcome_amount: "0.0184", outcome_currency: "btc" });
    const before = { balance: await balanceOf(alice), entries: await ledgerCount(alice) };

    await post(body);

    const event = await eventFor(String(body.payment_id));
    expect(event?.status).toBe("CONFIRMED");
    expect(event?.heldReason).toContain("not dollar-denominated");
    expect(event?.usdCredited.toFixed(2)).toBe("0.00");
    expect(await balanceOf(alice)).toBe(before.balance);
    expect(await ledgerCount(alice)).toBe(before.entries);
  });

  it("holds a confirmed deposit with no outcome amount", async () => {
    const body = await btcPayload({ outcome_amount: "0" });
    await post(body);
    expect((await eventFor(String(body.payment_id)))?.heldReason).toBeTruthy();
  });
});

describe("ledger", () => {
  it("keeps the cached balance equal to the sum of its entries", async () => {
    const sum = await prisma.ledgerEntry.aggregate({
      where: { userId: alice },
      _sum: { amountUsd: true },
    });
    expect(sum._sum.amountUsd?.toFixed(2)).toBe(await balanceOf(alice));
  });
});
