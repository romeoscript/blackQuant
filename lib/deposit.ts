import type { DepositStatus } from "@prisma/client";
import type { Tone as StatPillTone } from "@/components/dashboard/widgets";

/**
 * The assets the deposit page offers, and the NOWPayments code each maps to.
 *
 * Network is fixed per asset rather than chosen by the user: sending an asset
 * over the wrong chain is the single largest cause of permanent loss on a
 * deposit page, and a picker invites exactly that.
 */
export const DEPOSIT_ASSETS = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    network: "Bitcoin",
    networkName: "Bitcoin Network",
    currency: "btc",
    color: "#f7931a",
    confirmations: 6,
    firstConfirmation: "~10 min",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    network: "ERC-20",
    networkName: "Ethereum Network",
    currency: "eth",
    color: "#627eea",
    confirmations: 12,
    firstConfirmation: "~1 min",
  },
  {
    symbol: "USDT",
    name: "Tether",
    network: "TRC-20",
    networkName: "Tron Network",
    currency: "usdttrc20",
    color: "#26a17b",
    confirmations: 20,
    firstConfirmation: "~1 min",
  },
  {
    symbol: "BNB",
    name: "BNB",
    network: "BEP-20",
    networkName: "BNB Smart Chain",
    currency: "bnbbsc",
    color: "#f3ba2f",
    confirmations: 15,
    firstConfirmation: "~5 sec",
  },
  {
    symbol: "SOL",
    name: "Solana",
    network: "Solana",
    networkName: "Solana Network",
    currency: "sol",
    color: "#9945ff",
    confirmations: 32,
    firstConfirmation: "~1 sec",
  },
  {
    symbol: "XRP",
    name: "XRP",
    network: "XRP Ledger",
    networkName: "XRP Ledger",
    currency: "xrp",
    color: "#00aae4",
    confirmations: 1,
    firstConfirmation: "~5 sec",
    /**
     * NOWPayments hands every user the same XRP address and tells them apart
     * by destination tag. A deposit sent without the tag arrives with nothing
     * identifying the sender and needs manual recovery, so the UI must treat
     * the tag as no less mandatory than the address.
     */
    sharedAddress: true,
  },
  {
    symbol: "ADA",
    name: "Cardano",
    network: "Cardano",
    networkName: "Cardano Network",
    currency: "ada",
    color: "#0d92d6",
    confirmations: 15,
    firstConfirmation: "~20 sec",
  },
  {
    symbol: "DOT",
    name: "Polkadot",
    network: "Polkadot",
    networkName: "Polkadot Network",
    currency: "dot",
    color: "#e6007a",
    confirmations: 2,
    firstConfirmation: "~6 sec",
  },
] as const satisfies readonly DepositAsset[];

/**
 * `confirmations` is how many the network needs before a deposit is credited,
 * and `firstConfirmation` is how long the *first* one takes — deliberately not
 * labelled as time-to-credit, which for BTC is six blocks and closer to an hour.
 */
type DepositAsset = {
  symbol: string;
  name: string;
  /** Short chip label. */
  network: string;
  /** Written out, for the "send only X over Y" line. */
  networkName: string;
  currency: string;
  color: string;
  confirmations: number;
  firstConfirmation: string;
  sharedAddress?: boolean;
};

export type DepositAssetInfo = (typeof DEPOSIT_ASSETS)[number];

export const depositAsset = (symbol: string) =>
  DEPOSIT_ASSETS.find((a) => a.symbol === symbol);

/** The reverse lookup, for turning a stored row back into something to render. */
export const assetByCurrency = (currency: string) =>
  DEPOSIT_ASSETS.find((a) => a.currency === currency);

/** NOWPayments payment_status → what we store. */
const STATUS_MAP: Record<string, DepositStatus> = {
  waiting: "WAITING",
  confirming: "CONFIRMING",
  confirmed: "CONFIRMING",
  sending: "CONFIRMING",
  finished: "CONFIRMED",
  partially_paid: "PARTIALLY_PAID",
  failed: "FAILED",
  refunded: "FAILED",
  expired: "EXPIRED",
};

/** Anything unrecognised is treated as a failure rather than silently dropped. */
export const depositStatus = (paymentStatus: string): DepositStatus =>
  STATUS_MAP[paymentStatus] ?? "FAILED";

/**
 * How far along a status is. Callbacks can arrive out of order — a `confirming`
 * retry after `finished` is normal — and a deposit must never appear to move
 * backwards once it has been credited.
 */
const RANK: Record<DepositStatus, number> = {
  WAITING: 0,
  CONFIRMING: 1,
  PARTIALLY_PAID: 2,
  EXPIRED: 3,
  FAILED: 3,
  CONFIRMED: 4,
};

export const furthestStatus = (
  a: DepositStatus,
  b: DepositStatus | undefined,
): DepositStatus => (b === undefined || RANK[a] >= RANK[b] ? a : b);

/**
 * Outcome currencies whose amount can be read as dollars.
 *
 * The account is configured to auto-convert incoming assets to a stablecoin, so
 * `outcome_amount` on a callback is dollar-denominated. If that setting is ever
 * off, the outcome is the asset itself — and crediting 0.0184 for a $1,142 BTC
 * deposit would be silent and wrong by four orders of magnitude. Everything not
 * on this list is held for review instead of credited.
 */
const USD_DENOMINATED = new Set([
  "usd",
  "usdt",
  "usdterc20",
  "usdttrc20",
  "usdtbsc",
  "usdtsol",
  "usdc",
  "usdcerc20",
  "usdcbase",
  "usdcsol",
  "dai",
]);

/**
 * How each status reads on the deposit list. A deposit is only money once it is
 * CONFIRMED; everything before that is reported as in-progress rather than as
 * an amount the user has.
 *
 * Tones are `StatPill`'s vocabulary so both deposit lists can render the badge
 * with the shared component instead of each keeping its own class map.
 */
export const DEPOSIT_STATUS_UI: Record<
  DepositStatus,
  { label: string; tone: StatPillTone; note?: string }
> = {
  WAITING: { label: "Detected", tone: "neutral", note: "Waiting for the network" },
  CONFIRMING: { label: "Confirming", tone: "amber" },
  CONFIRMED: { label: "Confirmed", tone: "green" },
  PARTIALLY_PAID: {
    label: "Underpaid",
    tone: "amber",
    note: "Less arrived than expected. Send the difference to the same address.",
  },
  FAILED: { label: "Failed", tone: "red", note: "Contact support with this deposit." },
  EXPIRED: { label: "Expired", tone: "red", note: "Contact support with this deposit." },
};

/** Nothing is settled until it is confirmed, so anything else keeps polling. */
export const isPendingStatus = (status: DepositStatus): boolean =>
  status === "WAITING" || status === "CONFIRMING";

export const isUsdDenominated = (currency: string | null | undefined): boolean =>
  currency !== null &&
  currency !== undefined &&
  USD_DENOMINATED.has(currency.toLowerCase());
