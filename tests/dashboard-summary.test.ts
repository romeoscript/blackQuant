import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { getControlCenterSummary } from "@/app/dashboard-actions";
import { activityDays, type ActivityRange } from "@/lib/dashboard";
import { plainDate } from "@/lib/utils";

/**
 * The Control Center's numbers are read by someone deciding whether their money
 * arrived, so "roughly right" is not a passing grade. The date maths is the
 * part that breaks quietly: bucket boundaries, empty days, and the gap between
 * a UTC key and a local label.
 */

const prisma = new PrismaClient();

/** Fails the test rather than leaking a null into every assertion below. */
async function summaryFor(range: ActivityRange) {
  const summary = await getControlCenterSummary(range);
  if (!summary) throw new Error(`expected a summary for ${range}`);
  return summary;
}

/** The action reads the session, so tests exercise it through a stubbed auth. */
let currentUserId: number | null = null;
vi.mock("@/auth", () => ({
  auth: async () =>
    currentUserId === null ? null : { user: { id: String(currentUserId) } },
}));

const daysAgo = (n: number, hourUtc = 12) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - n);
  date.setUTCHours(hourUtc, 0, 0, 0);
  return date;
};

const key = (date: Date) => date.toISOString().slice(0, 10);

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { email: `summary-${Date.now()}@ipn.test`, balanceUsd: 500 },
  });
  currentUserId = user.id;

  await prisma.ledgerEntry.createMany({
    data: [
      { userId: user.id, amountUsd: 100, kind: "deposit", refId: "t-1", createdAt: daysAgo(0) },
      { userId: user.id, amountUsd: 250, kind: "deposit", refId: "t-2", createdAt: daysAgo(2) },
      // Same day as t-2: the two must land in one bucket, not two.
      { userId: user.id, amountUsd: 50, kind: "deposit", refId: "t-3", createdAt: daysAgo(2, 20) },
      { userId: user.id, amountUsd: -30, kind: "purchase", refId: "t-4", createdAt: daysAgo(3) },
      // Outside the 7-day window, inside the 30-day one.
      { userId: user.id, amountUsd: 900, kind: "deposit", refId: "t-5", createdAt: daysAgo(20) },
    ],
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { endsWith: "@ipn.test" } } });
  await prisma.$disconnect();
});

describe("activity buckets", () => {
  it("returns one bucket per day in the window, including empty ones", async () => {
    const summary = await summaryFor("7d");
    expect(summary.activity).toHaveLength(7);
    expect(summary.activity.filter((d) => d.netUsd === 0).length).toBeGreaterThan(0);
  });

  it("is ordered oldest to newest, with no gaps", async () => {
    const { activity } = await summaryFor("30d");
    const dates = activity.map((d) => d.date);
    expect([...dates].sort()).toEqual(dates);

    for (let i = 1; i < dates.length; i++) {
      const gap =
        (plainDate(dates[i]).getTime() - plainDate(dates[i - 1]).getTime()) /
        86_400_000;
      expect(gap).toBe(1);
    }
  });

  it("sums entries that fall on the same day into one bucket", async () => {
    const { activity } = await summaryFor("7d");
    const day = activity.find((d) => d.date === key(daysAgo(2)));
    expect(day?.netUsd).toBe(300);
  });

  it("keeps spend negative, so a bar can point the other way", async () => {
    const { activity } = await summaryFor("7d");
    expect(activity.find((d) => d.date === key(daysAgo(3)))?.netUsd).toBe(-30);
  });

  it("excludes entries outside the window and includes them in a wider one", async () => {
    const week = await summaryFor("7d");
    const month = await summaryFor("30d");

    expect(week.activity.some((d) => d.netUsd === 900)).toBe(false);
    expect(month.activity.some((d) => d.netUsd === 900)).toBe(true);
    // 100 + 250 + 50 − 30 within the week; the 900 lands only in the month.
    expect(Number(week.activityTotalUsd)).toBe(370);
    expect(Number(month.activityTotalUsd)).toBe(1270);
  });

  it("falls back to the shortest window for an unknown range", async () => {
    // The range crosses from the client and must never index blindly.
    const summary = await summaryFor("300y" as never);
    expect(summary.activity).toHaveLength(activityDays("7d"));
  });
});

describe("totals", () => {
  it("counts only credited deposits, not spend", async () => {
    const summary = await summaryFor("30d");
    // 100 + 250 + 50 + 900; the -30 purchase is not a deposit.
    expect(summary.totalDepositedUsd).toBe("1300.00");
  });

  it("reports unavailable rather than an empty account", async () => {
    const signedIn = currentUserId;
    currentUserId = null;
    // Null, never zeroes: a screen cannot tell "no money" from "no answer".
    expect(await getControlCenterSummary("7d")).toBeNull();
    currentUserId = signedIn;
  });
});

describe("plainDate", () => {
  it("reads a key as that calendar day, whatever the timezone", () => {
    const date = plainDate("2026-08-08");
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(7);
    // The bug this exists for: `new Date("2026-08-08")` is the 7th anywhere
    // behind UTC, which shifted every weekday label on the chart.
    expect(date.getDate()).toBe(8);
  });
});
