import { afterEach, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { fulfilIntent } from "@/lib/purchase";
import { catalogueItem } from "@/lib/catalogue";

/**
 * Paying by crypto settles from a webhook, so the dangerous cases are the ones
 * nobody is watching: granting an item the money never arrived for, granting it
 * twice because a callback repeated, or charging a balance that is already
 * short.
 */

const prisma = new PrismaClient();
const PLAN = "plan-growth-monthly";
const PRICE = catalogueItem(PLAN)!.priceUsd;

let currentUserId: number | null = null;
vi.mock("@/auth", () => ({
  auth: async () =>
    currentUserId === null ? null : { user: { id: String(currentUserId) } },
}));

let made = 0;

async function makeUserWithIntent(balance: number, npPaymentId: string) {
  const user = await prisma.user.create({
    data: { email: `checkout-${Date.now()}-${made++}@ipn.test`, balanceUsd: balance },
  });
  currentUserId = user.id;

  await prisma.paymentIntent.create({
    data: {
      userId: user.id,
      itemId: PLAN,
      priceUsd: PRICE,
      npPaymentId,
      payAddress: `addr-${npPaymentId}`,
      payCurrency: "btc",
    },
  });
  return user.id;
}

const balanceOf = async (userId: number) =>
  (
    await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { balanceUsd: true },
    })
  ).balanceUsd.toFixed(2);

afterEach(async () => {
  await prisma.user.deleteMany({ where: { email: { endsWith: "@ipn.test" } } });
});

describe("fulfilling a paid checkout", () => {
  it("grants the item and spends the credited balance", async () => {
    const id = `np-${Date.now()}-a`;
    // The callback credited the price before fulfilment runs.
    const userId = await makeUserWithIntent(PRICE, id);

    await fulfilIntent(id);

    expect(await balanceOf(userId)).toBe("0.00");
    const purchase = await prisma.purchase.findFirstOrThrow({ where: { userId } });
    expect(purchase.itemId).toBe(PLAN);
    expect(purchase.expiresAt).not.toBeNull();
  });

  it("marks the intent settled so a replay cannot buy it again", async () => {
    const id = `np-${Date.now()}-b`;
    const userId = await makeUserWithIntent(PRICE * 3, id);

    await fulfilIntent(id);
    await fulfilIntent(id);
    await fulfilIntent(id);

    expect(await prisma.purchase.count({ where: { userId } })).toBe(1);
    expect(await balanceOf(userId)).toBe((PRICE * 2).toFixed(2));
  });

  it("grants once when repeated callbacks arrive together", async () => {
    const id = `np-${Date.now()}-c`;
    const userId = await makeUserWithIntent(PRICE * 3, id);

    await Promise.all([fulfilIntent(id), fulfilIntent(id), fulfilIntent(id)]);

    expect(await prisma.purchase.count({ where: { userId } })).toBe(1);
  });

  it("tells the user rather than granting when the balance falls short", async () => {
    const id = `np-${Date.now()}-d`;
    // A shortfall the fee setting exists to prevent, but which must still fail
    // safely if it ever happens.
    const userId = await makeUserWithIntent(PRICE - 1, id);

    await fulfilIntent(id);

    expect(await prisma.purchase.count({ where: { userId } })).toBe(0);
    expect(await balanceOf(userId)).toBe((PRICE - 1).toFixed(2));

    const notice = await prisma.notification.findFirstOrThrow({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    expect(notice.title).toMatch(/not activated/i);
  });

  it("ignores a payment id that belongs to no intent", async () => {
    await expect(fulfilIntent("np-nothing-here")).resolves.toBeUndefined();
  });
});
