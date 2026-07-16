import {
  Activity,
  Bell,
  Braces,
  Briefcase,
  ChartNoAxesColumn,
  Headset,
  Users,
  type LucideIcon,
} from "lucide-react";

export type PlanId = "starter" | "growth" | "elite";
export type Billing = "monthly" | "annual";

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  monthly: number;
  signalsPerDay: string;
  badge?: string;
  features: { icon: LucideIcon; label: string }[];
};

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "For individuals getting started with automated signals.",
    monthly: 29,
    signalsPerDay: "up to 10 signals per day",
    features: [
      { icon: Activity, label: "Up to 10 signals / day" },
      { icon: Briefcase, label: "1 active position" },
      { icon: Bell, label: "Email alerts" },
      { icon: ChartNoAxesColumn, label: "Basic analytics" },
      { icon: Users, label: "Community support" },
    ],
  },
  {
    id: "growth",
    name: "Growth",
    tagline: "For active traders scaling their portfolio performance.",
    monthly: 79,
    signalsPerDay: "up to 50 signals per day",
    badge: "Most Popular",
    features: [
      { icon: Activity, label: "Up to 50 signals / day" },
      { icon: Briefcase, label: "5 active positions" },
      { icon: Bell, label: "SMS & email alerts" },
      { icon: ChartNoAxesColumn, label: "Advanced analytics" },
      { icon: Users, label: "Referral rewards" },
      { icon: Headset, label: "Priority support" },
    ],
  },
  {
    id: "elite",
    name: "Elite",
    tagline: "For professionals running high-frequency strategies.",
    monthly: 199,
    signalsPerDay: "unlimited signals",
    badge: "Pro",
    features: [
      { icon: Activity, label: "Unlimited signals" },
      { icon: Briefcase, label: "Unlimited positions" },
      { icon: Bell, label: "Priority alert routing" },
      { icon: ChartNoAxesColumn, label: "Full analytics suite" },
      { icon: Users, label: "Dedicated account manager" },
      { icon: Braces, label: "API access" },
    ],
  },
];

export const COMPARISON: {
  feature: string;
  values: [string | boolean, string | boolean, string | boolean];
}[] = [
  { feature: "Daily signals", values: ["10", "50", "Unlimited"] },
  { feature: "Active positions", values: ["1", "5", "Unlimited"] },
  { feature: "Alert channels", values: ["Email", "SMS + Email", "All channels"] },
  { feature: "Analytics", values: ["Basic", "Advanced", "Full suite"] },
  { feature: "API access", values: [false, false, true] },
  { feature: "Account manager", values: [false, false, true] },
];

export const ANNUAL_DISCOUNT = 0.2;
export const TRIAL_DAYS = 3;

/** Effective monthly rate after the annual discount. */
export const monthlyRate = (plan: Plan, billing: Billing) =>
  billing === "annual" ? plan.monthly * (1 - ANNUAL_DISCOUNT) : plan.monthly;

/** Credit covering the trial days of the first month. */
export const trialCredit = (plan: Plan, billing: Billing) =>
  Math.round((monthlyRate(plan, billing) * TRIAL_DAYS * 100) / 31) / 100;

export const nextBillingDate = () =>
  new Date(Date.now() + TRIAL_DAYS * 86_400_000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
