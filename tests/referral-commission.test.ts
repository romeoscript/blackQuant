import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { purchaseItem } from "@/app/store-actions";
import { getReferralSummary } from "@/app/referral-actions";
import {
  REFERRAL_TIERS,
  ensureReferralCode,
  normaliseReferralCode,
  referrerByCode,
} from "@/lib/referral";

/**
 * Commission is money, so the failure modes are the point: paying twice, paying
 * an account that referred itself, or letting the balance disagree with the
 * ledger that is supposed to explain it.
 */

const prisma = new PrismaClient();

/** $500 — a round price makes the 5% and 2% obvious in the assertions. */
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

const ledgerSumOf = async (userId: number) =>
  (
    await prisma.ledgerEntry.aggregate({
      where: { userId },
      _sum: { amountUsd: true },
    })
  )._sum.amountUsd?.toFixed(2) ?? "0.00";

let made = 0;

async function makeUser(balance: number, referredById?: number) {
  const user = await prisma.user.create({
    data: {
      email: `ref-${Date.now()}-${made++}@ipn.test`,
      balanceUsd: balance,
      referredById,
    },
  });
  return user.id;
}

/** Signs in as this account for the actions under test. */
const as = (userId: number | null) => {
  currentUserId = userId;
};

beforeEach(() => {
  currentUserId = null;
});

afterEach(async () => {
  await prisma.user.deleteMany({ where: { email: { endsWith: "@ipn.test" } } });
});

describe("paying commission", () => {
  it("credits the direct referrer 5% of what their referral spends", async () => {
    const referrer = await makeUser(0);
    const buyer = await makeUser(1000, referrer);

    as(buyer);
    expect((await purchaseItem(MONTHLY)).ok).toBe(true);

    // 5% of $500.
    expect(await balanceOf(referrer)).toBe("25.00");
  });

  it("credits the tier above at 2%, and stops there", async () => {
    const top = await makeUser(0);
    const middle = await makeUser(0, top);
    const buyer = await makeUser(1000, middle);

    as(buyer);
    await purchaseItem(MONTHLY);

    expect(await balanceOf(middle)).toBe("25.00");
    expect(await balanceOf(top)).toBe("10.00");
  });

  it("does not pay a third level", async () => {
    const great = await makeUser(0);
    const top = await makeUser(0, great);
    const middle = await makeUser(0, top);
    const buyer = await makeUser(1000, middle);

    as(buyer);
    await purchaseItem(MONTHLY);

    expect(await balanceOf(great)).toBe("0.00");
    expect(
      await prisma.referralCommission.count({ where: { earnerId: great } }),
    ).toBe(0);
  });

  it("writes a ledger entry that explains every credit", async () => {
    const referrer = await makeUser(0);
    const buyer = await makeUser(1000, referrer);

    as(buyer);
    await purchaseItem(MONTHLY);

    const entry = await prisma.ledgerEntry.findFirstOrThrow({
      where: { userId: referrer, kind: "referral" },
    });
    expect(entry.amountUsd.toFixed(2)).toBe("25.00");
    // The invariant the whole system rests on: the balance is the ledger.
    expect(await ledgerSumOf(referrer)).toBe(await balanceOf(referrer));
  });

  it("freezes the rate it was paid at, so a rate change cannot rewrite it", async () => {
    const referrer = await makeUser(0);
    const buyer = await makeUser(1000, referrer);

    as(buyer);
    await purchaseItem(MONTHLY);

    const commission = await prisma.referralCommission.findFirstOrThrow({
      where: { earnerId: referrer },
    });
    expect(commission.rateBps).toBe(REFERRAL_TIERS[0].rateBps);
    expect(commission.tier).toBe(1);
  });

  it("pays on an add-on as well as a subscription", async () => {
    const referrer = await makeUser(0);
    const buyer = await makeUser(1000, referrer);

    as(buyer);
    await purchaseItem(ADDON);

    const commission = await prisma.referralCommission.findFirstOrThrow({
      where: { earnerId: referrer },
    });
    expect(commission.amountUsd.greaterThan(0)).toBe(true);
  });
});

describe("refusing to pay", () => {
  it("pays nobody when the buyer was not referred", async () => {
    const buyer = await makeUser(1000);

    as(buyer);
    await purchaseItem(MONTHLY);

    expect(await prisma.referralCommission.count()).toBe(0);
    expect(await balanceOf(buyer)).toBe("500.00");
  });

  it("will not let an account earn commission on its own spending", async () => {
    const buyer = await makeUser(1000);
    // Not reachable through signup — attribution is written once, and a
    // referrer necessarily predates the account naming them. Forced here
    // because the cost of the guard being absent is an account paying itself.
    await prisma.user.update({
      where: { id: buyer },
      data: { referredById: buyer },
    });

    as(buyer);
    await purchaseItem(MONTHLY);

    expect(await prisma.referralCommission.count()).toBe(0);
    expect(await balanceOf(buyer)).toBe("500.00");
  });

  it("pays a cycle only once per account", async () => {
    const a = await makeUser(0);
    const b = await makeUser(1000, a);
    await prisma.user.update({ where: { id: a }, data: { referredById: b } });

    as(b);
    await purchaseItem(MONTHLY);

    // A is the direct referrer and earns; B is above A, but B is the buyer, so
    // the chain stops rather than paying the spender their own second tier.
    expect(await balanceOf(a)).toBe("25.00");
    expect(
      await prisma.referralCommission.count({ where: { earnerId: b } }),
    ).toBe(0);
  });

  it("pays nothing when the purchase is refused", async () => {
    const referrer = await makeUser(0);
    const buyer = await makeUser(100, referrer);

    as(buyer);
    expect((await purchaseItem(MONTHLY)).ok).toBe(false);

    expect(await prisma.referralCommission.count()).toBe(0);
    expect(await balanceOf(referrer)).toBe("0.00");
  });
});

describe("paying exactly once", () => {
  it("does not pay twice when the same purchase is clicked repeatedly", async () => {
    const referrer = await makeUser(0);
    const buyer = await makeUser(2000, referrer);

    as(buyer);
    await Promise.all(Array.from({ length: 5 }, () => purchaseItem(MONTHLY)));

    expect(await balanceOf(referrer)).toBe("25.00");
    expect(
      await prisma.referralCommission.count({ where: { earnerId: referrer } }),
    ).toBe(1);
  });

  it("keeps the two tiers of one purchase apart in the ledger", async () => {
    const top = await makeUser(0);
    const middle = await makeUser(0, top);
    const buyer = await makeUser(1000, middle);

    as(buyer);
    await purchaseItem(MONTHLY);

    const purchase = await prisma.purchase.findFirstOrThrow({
      where: { userId: buyer },
    });
    const refIds = (
      await prisma.ledgerEntry.findMany({
        where: { kind: "referral" },
        select: { refId: true },
      })
    ).map((entry) => entry.refId);

    // Same purchase, different entries — without the tier in `refId` the second
    // would collide with the first on the unique key and go unpaid.
    expect(refIds).toEqual(
      expect.arrayContaining([`${purchase.id}:1`, `${purchase.id}:2`]),
    );
  });
});

describe("referral codes", () => {
  it("mints one on first read and returns the same one afterwards", async () => {
    const userId = await makeUser(0);

    const first = await ensureReferralCode(userId);
    const second = await ensureReferralCode(userId);

    expect(first).toBe(second);
    expect(normaliseReferralCode(first)).toBe(first);
  });

  it("resolves a code back to its owner, case-insensitively", async () => {
    const userId = await makeUser(0);
    const code = await ensureReferralCode(userId);

    expect(await referrerByCode(code.toUpperCase())).toBe(userId);
  });

  it("rejects anything that is not one of ours without querying", async () => {
    expect(normaliseReferralCode("")).toBeNull();
    expect(normaliseReferralCode("short")).toBeNull();
    // `l` and `0` are not in the alphabet — they are the characters people
    // misread, so they are the ones a hand-typed code gets wrong.
    expect(normaliseReferralCode("abcdefgl")).toBeNull();
    expect(await referrerByCode("not-a-code")).toBeNull();
  });
});

describe("the hub", () => {
  it("reports earnings, downline and status from the rows that explain them", async () => {
    const referrer = await makeUser(0);
    const active = await makeUser(1000, referrer);
    await makeUser(0, referrer);

    as(active);
    await purchaseItem(MONTHLY);

    as(referrer);
    const summary = await getReferralSummary();

    expect(summary?.totalReferrals).toBe(2);
    expect(summary?.activeReferrals).toBe(1);
    expect(summary?.totalEarnedUsd).toBe("25.00");
    expect(summary?.last30DaysUsd).toBe("25.00");
    expect(summary?.link).toContain(summary?.code);

    const earner = summary?.downline.find((row) => row.id === active);
    expect(earner?.active).toBe(true);
    expect(earner?.earnedUsd).toBe("25.00");
    expect(
      summary?.downline.find((row) => row.id !== active)?.earnedUsd,
    ).toBe("0.00");
  });

  it("counts a lapsed subscription as inactive", async () => {
    const referrer = await makeUser(0);
    const referred = await makeUser(1000, referrer);

    as(referred);
    await purchaseItem(MONTHLY);
    await prisma.purchase.updateMany({
      where: { userId: referred },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    as(referrer);
    const summary = await getReferralSummary();

    expect(summary?.totalReferrals).toBe(1);
    expect(summary?.activeReferrals).toBe(0);
    // The commission stays paid — the sale happened.
    expect(summary?.totalEarnedUsd).toBe("25.00");
  });

  it("reports unavailable without a session rather than an empty hub", async () => {
    as(null);
    expect(await getReferralSummary()).toBeNull();
  });
});
