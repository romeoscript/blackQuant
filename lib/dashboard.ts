/**
 * Windows the Control Center's activity chart can show.
 *
 * Labelled in days rather than "Weekly / All time": the chart draws one bar per
 * day over a fixed window, and a tab claiming "all time" while showing a
 * truncated window is the kind of small lie this screen exists to avoid.
 */
export const ACTIVITY_RANGES = [
  { id: "7d", label: "7 days", days: 7 },
  { id: "30d", label: "30 days", days: 30 },
  { id: "90d", label: "90 days", days: 90 },
] as const;

export type ActivityRange = (typeof ACTIVITY_RANGES)[number]["id"];

export const DEFAULT_ACTIVITY_RANGE: ActivityRange = "7d";

/** Unknown ids fall back rather than throw — the id crosses from the client. */
export const activityDays = (range: string): number =>
  ACTIVITY_RANGES.find((r) => r.id === range)?.days ??
  ACTIVITY_RANGES[0].days;

export type ActivityDay = {
  /** Calendar day as `YYYY-MM-DD`, in UTC. A key, never a display value. */
  date: string;
  /** Net movement that day, signed. Credits positive, spend negative. */
  netUsd: number;
};
