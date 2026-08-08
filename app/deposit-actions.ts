"use server";

import { Prisma, type DepositStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { env } from "@/lib/env";
import { qrSvg } from "@/lib/qr";
import { rateLimit, type Limit } from "@/lib/rate-limit";
import { assetByCurrency, depositAsset } from "@/lib/deposit";
import {
  createPayment,
  isDepositsConfigured,
  minimumAmount,
} from "@/lib/nowpayments";

export type DepositAddressView = {
  address: string;
  /** Destination tag. Non-null only on shared-address chains — see XRP. */
  extraId: string | null;
  currency: string;
  /** Rendered on the server so the address is never drawn by a third party. */
  qrSvg: string;
  /** Smallest accepted deposit, when NOWPayments told us at provisioning time. */
  minAmount: string | null;
};

export type DepositAddressResult =
  | ({ ok: true } & DepositAddressView)
  | { ok: false; message: string };

/**
 * Minting an address is an upstream API call, so it is capped per user. Eight
 * assets is eight legitimate calls; ten an hour leaves room to retry without
 * letting a click-happy tab burn the quota.
 */
const PROVISION_LIMIT: Limit = { windowMs: 60 * 60_000, max: 10 };

async function currentUserId(): Promise<number | null> {
  const session = await auth();
  const id = Number(session?.user?.id);
  return Number.isInteger(id) ? id : null;
}

type AddressRow = {
  address: string;
  extraId: string | null;
  currency: string;
  minAmount: Prisma.Decimal | null;
};

/**
 * The QR encodes the address alone. Deliberately not a `ripple:` style URI with
 * the tag embedded: wallet support for those is uneven, and a wallet that
 * ignores the tag silently produces exactly the unattributable deposit the tag
 * exists to prevent. The tag is shown as its own copyable field instead.
 */
const view = (row: AddressRow): DepositAddressView => ({
  address: row.address,
  extraId: row.extraId,
  currency: row.currency,
  qrSvg: qrSvg(row.address),
  minAmount: row.minAmount?.toString() ?? null,
});

/**
 * The user's deposit address for one asset, minting it on first request.
 *
 * Get-or-create keyed on `(userId, currency)`: the address is permanent, so a
 * user who saved it in their wallet's address book keeps a working one.
 */
export async function getDepositAddress(
  symbol: string,
): Promise<DepositAddressResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, message: "Your session has expired." };

  const asset = depositAsset(symbol);
  if (!asset) return { ok: false, message: "That asset isn't supported." };

  const existing = await prisma.depositAddress.findUnique({
    where: { userId_currency: { userId, currency: asset.currency } },
    select: { address: true, extraId: true, currency: true, minAmount: true },
  });
  if (existing) return { ok: true, ...view(existing) };

  if (!isDepositsConfigured()) {
    return {
      ok: false,
      message: "Crypto deposits aren't available yet. Please check back soon.",
    };
  }

  const limit = rateLimit(`deposit-address:${userId}`, PROVISION_LIMIT);
  if (!limit.ok) {
    return {
      ok: false,
      message: "Too many requests. Wait a minute and try again.",
    };
  }

  try {
    const minimum = await minimumAmount(asset.currency);
    const payment = await createPayment({
      currency: asset.currency,
      // Just above the minimum, so the address is usable rather than tied to
      // an amount the user is likely to exceed.
      amount: minimum * 1.05,
      orderId: `${userId}:${asset.currency}`,
      description: `BlackQuant account funding (${asset.symbol})`,
      callbackUrl: `${env.AUTH_URL ?? "http://localhost:3000"}/api/deposit/ipn`,
    });

    const row = await prisma.depositAddress.create({
      data: {
        userId,
        currency: asset.currency,
        address: payment.pay_address,
        extraId: payment.payin_extra_id ?? null,
        npPaymentId: String(payment.payment_id),
        minAmount: new Prisma.Decimal(minimum),
      },
      select: { address: true, extraId: true, currency: true, minAmount: true },
    });
    return { ok: true, ...view(row) };
  } catch (error) {
    // Two tabs asking at once: the loser reads the winner's row rather than
    // reporting a failure for an address that now exists.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const row = await prisma.depositAddress.findUnique({
        where: { userId_currency: { userId, currency: asset.currency } },
        select: { address: true, extraId: true, currency: true, minAmount: true },
      });
      if (row) return { ok: true, ...view(row) };
    }

    console.error("[deposit:provision]", error);
    return {
      ok: false,
      message: "We couldn't create your deposit address. Please try again.",
    };
  }
}

export type DepositView = {
  id: number;
  symbol: string;
  color: string;
  /** Crypto received, trimmed of trailing zeros. */
  payAmount: string;
  usdCredited: string;
  status: DepositStatus;
  confirmations: number;
  requiredConfirmations: number;
  createdAt: string;
};

/**
 * The user's recent deposits, straight from `DepositEvent`.
 *
 * There is no optimistic path into this list: a deposit exists here because a
 * signed callback said so, which is the only thing that makes one real.
 */
export async function listDeposits(): Promise<DepositView[]> {
  const userId = await currentUserId();
  if (!userId) return [];

  const rows = await prisma.depositEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      currency: true,
      payAmount: true,
      usdCredited: true,
      status: true,
      confirmations: true,
      createdAt: true,
    },
  });

  return rows.map((row) => {
    const asset = assetByCurrency(row.currency);
    return {
      id: row.id,
      symbol: asset?.symbol ?? row.currency.toUpperCase(),
      color: asset?.color ?? "#8b93a7",
      // `toString` rather than a fixed precision: chains differ by orders of
      // magnitude, and 0.00001842 BTC must not render as 0.00.
      payAmount: row.payAmount.toString(),
      usdCredited: row.usdCredited.toFixed(2),
      status: row.status,
      confirmations: row.confirmations,
      requiredConfirmations: asset?.confirmations ?? 0,
      createdAt: row.createdAt.toISOString(),
    };
  });
}
