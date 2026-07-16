export type Plan = {
  name: string;
  blurb: string;
  monthly: number;
  annual: number;
  features: string[];
  featured?: boolean;
  badge?: string;
};

export const PLANS: Plan[] = [
  {
    name: "Starter",
    blurb: "For individuals getting started with automated signals.",
    monthly: 29,
    annual: 23,
    features: ["Up to 10 signals/day", "1 active position", "Email alerts", "Basic analytics"],
  },
  {
    name: "Growth",
    blurb: "For active traders scaling their portfolio performance.",
    monthly: 79,
    annual: 63,
    features: [
      "Up to 50 signals/day",
      "5 active positions",
      "SMS & email alerts",
      "Advanced analytics",
      "Referral rewards",
    ],
    featured: true,
    badge: "Most Popular",
  },
  {
    name: "Elite",
    blurb: "For professionals and teams running high-frequency strategies.",
    monthly: 199,
    annual: 159,
    features: [
      "Unlimited signals",
      "Unlimited positions",
      "Priority alert routing",
      "Full analytics suite",
      "Dedicated account manager",
      "API access",
    ],
    badge: "Pro",
  },
];

export type SignalStatus = "Active" | "Closed" | "Pending";

export const RECENT_SIGNALS: {
  type: "BUY" | "SELL";
  pair: string;
  entry: string;
  tpsl: string;
  status: SignalStatus;
}[] = [
  { type: "BUY", pair: "BTC/USDT", entry: "$62,400", tpsl: "$64,800 / $61,200", status: "Active" },
  { type: "SELL", pair: "ETH/USDT", entry: "$3,180", tpsl: "$3,050 / $3,240", status: "Closed" },
  { type: "BUY", pair: "SOL/USDT", entry: "$148.20", tpsl: "$158.00 / $143.00", status: "Active" },
  { type: "SELL", pair: "BNB/USDT", entry: "$412.50", tpsl: "$395.00 / $420.00", status: "Pending" },
];

// Win rate per month; color tier: >=80 mint, >=60 white, else dim.
export const SUCCESS_RATE = [
  { label: "J", value: 58 },
  { label: "F", value: 64 },
  { label: "M", value: 55 },
  { label: "A", value: 72 },
  { label: "M", value: 68 },
  { label: "J", value: 82 },
  { label: "J", value: 70 },
  { label: "A", value: 66 },
  { label: "S", value: 84 },
  { label: "O", value: 88 },
  { label: "N", value: 74 },
  { label: "D", value: 90 },
];

export const SIGNAL_DETAIL = {
  name: "Momentum",
  desc: "Multi-timeframe EMA crossover with volume confirmation",
  stats: [
    { label: "Total Signals", value: "142", accent: false },
    { label: "Win Rate", value: "72%", accent: true },
    { label: "Avg. Confidence", value: "84.6%", accent: true },
    { label: "Avg. / Hr", value: "5.9", accent: false },
  ],
  trend: [72, 70, 74, 73, 77, 76, 80, 79, 83, 82, 85].map((value, i) => ({
    label: String(i),
    value,
  })),
  byPair: [
    { pair: "BTC/USDT", pct: 76, color: "#f7931a" },
    { pair: "ETH/USDT", pct: 71, color: "#627eea" },
    { pair: "SOL/USDT", pct: 75, color: "#9945ff" },
    { pair: "BNB/USDT", pct: 64, color: "#f3ba2f" },
    { pair: "AVAX/USDT", pct: 62, color: "#e84142" },
  ],
  recent: [
    { time: "11:58:32", pair: "BTC/USDT", dir: "BUY", entry: "$64,850", tp: "$66,400", sl: "$63,900", status: "Active" },
    { time: "11:53:18", pair: "SOL/USDT", dir: "BUY", entry: "$143.10", tp: "$149.00", sl: "$140.50", status: "Active" },
    { time: "11:15:07", pair: "BTC/USDT", dir: "BUY", entry: "$63,900", tp: "$65,500", sl: "$63,100", status: "TP Hit" },
    { time: "11:40:11", pair: "ETH/USDT", dir: "BUY", entry: "$3,010", tp: "$3,090", sl: "$2,975", status: "TP Hit" },
    { time: "11:25:45", pair: "BNB/USDT", dir: "BUY", entry: "$415.50", tp: "$424.00", sl: "$410.00", status: "TP Hit" },
    { time: "10:58:20", pair: "BTC/USDT", dir: "SELL", entry: "$63,400", tp: "$61,900", sl: "$64,200", status: "SL Hit" },
  ] as { time: string; pair: string; dir: "BUY" | "SELL"; entry: string; tp: string; sl: string; status: "Active" | "TP Hit" | "SL Hit" }[],
};
