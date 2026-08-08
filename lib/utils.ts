import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DATE = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/** The one date format the app shows: "08 Aug 2026". */
export const formatDate = (value: string | Date): string =>
  DATE.format(typeof value === "string" ? new Date(value) : value);

const RELATIVE = new Intl.RelativeTimeFormat("en-GB", { numeric: "auto" });

/**
 * Reads a `YYYY-MM-DD` key as that calendar day in the viewer's timezone.
 *
 * `new Date("2026-08-08")` is midnight *UTC*, which formats as the 7th for
 * anyone behind UTC — so labelling a UTC-keyed bucket that way shifts every
 * weekday by one west of Greenwich. Building the date from its parts keeps the
 * label on the day the key names.
 */
export function plainDate(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Each step is how many of that unit fit in the next one up. */
const DIVISIONS: { per: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { per: 60, unit: "second" },
  { per: 60, unit: "minute" },
  { per: 24, unit: "hour" },
  { per: 7, unit: "day" },
  { per: 4.34524, unit: "week" },
  { per: 12, unit: "month" },
  { per: Number.POSITIVE_INFINITY, unit: "year" },
];

/**
 * "3 minutes ago" for activity feeds, where the gap matters more than the
 * timestamp. Call it from a client component only: it reads the current time,
 * so rendering it on the server produces a hydration mismatch a second later.
 */
export function timeAgo(iso: string): string {
  let elapsed = (Date.now() - new Date(iso).getTime()) / 1000;
  if (elapsed < 45) return "Just now";

  for (const { per, unit } of DIVISIONS) {
    if (Math.abs(elapsed) < per) return RELATIVE.format(-Math.round(elapsed), unit);
    elapsed /= per;
  }
  return RELATIVE.format(-Math.round(elapsed), "year");
}

/** A file size a person can read, for upload limits and picked-file chips. */
export function humanBytes(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
