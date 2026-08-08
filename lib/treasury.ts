/**
 * Windows the balance history can be drawn over.
 *
 * Anything longer than a month is bucketed by month — 365 daily points in a
 * card this size is noise, not detail.
 */
export const BALANCE_RANGES = [
  { id: "1M", label: "1M", days: 30 },
  { id: "6M", label: "6M", days: 183 },
  { id: "12M", label: "12M", days: 365 },
] as const;

export type BalanceRange = (typeof BALANCE_RANGES)[number]["id"];

export const DEFAULT_BALANCE_RANGE: BalanceRange = "12M";

/** Unknown ids fall back rather than throw — the id crosses from the client. */
export const balanceRangeDays = (range: string): number =>
  BALANCE_RANGES.find((r) => r.id === range)?.days ??
  BALANCE_RANGES[BALANCE_RANGES.length - 1].days;

export const bucketsByMonth = (days: number) => days > 31;

export type BalancePoint = {
  /** Bucket label for the axis: a weekday-less date, or a month name. */
  label: string;
  /** Balance at the close of that bucket, not the movement within it. */
  balanceUsd: number;
};

export type AssetDeposits = {
  symbol: string;
  name: string;
  color: string;
  /** Crypto actually received, summed. */
  amount: string;
  /** Dollars credited for it. */
  usdCredited: string;
  /** Share of all dollars credited, 0–100. */
  share: number;
};
