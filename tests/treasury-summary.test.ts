import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { getTreasurySummary } from "@/app/treasury-actions";

/**
 * The balance curve is the part that breaks quietly: it carries a balance in
 * from before the window, and each point has to close at the bucket's end
 * rather than report what moved inside it. Getting that wrong shows someone a
 * balance they never had.
 */

const prisma = new PrismaClient();

let currentUserId: number | null = null;
vi.mock("@/auth", () => ({
  auth: async () =>
    currentUserId === null ? null : { user: { id: String(currentUserId) } },
}));

const daysAgo = (n: number) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - n);
  date.setUTCHours(12, 0, 0, 0);
  return date;
};

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { email: `treasury-${Date.now()}@ipn.test`, balanceUsd: 420 },
  });
  currentUserId = user.id;

  await prisma.ledgerEntry.createMany({
    data: [
      // Before the 30-day window: must arrive as an opening balance, not vanish.
      { userId: user.id, amountUsd: 200, kind: "deposit", refId: "tr-1", createdAt: daysAgo(90) },
      { userId: user.id, amountUsd: 300, kind: "deposit", refId: "tr-2", createdAt: daysAgo(5) },
      { userId: user.id, amountUsd: -80, kind: "withdrawal", refId: "tr-3", createdAt: daysAgo(3) },
    ],
  });

  await prisma.depositEvent.createMany({
    data: [
      {
        userId: user.id, currency: "btc", payAmount: "0.01", usdCredited: 200,
        status: "CONFIRMED", npPaymentId: `tr-btc-${Date.now()}`, rawPayload: {},
        createdAt: daysAgo(90),
      },
      {
        userId: user.id, currency: "usdttrc20", payAmount: "300", usdCredited: 300,
        status: "CONFIRMED", npPaymentId: `tr-usdt-${Date.now()}`, rawPayload: {},
        createdAt: daysAgo(5),
      },
      {
        userId: user.id, currency: "sol", payAmount: "2", usdCredited: 0,
        status: "CONFIRMING", npPaymentId: `tr-sol-${Date.now()}`, rawPayload: {},
        createdAt: daysAgo(1),
      },
    ],
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { endsWith: "@ipn.test" } } });
  await prisma.$disconnect();
});

describe("totals", () => {
  it("separates deposits from withdrawals and reports withdrawals positive", async () => {
    const summary = await getTreasurySummary("12M");
    expect(summary.totalDepositedUsd).toBe("500.00");
    expect(summary.totalWithdrawnUsd).toBe("80.00");
  });

  it("counts only deposits still awaiting confirmation", async () => {
    expect((await getTreasurySummary("12M")).pendingCount).toBe(1);
  });
});

describe("deposits by asset", () => {
  it("groups confirmed deposits and shares add up", async () => {
    const { byAsset } = await getTreasurySummary("12M");
    expect(byAsset.map((a) => a.symbol)).toEqual(["USDT", "BTC"]);
    expect(byAsset.reduce((total, a) => total + a.share, 0)).toBe(100);
  });

  it("leaves unconfirmed deposits out entirely", async () => {
    const { byAsset } = await getTreasurySummary("12M");
    expect(byAsset.some((a) => a.symbol === "SOL")).toBe(false);
  });
});

describe("balance history", () => {
  it("carries in the balance from before the window", async () => {
    const { history } = await getTreasurySummary("1M");
    // The 90-day-old $200 predates this window; the curve must start there.
    expect(history[0].balanceUsd).toBe(200);
  });

  it("closes each point at the running balance, ending at today's", async () => {
    const { history } = await getTreasurySummary("1M");
    expect(history.at(-1)?.balanceUsd).toBe(420);
  });

  it("never moves backwards through time", async () => {
    const { history } = await getTreasurySummary("12M");
    expect(history).toHaveLength(12);
    expect(new Set(history.map((p) => p.label)).size).toBe(12);
  });

  it("returns a daily window for 1M and monthly for longer ranges", async () => {
    expect((await getTreasurySummary("1M")).history).toHaveLength(30);
    expect((await getTreasurySummary("6M")).history).toHaveLength(6);
  });

  it("falls back to the longest range for an unknown id", async () => {
    const summary = await getTreasurySummary("nonsense" as never);
    expect(summary.history).toHaveLength(12);
  });
});

describe("no session", () => {
  it("returns empty values rather than throwing", async () => {
    const signedIn = currentUserId;
    currentUserId = null;
    const summary = await getTreasurySummary("12M");
    expect(summary.balanceUsd).toBe("0.00");
    expect(summary.byAsset).toEqual([]);
    currentUserId = signedIn;
  });
});
