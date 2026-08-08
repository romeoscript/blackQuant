/**
 * The store catalogue.
 *
 * Prices live here and nowhere else. The client sends an item id and never a
 * price — a purchase that trusted an amount from the browser would let anyone
 * name their own.
 *
 * A subscription lapses after `days`; an add-on has no expiry and is owned once
 * bought. That distinction is what decides whether an item can be bought again.
 */
export type StoreItem = {
  id: string;
  name: string;
  /** Shown beside the name for items sold as a term. */
  period?: string;
  detail: string;
  priceUsd: number;
  icon: "cpu" | "chart" | "headset" | "briefcase" | "shield";
  /** Present on subscriptions only; its absence is what makes an item an add-on. */
  days?: number;
  popular?: boolean;
};

export const STORE_ITEMS: readonly StoreItem[] = [
  {
    id: "signal-pro-monthly",
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
    name: "Signal Pro",
    period: "Annual",
    detail: "Two months free against the monthly price",
    priceUsd: 4800,
    icon: "cpu",
    days: 365,
  },
  {
    id: "vip-analytics",
    name: "VIP Analytics Pack",
    detail: "Attribution and drawdown reporting",
    priceUsd: 200,
    icon: "chart",
  },
  {
    id: "priority-support",
    name: "Priority Support",
    detail: "Four-hour response, around the clock",
    priceUsd: 150,
    icon: "headset",
  },
  {
    id: "extra-position-slot",
    name: "Extra Positions Slot",
    detail: "One more concurrent position",
    priceUsd: 100,
    icon: "briefcase",
  },
  {
    id: "risk-guard",
    name: "Risk Guard Add-on",
    detail: "Automatic stop-out at your drawdown limit",
    priceUsd: 250,
    icon: "shield",
  },
];


/** Unknown ids resolve to undefined — the id crosses from the client. */
export const storeItem = (id: string): StoreItem | undefined =>
  STORE_ITEMS.find((item) => item.id === id);

export const isSubscription = (item: StoreItem): boolean =>
  item.days !== undefined;

/** What the user already has, and therefore what they cannot buy again. */
export type StoreEntitlement = {
  itemId: string;
  /** Null for an add-on, which never lapses. */
  expiresAt: string | null;
};
