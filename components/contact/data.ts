import type { LucideIcon } from "lucide-react";
import { Handshake, Headset, Newspaper, ShieldAlert, Users } from "lucide-react";

/** Where the general contact form delivers. */
export const CONTACT_INBOX = "hello@blackquant.io";

/**
 * Form topics.
 *
 * Shared between the form's select and the server action's validation so the
 * two cannot drift — a topic added to the UI alone would be rejected on submit
 * with a message the user cannot act on.
 */
export const CONTACT_TOPICS = [
  "General enquiry",
  "Partnerships",
  "Institutional access",
  "Press",
  "Something else",
] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export type Channel = {
  icon: LucideIcon;
  title: string;
  body: string;
  action: { label: string; href: string };
  /** Response commitment. Stated because "we'll get back to you" means nothing. */
  sla: string;
};

/**
 * Direct routes that are better than the general form.
 *
 * A form that swallows an account problem or a vulnerability report is worse
 * than no form. Anything with a faster or more sensitive path is listed here
 * first, and the form is for everything left over.
 */
export const CHANNELS: Channel[] = [
  {
    icon: Headset,
    title: "Account & platform support",
    body: "Deposits, withdrawals, verification, or anything behaving unexpectedly in your account. The Help Desk has your account context; email does not.",
    action: { label: "Open the Help Desk", href: "/dashboard/help" },
    sla: "Typically under 4 hours",
  },
  {
    icon: ShieldAlert,
    title: "Security disclosure",
    body: "Found a vulnerability? Report it directly and privately. We do not pursue researchers acting in good faith, and we credit every valid report unless you would rather we didn't.",
    action: { label: "security@blackquant.io", href: "mailto:security@blackquant.io" },
    sla: "Acknowledged within 24 hours",
  },
  {
    icon: Newspaper,
    title: "Press & media",
    body: "Interviews, technical detail, or a figure you want checked before print. Logos and boilerplate are on the press kit — no need to ask.",
    action: { label: "Press kit", href: "/press" },
    sla: "One working day",
  },
  {
    icon: Users,
    title: "Careers",
    body: "Open roles, including a Fractional CEO, with compensation bands published on the listing. Speculative applications are read too.",
    action: { label: "Open roles", href: "/careers" },
    sla: "Every application answered",
  },
  {
    icon: Handshake,
    title: "Partnerships",
    body: "Market makers, custodians, liquidity venues and audit firms. Tell us what you route and we will tell you whether we are useful to each other.",
    action: { label: "partnerships@blackquant.io", href: "mailto:partnerships@blackquant.io" },
    sla: "Two working days",
  },
];
