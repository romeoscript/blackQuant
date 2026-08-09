import { customAlphabet } from "nanoid";
import { Prisma, type PrismaClient } from "@prisma/client";
import prisma from "@/lib/prisma";

/**
 * The referral programme, in one place.
 *
 * Commission is paid on purchases and never on deposits. A deposit is still the
 * depositor's own money and can be withdrawn again, so paying a percentage of
 * one out is a straight loss and a laundering route; a purchase is revenue the
 * business has actually earned. That choice is the reason the award hook lives
 * in `lib/purchase.ts` and not in the deposit callback.
 */

/**
 * What each level of the chain earns, in basis points of the purchase price.
 *
 * Basis points rather than a float: 5% of $29 has to be an exact decimal, and
 * `0.05 * 29` is not one. Index 0 is the direct referrer.
 */
export const REFERRAL_TIERS = [
  { tier: 1, rateBps: 500, label: "Tier 1 (Direct)" },
  { tier: 2, rateBps: 200, label: "Tier 2 (Indirect)" },
] as const;

export type ReferralTier = (typeof REFERRAL_TIERS)[number];

/** "500" reads as 5% on screen; the stored figure stays exact. */
export const ratePercent = (rateBps: number): string =>
  `${(rateBps / 100).toFixed(rateBps % 100 === 0 ? 0 : 1)}%`;

/**
 * Where a click on a referral link is remembered until the account is created.
 *
 * A cookie rather than a query parameter carried through the form: the visitor
 * usually reads the landing page, wanders off, and signs up later — attribution
 * that only survives one navigation would credit almost nobody.
 */
export const REFERRAL_COOKIE = "bq_ref";
/** Long enough to survive a few days of thinking about it. */
export const REFERRAL_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

/**
 * No `0/o/1/l/i` — the code gets read off a screen and typed by hand, and a
 * character pair nobody can tell apart turns into a support ticket.
 */
const CODE_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";
const CODE_LENGTH = 8;
const nextCode = customAlphabet(CODE_ALPHABET, CODE_LENGTH);

/**
 * A code as it is stored and compared: lower case, trimmed, nothing outside the
 * alphabet. Returns null for anything that could not be one of ours, so a
 * hand-edited URL is rejected before it reaches a query.
 */
export function normaliseReferralCode(raw: string | undefined | null): string | null {
  const code = (raw ?? "").trim().toLowerCase();
  if (code.length !== CODE_LENGTH) return null;
  return [...code].every((char) => CODE_ALPHABET.includes(char)) ? code : null;
}

/** The link a user shares. Absolute — it is pasted into other applications. */
export const referralLink = (code: string, origin: string): string =>
  `${origin.replace(/\/$/, "")}/ref/${code}`;

/**
 * This account's referral code, minting one if it has none.
 *
 * Lazy rather than backfilled, so accounts that predate the programme get a
 * code the first time they open the Hub instead of needing a data migration.
 * The unique index is the collision check — `findFirst` then `create` would be
 * a read-then-write race between two accounts minting at once.
 */
export async function ensureReferralCode(userId: number): Promise<string> {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });
  if (existing?.referralCode) return existing.referralCode;

  const ATTEMPTS = 5;
  for (let attempt = 1; ; attempt++) {
    const code = nextCode();
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { referralCode: code },
        select: { referralCode: true },
      });
      return user.referralCode!;
    } catch (error) {
      const taken =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002";
      if (!taken || attempt === ATTEMPTS) throw error;
      // 31^8 is wide enough that reaching here twice means something other than
      // luck, but the retry costs nothing and the alternative is a failed load.
    }
  }
}

/** The account a code belongs to, or null. Codes are matched exactly. */
export async function referrerByCode(
  rawCode: string | undefined | null,
): Promise<number | null> {
  const code = normaliseReferralCode(rawCode);
  if (!code) return null;

  const owner = await prisma.user.findUnique({
    where: { referralCode: code },
    select: { id: true },
  });
  return owner?.id ?? null;
}

/** Prisma's transaction client — the only thing the award below accepts. */
type Tx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

type Award = { tier: number; earnerId: number; amountUsd: Prisma.Decimal };

/**
 * Pays every tier owed on one purchase.
 *
 * Runs inside the purchase's own transaction, so a commission and the sale that
 * created it either both exist or neither does. There is no webhook retrying
 * this the way NOWPayments retries a deposit, so awarding it afterwards would
 * lose the commission outright on any failure — atomicity is the only thing
 * that converges here.
 *
 * Every write follows the rule the rest of the system is built on: a balance
 * only moves alongside the ledger entry that explains it.
 */
export async function awardReferralCommissions(
  tx: Tx,
  purchase: { id: number; buyerId: number; priceUsd: Prisma.Decimal },
): Promise<void> {
  const awards = await plan(tx, purchase);
  if (awards.length === 0) return;

  const earners = await tx.user.findMany({
    where: { id: { in: awards.map((award) => award.earnerId) } },
    select: { id: true, notifyReferrals: true },
  });
  const notifies = new Map(earners.map((e) => [e.id, e.notifyReferrals]));

  for (const award of awards) {
    await tx.referralCommission.create({
      data: {
        earnerId: award.earnerId,
        sourceUserId: purchase.buyerId,
        purchaseId: purchase.id,
        tier: award.tier,
        rateBps: REFERRAL_TIERS[award.tier - 1].rateBps,
        amountUsd: award.amountUsd,
      },
    });

    // The tier belongs in `refId` because the unique key is `(kind, refId)`:
    // without it the second tier of a purchase would collide with the first and
    // silently go unpaid.
    await tx.ledgerEntry.create({
      data: {
        userId: award.earnerId,
        amountUsd: award.amountUsd,
        kind: "referral",
        refId: `${purchase.id}:${award.tier}`,
      },
    });

    await tx.user.update({
      where: { id: award.earnerId },
      data: { balanceUsd: { increment: award.amountUsd } },
    });

    if (notifies.get(award.earnerId)) {
      await tx.notification.create({
        data: {
          userId: award.earnerId,
          kind: "SYSTEM",
          title: "Referral commission earned",
          body: `$${award.amountUsd.toFixed(2)} was added to your balance from a ${
            award.tier === 1 ? "direct" : "second-tier"
          } referral's purchase.`,
        },
      });
    }
  }
}

/**
 * Who is owed what, before anything is written.
 *
 * The chain is read one link at a time rather than through a recursive query:
 * it is two levels deep by definition, and a self-join that could be asked for
 * more is a way to get more than two.
 */
async function plan(
  tx: Tx,
  purchase: { buyerId: number; priceUsd: Prisma.Decimal },
): Promise<Award[]> {
  const buyer = await tx.user.findUnique({
    where: { id: purchase.buyerId },
    select: { referredById: true },
  });
  if (!buyer?.referredById) return [];

  const chain: number[] = [];
  let next: number | null = buyer.referredById;

  while (chain.length < REFERRAL_TIERS.length) {
    // Signup-time attribution makes a cycle impossible — a referrer necessarily
    // predates the account naming them. Checked anyway, because the cost of
    // being wrong is an account paying itself commission on its own spending.
    if (next === null || next === purchase.buyerId || chain.includes(next)) break;

    chain.push(next);
    const above: { referredById: number | null } | null = await tx.user.findUnique({
      where: { id: next },
      select: { referredById: true },
    });
    next = above?.referredById ?? null;
  }

  return chain
    .map((earnerId, index) => ({
      tier: REFERRAL_TIERS[index].tier,
      earnerId,
      // Down, never up: the programme must not pay out more than the rate says.
      amountUsd: purchase.priceUsd
        .mul(REFERRAL_TIERS[index].rateBps)
        .div(10_000)
        .toDecimalPlaces(2, Prisma.Decimal.ROUND_DOWN),
    }))
    .filter((award) => award.amountUsd.greaterThan(0));
}

/** A month bucket in the earnings chart. */
export type EarningsPoint = { label: string; value: number };

/** How many months the Hub's earnings chart covers. */
export const EARNINGS_MONTHS = 12;

/**
 * The first instant of each month in the window, oldest first, in UTC.
 *
 * Built forwards from the window start rather than by subtracting months from
 * today, so a run on the 31st cannot produce a short February and a duplicate
 * March.
 */
export function monthStarts(months: number, now = new Date()): Date[] {
  const first = new Date(now);
  first.setUTCDate(1);
  first.setUTCHours(0, 0, 0, 0);
  first.setUTCMonth(first.getUTCMonth() - (months - 1));

  return Array.from({ length: months }, (_, index) => {
    const start = new Date(first);
    start.setUTCMonth(first.getUTCMonth() + index);
    return start;
  });
}
