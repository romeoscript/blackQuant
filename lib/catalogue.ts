/**
 * Everything an account can buy, in one place.
 *
 * Prices live here and nowhere else, so a purchase can take an id and look the
 * amount up on the server — one that trusted an amount from the browser would
 * let anyone name their own.
 *
 * Two surfaces sell from it. Signal plans are the subscription tiers; store
 * items are the add-ons sold beside the deposit flow. They are separate
 * products at separate prices, and they share only the way they are paid for.
 *
 * A subscription lapses after `days`; an add-on has no expiry and is owned once
 * bought. That absence is what makes an item permanent.
 */

type BaseItem = {
  id: string;
  name: string;
  detail: string;
  priceUsd: number;
  /** Present on subscriptions only. */
  days?: number;
  popular?: boolean;
};

export type CatalogueItem =
  | (BaseItem & {
      surface: "store";
      icon: "cpu" | "chart" | "headset" | "briefcase" | "shield";
      period?: string;
    })
  | (BaseItem & {
      surface: "plan";
      tier: string;
      period: "Monthly" | "Annual";
      features: string[];
      badge?: string;
    });

/**
 * Annual tiers are billed once for the year at the discounted monthly rate —
 * the saving is the reason to pick one, so it is charged as a single term
 * rather than a cheaper recurring price we have no machinery to recur.
 */
export const CATALOGUE: readonly CatalogueItem[] = [
  {
    id: "plan-starter-monthly",
    surface: "plan",
    tier: "Starter",
    name: "Starter",
    period: "Monthly",
    detail: "For individuals getting started with automated signals.",
    priceUsd: 29,
    days: 30,
    features: ["Up to 10 signals/day", "1 active position", "Email alerts", "Basic analytics"],
  },
  {
    id: "plan-starter-annual",
    surface: "plan",
    tier: "Starter",
    name: "Starter",
    period: "Annual",
    detail: "For individuals getting started with automated signals.",
    priceUsd: 276,
    days: 365,
    features: ["Up to 10 signals/day", "1 active position", "Email alerts", "Basic analytics"],
  },
  {
    id: "plan-growth-monthly",
    surface: "plan",
    tier: "Growth",
    name: "Growth",
    period: "Monthly",
    detail: "For active traders scaling their portfolio performance.",
    priceUsd: 79,
    days: 30,
    popular: true,
    badge: "Most Popular",
    features: [
      "Up to 50 signals/day",
      "5 active positions",
      "SMS & email alerts",
      "Advanced analytics",
      "Referral rewards",
    ],
  },
  {
    id: "plan-growth-annual",
    surface: "plan",
    tier: "Growth",
    name: "Growth",
    period: "Annual",
    detail: "For active traders scaling their portfolio performance.",
    priceUsd: 756,
    days: 365,
    popular: true,
    badge: "Most Popular",
    features: [
      "Up to 50 signals/day",
      "5 active positions",
      "SMS & email alerts",
      "Advanced analytics",
      "Referral rewards",
    ],
  },
  {
    id: "plan-elite-monthly",
    surface: "plan",
    tier: "Elite",
    name: "Elite",
    period: "Monthly",
    detail: "For professionals and teams running high-frequency strategies.",
    priceUsd: 199,
    days: 30,
    badge: "Pro",
    features: [
      "Unlimited signals",
      "Unlimited positions",
      "Priority alert routing",
      "Full analytics suite",
      "Dedicated account manager",
      "API access",
    ],
  },
  {
    id: "plan-elite-annual",
    surface: "plan",
    tier: "Elite",
    name: "Elite",
    period: "Annual",
    detail: "For professionals and teams running high-frequency strategies.",
    priceUsd: 1908,
    days: 365,
    badge: "Pro",
    features: [
      "Unlimited signals",
      "Unlimited positions",
      "Priority alert routing",
      "Full analytics suite",
      "Dedicated account manager",
      "API access",
    ],
  },

  {
    id: "signal-pro-monthly",
    surface: "store",
    name: "Signal Pro",
    period: "Monthly",
    detail: "Automated signals, rebalanced daily",
    priceUsd: 500,
    icon: "cpu",
    days: 30,
    popular: true,
  },
  {
    id: "signal-pro-annual",
    surface: "store",
    name: "Signal Pro",
    period: "Annual",
    detail: "Two months free against the monthly price",
    priceUsd: 4800,
    icon: "cpu",
    days: 365,
  },
  {
    id: "vip-analytics",
    surface: "store",
    name: "VIP Analytics Pack",
    detail: "Attribution and drawdown reporting",
    priceUsd: 200,
    icon: "chart",
  },
  {
    id: "priority-support",
    surface: "store",
    name: "Priority Support",
    detail: "Four-hour response, around the clock",
    priceUsd: 150,
    icon: "headset",
  },
  {
    id: "extra-position-slot",
    surface: "store",
    name: "Extra Positions Slot",
    detail: "One more concurrent position",
    priceUsd: 100,
    icon: "briefcase",
  },
  {
    id: "risk-guard",
    surface: "store",
    name: "Risk Guard Add-on",
    detail: "Automatic stop-out at your drawdown limit",
    priceUsd: 250,
    icon: "shield",
  },
];

/** Unknown ids resolve to undefined — the id crosses from the client. */
export const catalogueItem = (id: string): CatalogueItem | undefined =>
  CATALOGUE.find((item) => item.id === id);

export type StoreItem = Extract<CatalogueItem, { surface: "store" }>;
export type PlanItem = Extract<CatalogueItem, { surface: "plan" }>;

const isStoreItem = (item: CatalogueItem): item is StoreItem =>
  item.surface === "store";
const isPlanItem = (item: CatalogueItem): item is PlanItem =>
  item.surface === "plan";

export const STORE_ITEMS = CATALOGUE.filter(isStoreItem);
export const PLAN_ITEMS = CATALOGUE.filter(isPlanItem);

export const isSubscription = (item: CatalogueItem): boolean =>
  item.days !== undefined;

/**
 * An account holds at most one plan at a time, so buying a second is refused
 * rather than silently stacking. Upgrades and proration are not built.
 */
export const isPlan = (id: string): boolean =>
  catalogueItem(id)?.surface === "plan";

/** What the user already has, and therefore what they cannot buy again. */
export type Entitlement = {
  itemId: string;
  /** Null for an add-on, which never lapses. */
  expiresAt: string | null;
};
