export type PosStat = {
  label: string;
  value: string;
  note: string;
  icon: "open" | "capital" | "pnl" | "win";
  accent?: boolean;
};

export const POS_STATS: PosStat[] = [
  { label: "Open Positions", value: "4", note: "2 closed this week", icon: "open" },
  { label: "Total Capital", value: "$3,650", note: "Across all positions", icon: "capital" },
  { label: "Unrealised P&L", value: "+$106.42", note: "+2.9% overall", icon: "pnl", accent: true },
  { label: "Win Rate", value: "66.7%", note: "4 of 6 profitable", icon: "win", accent: true },
];

export const EQUITY = [3650, 3620, 3680, 3712, 3690, 3735, 3702, 3748, 3722, 3756].map(
  (value, i) => ({ label: String(i), value }),
);

export const EQUITY_SUMMARY = {
  starting: "$3,650.00",
  current: "$3,756.42",
  change: "+$106.42",
  changePct: "2.9%",
};

export const PNL_BY_PAIR = {
  segments: [
    { label: "BTC", pct: 37, color: "#00e5aa" },
    { label: "ETH", pct: 25, color: "#ffffff" },
    { label: "AVAX", pct: 33, color: "#f3ba2f" },
    { label: "Other", pct: 5, color: "#555555" },
  ],
  net: "+$106.42",
};

export type Position = {
  pair: string;
  id: string;
  type: "BUY" | "SELL";
  capital: string;
  entry: string;
  current: string;
  pnl: string;
  pnlPct: string;
  gain: boolean;
  status: "Active" | "At Risk" | "Closed";
};

export const POSITIONS: Position[] = [
  { pair: "BTC/USDT", id: "POS-001", type: "BUY", capital: "$1,200.00", entry: "$62,400", current: "$64,850", pnl: "+$49.20", pnlPct: "+4.1%", gain: true, status: "Active" },
  { pair: "ETH/USDT", id: "POS-002", type: "SELL", capital: "$800.00", entry: "$3,180", current: "$3,050", pnl: "+$32.70", pnlPct: "+4.1%", gain: true, status: "Active" },
  { pair: "SOL/USDT", id: "POS-003", type: "BUY", capital: "$500.00", entry: "$148.20", current: "$143.10", pnl: "-$17.20", pnlPct: "-3.4%", gain: false, status: "At Risk" },
  { pair: "BNB/USDT", id: "POS-004", type: "BUY", capital: "$350.00", entry: "$412.50", current: "$418.00", pnl: "+$4.67", pnlPct: "+1.3%", gain: true, status: "Active" },
  { pair: "ADA/USDT", id: "POS-005", type: "SELL", capital: "$200.00", entry: "$0.58", current: "$0.60", pnl: "-$6.90", pnlPct: "-3.4%", gain: false, status: "Closed" },
  { pair: "AVAX/USDT", id: "POS-006", type: "BUY", capital: "$600.00", entry: "$38.40", current: "$41.20", pnl: "+$43.75", pnlPct: "+7.3%", gain: true, status: "Active" },
];
