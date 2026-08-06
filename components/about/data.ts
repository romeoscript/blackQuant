import {
  Activity,
  BookOpen,
  ChartNoAxesColumn,
  Clock,
  Eye,
  Headset,
  Layers,
  Link,
  Shield,
  TrendingUp,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

export const ABOUT_STATS = [
  { value: "14,800+", label: "Active Traders", delta: "+34% YoY" },
  { value: "$2.4B+", label: "Volume Traded", delta: "+$900M in 2024" },
  { value: "98.7%", label: "Signal Uptime", delta: "Last 365 days" },
  { value: "4", label: "Live Strategies", delta: "More launching 2025" },
] as const;

export const MISSION = {
  headline:
    "To democratise systematic trading — making institutional-grade signal intelligence accessible, transparent, and affordable for every independent trader on the planet.",
  body: "Quant infrastructure — latency-grade data feeds, backtesting engines, rule-based signal systems — has always been locked behind institutional budgets. BlackQuant closes that gap. We wrap everything into a single control centre so independent traders execute with the same rigour as the institutions they trade against.",
} as const;

export const PLATFORM_SNAPSHOT: readonly {
  icon: LucideIcon;
  label: string;
  value: string;
}[] = [
  { icon: Layers, label: "Live strategies", value: "4" },
  { icon: TrendingUp, label: "Avg. win rate", value: "68–73%" },
  { icon: Shield, label: "Signal confidence min", value: "62%" },
  { icon: Clock, label: "Backtest window", value: "14 days" },
  { icon: Link, label: "Supported pairs", value: "8 pairs" },
  { icon: Activity, label: "Uptime SLA", value: "98.7%" },
];

export const CORE_VALUES: readonly {
  icon: LucideIcon;
  title: string;
  body: string;
  stat: string;
  statLabel: string;
}[] = [
  {
    icon: Eye,
    title: "Transparent by Default",
    body: "Every signal decision is logged. No black boxes. You see exactly what the engine is doing and why at every step.",
    stat: "100%",
    statLabel: "signal decisions logged",
  },
  {
    icon: Zap,
    title: "Speed Without Noise",
    body: "Millisecond-grade signal delivery. We built the infrastructure so you capture windows that other platforms miss by seconds.",
    stat: "<50ms",
    statLabel: "avg. signal delivery",
  },
  {
    icon: ChartNoAxesColumn,
    title: "Data Over Intuition",
    body: "Every strategy is backtested across 14+ days before it reaches your feed. Probability in. Guesswork out.",
    stat: "14-day",
    statLabel: "minimum backtest window",
  },
  {
    icon: Users,
    title: "Built for Traders",
    body: "Every feature originated from friction in a real trading workflow — not a product roadmap deck or a boardroom assumption.",
    stat: "100%",
    statLabel: "trader-driven feature requests",
  },
];

/** `current` drives the filled timeline dot and the green year + title. */
export const JOURNEY: readonly {
  year: string;
  title: string;
  body: string;
  current?: boolean;
}[] = [
  {
    year: "2020",
    title: "Founded",
    body: "Incorporated in Singapore. Core quant team of 4 begins building the signal engine from scratch.",
  },
  {
    year: "2021",
    title: "First Strategy Live",
    body: "Momentum goes live. 200 early adopters. Win rate holds above 65% over 6 months.",
  },
  {
    year: "2022",
    title: "Series A · $8M",
    body: "RSI Divergence and Breakout launch. 3,000 active users. Platform expands to 18 countries.",
  },
  {
    year: "2023",
    title: "Global Expansion",
    body: "MACD Cross and Support Bounce ship. Treasury and Positions released. 47 countries, 7,000+ users.",
  },
  {
    year: "2024",
    title: "Enterprise Tier",
    body: "Institutional licensing launches. $1B volume milestone crossed. 10,000+ active traders.",
  },
  {
    year: "2025",
    title: "Today",
    body: "14,800 traders. 4 live strategies. $2.4B volume. BlackQuant Control Center is the flagship product.",
    current: true,
  },
];

export const ABOUT_FAQ = [
  {
    question: "Who is BlackQuant for?",
    answer:
      "Independent retail traders who want to trade systematically — without building and maintaining quant infrastructure themselves. Our tools give you institutional-grade signal logic at a fraction of the cost.",
  },
  {
    question: "How are signals generated?",
    answer:
      "Each strategy is a rule-based engine: it evaluates market data, applies technical conditions (EMAs, RSI levels, support zones, breakout patterns), filters by volume and trend alignment, and fires when confidence crosses the configured threshold. No AI guesswork — pure rules.",
  },
  {
    question: "Is my data safe?",
    answer:
      "Yes. We never trade on your behalf unless you explicitly connect an exchange API. Signal data is encrypted at rest and in transit. Your credentials are never stored in plaintext.",
  },
  {
    question: "What markets and pairs does BlackQuant support?",
    answer:
      "Currently crypto spot pairs — BTC, ETH, SOL, ADA, BNB, AVAX, LINK, MATIC. Forex and equity derivatives are on the 2025 roadmap.",
  },
] as const;

export const CONTACT_ACTIONS: readonly {
  icon: LucideIcon;
  /** Rendered only from `sm` up, so mobile gets the design's shorter label. */
  prefix: string;
  label: string;
  href: string;
  primary?: boolean;
}[] = [
  {
    icon: BookOpen,
    prefix: "Browse ",
    label: "Knowledge Base",
    href: "/dashboard/knowledge",
  },
  {
    icon: Headset,
    prefix: "Open ",
    label: "Help Desk",
    href: "/dashboard/help",
    primary: true,
  },
];
