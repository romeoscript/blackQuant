import { z } from "zod";

/**
 * Shape the profile screen renders. Dates are ISO strings because a server
 * action cannot return a `Date` to a client component.
 */
export type Profile = {
  name: string | null;
  email: string;
  username: string | null;
  phone: string | null;
  country: string | null;
  currency: string;
  /** Null when the account has no picture and the initials stand in. */
  avatarUrl: string | null;
  /**
   * Whether that picture is one the user uploaded. False for an OAuth
   * provider's avatar, which is theirs to change, not ours to delete.
   */
  avatarUploaded: boolean;
  memberSince: string;
  /** Null means the password has never been changed since signup. */
  passwordChangedAt: string | null;
  preferences: Record<NotificationPreferenceKey, boolean>;
};

/**
 * The notification toggles, in render order. One list so a preference cannot
 * exist in the database without a label, or be shown without somewhere to save.
 * Keys are `User` columns.
 */
export const NOTIFICATION_PREFERENCES = [
  { key: "notifySignals", label: "Signal alerts via email" },
  { key: "notifyPositions", label: "Position updates" },
  { key: "notifyWithdrawals", label: "Withdrawal confirmations" },
  { key: "notifyReferrals", label: "Referral activity" },
] as const;

export type NotificationPreferenceKey =
  (typeof NOTIFICATION_PREFERENCES)[number]["key"];

const PREFERENCE_KEYS = NOTIFICATION_PREFERENCES.map((p) => p.key);

export const notificationPreferenceKeySchema = z.enum(
  PREFERENCE_KEYS as unknown as [NotificationPreferenceKey, ...NotificationPreferenceKey[]],
);

/** Currencies the account can be denominated in. */
export const CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CHF",
  "AUD",
  "CAD",
  "SGD",
] as const;

/**
 * Trimmed, and empty strings become null so clearing a field clears the column
 * rather than storing "".
 */
const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((v) => v || null);

export const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80, "Name is too long"),
  username: z
    .string()
    .trim()
    // Stored bare so the display "@" cannot end up in the unique index twice.
    .transform((v) => v.replace(/^@/, ""))
    .refine((v) => v.length <= 30, "Username is too long")
    .refine(
      (v) => /^[a-zA-Z0-9_]*$/.test(v),
      "Username can only contain letters, numbers and underscores",
    )
    .transform((v) => v || null),
  phone: optionalText(30, "Phone number is too long"),
  country: optionalText(60, "Country is too long"),
  currency: z.enum(CURRENCIES),
});
