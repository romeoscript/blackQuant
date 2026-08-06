import type { LucideIcon } from "lucide-react";

export type LegalCard = { title: string; body: string };

/** A numbered/titled clause: either a single paragraph or a stack of sub-cards. */
export type LegalSection = { title: string; body?: string; cards?: LegalCard[] };

export type LegalDoc = {
  badge: { icon: LucideIcon; label: string };
  title: string;
  subtitle: string;
  updated: string;
  sections: LegalSection[];
  highlights: {
    heading: string;
    /** `warn` tints the cards red with amber icons; `positive` uses the brand green. */
    tone: "warn" | "positive";
    cards: (LegalCard & { icon: LucideIcon })[];
  };
  faq: { heading: string; items: { question: string; answer: string }[] };
  cta: { title: string; body: string; emailLabel: string; email: string };
};
