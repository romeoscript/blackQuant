import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { listEntitlements, purchaseItem } from "@/app/store-actions";
import { storeItem } from "@/lib/store";

/**
 * A purchase moves money, so the failure modes are the point: charging twice,
 * charging a price the client chose, or letting a balance go negative when two
 * clicks arrive together.
 */

const prisma = new PrismaClient();

const MONTHLY = "signal-pro-monthly";
const ADDON = "risk-guard";

let currentUserId: number | null = null;
vi.mock("@/auth", () => ({
  auth: async () =>
    currentUserId === null ? null : { user: { id: String(currentUserId) } },
}));

const balanceOf = async (userId: number) =>
  (
    await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { balanceUsd: true },
    })
  ).balanceUsd.toFixed(2);

async function makeUser(balance: number) {
  const user = await prisma.user.create({
    data: { email: `store-${Date.now()}-${Math.round(balance)}@ipn.test`, balanceUsd: balance },
  });
  currentUserId = user.id;
  return user.id;
}

beforeEach(() => {
  currentUserId = null;
});

afterEach(async () => {
  await prisma.user.deleteMany({ where: { email: { endsWith: "@ipn.test" } } });
});

describe("buying", () => {
  it("debits the catalogue price and records the purchase", async () => {
    const userId = await makeUser(1000);

    const result = await purchaseItem(MONTHLY);

    expect(result.ok).toBe(true);
    expect(await balanceOf(userId)).toBe("500.00");

    const purchase = await prisma.purchase.findFirstOrThrow({ where: { userId } });
    expect(purchase.priceUsd.toFixed(2)).toBe("500.00");
    // A subscription gets an expiry; that date is what makes it lapse.
    expect(purchase.expiresAt).not.toBeNull();
  });

  it("writes a signed ledger entry that explains the debit", async () => {
    const userId = await makeUser(1000);
    await purchaseItem(MONTHLY);

    const entry = await prisma.ledgerEntry.findFirstOrThrow({
      where: { userId, kind: "purchase" },
    });
    expect(entry.amountUsd.toFixed(2)).toBe("-500.00");

    const sum = await prisma.ledgerEntry.aggregate({
      where: { userId },
      _sum: { amountUsd: true },
    });
    // The ledger explains the balance even though the deposit side is absent
    // here: 1000 opening was seeded directly, so only the debit is recorded.
    expect(sum._sum.amountUsd?.toFixed(2)).toBe("-500.00");
  });

  it("leaves an add-on without an expiry, so it is owned for good", async () => {
    const userId = await makeUser(1000);
    await purchaseItem(ADDON);

    const purchase = await prisma.purchase.findFirstOrThrow({ where: { userId } });
    expect(purchase.expiresAt).toBeNull();
  });
});

describe("refusing", () => {
  it("will not sell what the balance cannot cover", async () => {
    const userId = await makeUser(499);

    const result = await purchaseItem(MONTHLY);

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/not enough balance/i);
    expect(await balanceOf(userId)).toBe("499.00");
    expect(await prisma.purchase.count({ where: { userId } })).toBe(0);
  });

  it("will not sell the same subscription twice", async () => {
    const userId = await makeUser(2000);
    await purchaseItem(MONTHLY);

    const second = await purchaseItem(MONTHLY);

    expect(second.ok).toBe(false);
    expect(await balanceOf(userId)).toBe("1500.00");
    expect(await prisma.purchase.count({ where: { userId } })).toBe(1);
  });

  it("rejects an unknown item rather than charging for it", async () => {
    const userId = await makeUser(1000);

    const result = await purchaseItem("free-money");

    expect(result.ok).toBe(false);
    expect(await balanceOf(userId)).toBe("1000.00");
  });

  it("refuses without a session", async () => {
    currentUserId = null;
    const result = await purchaseItem(MONTHLY);
    expect(result.ok).toBe(false);
  });
});

describe("concurrency", () => {
  it("charges once when the same purchase is clicked repeatedly", async () => {
    const userId = await makeUser(1000);

    const results = await Promise.all(
      Array.from({ length: 5 }, () => purchaseItem(MONTHLY)),
    );

    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(await balanceOf(userId)).toBe("500.00");
    expect(await prisma.purchase.count({ where: { userId } })).toBe(1);
  });

  it("never lets concurrent purchases overdraw the balance", async () => {
    // Enough for one item, not two — the classic read-then-write hole.
    const userId = await makeUser(300);

    await Promise.all([purchaseItem(ADDON), purchaseItem("vip-analytics")]);

    const balance = Number(await balanceOf(userId));
    expect(balance).toBeGreaterThanOrEqual(0);

    const spent = await prisma.purchase.aggregate({
      where: { userId },
      _sum: { priceUsd: true },
    });
    expect(Number(spent._sum.priceUsd ?? 0)).toBeLessThanOrEqual(300);
  });
});

describe("entitlements", () => {
  it("lists what was bought and omits what was not", async () => {
    await makeUser(1000);
    await purchaseItem(ADDON);

    const entitlements = await listEntitlements();

    expect(entitlements?.map((e) => e.itemId)).toEqual([ADDON]);
    expect(entitlements?.[0].expiresAt).toBeNull();
  });

  it("drops a subscription once it has lapsed", async () => {
    const userId = await makeUser(1000);
    await purchaseItem(MONTHLY);

    await prisma.purchase.updateMany({
      where: { userId },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    expect(await listEntitlements()).toEqual([]);
  });

  it("reports unavailable without a session rather than an empty list", async () => {
    currentUserId = null;
    expect(await listEntitlements()).toBeNull();
  });
});

describe("catalogue", () => {
  it("is the only source of a price", () => {
    // The action takes an id; this is where the amount charged comes from.
    expect(storeItem(MONTHLY)?.priceUsd).toBe(500);
    expect(storeItem("free-money")).toBeUndefined();
  });
});
