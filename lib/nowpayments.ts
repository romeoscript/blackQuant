import { z } from "zod";
import { env } from "@/lib/env";

/**
 * The slice of the NOWPayments REST API this app uses. One `fetch` per call and
 * no SDK, matching how `lib/mail.ts` talks to Resend.
 *
 * Field names here are the vendor's and have moved between versions — check
 * them against the live reference before a deploy that touches money.
 */

export const isDepositsConfigured = () => Boolean(env.NOWPAYMENTS_API_KEY);

async function np<T>(path: string, init?: RequestInit): Promise<T> {
  if (!env.NOWPAYMENTS_API_KEY || !env.NOWPAYMENTS_BASE_URL) {
    throw new Error("NOWPayments is not configured");
  }

  const response = await fetch(`${env.NOWPAYMENTS_BASE_URL}${path}`, {
    ...init,
    headers: {
      "x-api-key": env.NOWPAYMENTS_API_KEY,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    // Money endpoints are never served from a cache.
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `NOWPayments ${path} failed (${response.status}): ${await response.text()}`,
    );
  }
  return response.json() as Promise<T>;
}

/** Smallest deposit the network will accept for this asset. */
export async function minimumAmount(currency: string): Promise<number> {
  const { min_amount } = await np<{ min_amount: string | number }>(
    `/v1/min-amount?currency_from=${currency}&currency_to=${currency}`,
  );
  return Number(min_amount);
}

export type NpPayment = {
  payment_id: string | number;
  pay_address: string;
  payin_extra_id?: string | null;
};

/**
 * Mints a payment and, with it, the address the user deposits to.
 *
 * NOWPayments only generates addresses in the context of a payment, so one is
 * created just above the network minimum and the address it returns is kept as
 * the user's permanent address for that chain. Later deposits of any size are
 * recognised as overpayments against it and still credited.
 *
 * That last sentence is the load-bearing vendor assumption in this whole
 * design — if an address ever stops accepting top-ups after its original
 * invoice settles, `DepositAddress` has to become per-deposit instead of
 * per-user. Confirm it in the sandbox before launch.
 */
export async function createPayment(params: {
  currency: string;
  amount: number;
  orderId: string;
  description: string;
  callbackUrl: string;
}): Promise<NpPayment> {
  return np<NpPayment>("/v1/payment", {
    method: "POST",
    body: JSON.stringify({
      price_amount: params.amount,
      price_currency: params.currency,
      pay_currency: params.currency,
      order_id: params.orderId,
      order_description: params.description,
      ipn_callback_url: params.callbackUrl,
      is_fixed_rate: false,
      is_fee_paid_by_user: false,
    }),
  });
}

/**
 * The callback body, parsed at the boundary rather than read field by field.
 *
 * Every other external input in this app is parsed with zod before it is
 * trusted; this one is the most hostile of them, since a POST here decides
 * whether a balance goes up.
 *
 * Amounts and counts fall back rather than reject: a callback carrying a
 * malformed amount should still be *recorded* — with nothing credited, because
 * zero never passes the credit check — so a human has the raw payload to look
 * at. Only the two fields that identify the deposit are mandatory, because
 * without them there is nothing to record it against.
 */
const numeric = z
  .union([z.string(), z.number()])
  .nullish()
  .transform((v) => (v === null || v === undefined || v === "" ? "0" : String(v)))
  .transform((v) => (/^-?\d+(\.\d+)?$/.test(v) ? v : "0"));

const optionalText = z
  .union([z.string(), z.number()])
  .nullish()
  .transform((v) =>
    v === null || v === undefined || v === "" ? null : String(v),
  );

export const ipnPayloadSchema = z.object({
  payment_id: z.union([z.string(), z.number()]).transform(String),
  pay_address: z.string().min(1),
  payment_status: z.string().default(""),
  /** Destination tag on shared-address chains; absent everywhere else. */
  payin_extra_id: optionalText,
  actually_paid: numeric,
  outcome_amount: numeric,
  outcome_currency: optionalText,
  payin_hash: optionalText,
  confirmations: z.coerce.number().int().min(0).catch(0).default(0),
});

export type IpnPayload = z.infer<typeof ipnPayloadSchema>;
