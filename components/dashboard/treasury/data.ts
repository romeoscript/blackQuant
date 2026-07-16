export type Asset = {
  symbol: string;
  name: string;
  holdings: string;
  value: number;
  change: number;
  allocation: number;
  color: string;
};

export const ASSETS: Asset[] = [
  { symbol: "BTC", name: "Bitcoin", holdings: "0.01842", value: 1142.3, change: 3.24, allocation: 76, color: "#f7931a" },
  { symbol: "ETH", name: "Ethereum", holdings: "0.8410", value: 218.5, change: 1.87, allocation: 14, color: "#627eea" },
  { symbol: "USDT", name: "Tether", holdings: "105.20", value: 105.2, change: 0.0, allocation: 7, color: "#26a17b" },
  { symbol: "BNB", name: "BNB", holdings: "0.2100", value: 39.0, change: -0.62, allocation: 3, color: "#f3ba2f" },
];

export const TOTAL_PORTFOLIO = 1505;

export type StatIcon = "balance" | "withdraw" | "deposit" | "withdrawn";

export const STATS: { label: string; value: string; note: string; icon: StatIcon; accent?: boolean }[] = [
  { label: "Total Balance", value: "$1,505.00", note: "+$500 this month", icon: "balance" },
  { label: "Available to Withdraw", value: "$1,330.00", note: "After reserves", icon: "withdraw" },
  { label: "Total Deposited", value: "$1,700.00", note: "All time", icon: "deposit" },
  { label: "Total Withdrawn", value: "$195.00", note: "All time", icon: "withdrawn", accent: true },
];

export const TRENDS = [
  { symbol: "BTC", change: 3.2, color: "#f7931a", points: [6, 5, 7, 6, 8, 7, 9] },
  { symbol: "ETH", change: 1.9, color: "#627eea", points: [4, 5, 4, 6, 5, 6, 7] },
];

// Monthly portfolio value across the trailing 12 months.
export const BALANCE_HISTORY = [
  { month: "Jan", value: 640 },
  { month: "Feb", value: 610 },
  { month: "Mar", value: 720 },
  { month: "Apr", value: 690 },
  { month: "May", value: 810 },
  { month: "Jun", value: 850 },
  { month: "Jul", value: 970 },
  { month: "Aug", value: 1030 },
  { month: "Sep", value: 1180 },
  { month: "Oct", value: 1240 },
  { month: "Nov", value: 1380 },
  { month: "Dec", value: 1505 },
];

export type Transaction = {
  type: "Deposit" | "Withdrawal";
  asset: string;
  amount: string;
  usd: string;
  date: string;
  status: "Completed" | "Pending";
  incoming: boolean;
};

export const TRANSACTIONS: Transaction[] = [
  { type: "Deposit", asset: "BTC", amount: "+0.01842 BTC", usd: "+$1,142.30", date: "Jun 15, 2026", status: "Completed", incoming: true },
  { type: "Withdrawal", asset: "ETH", amount: "-0.2500 ETH", usd: "-$64.88", date: "Jun 12, 2026", status: "Completed", incoming: false },
  { type: "Deposit", asset: "USDT", amount: "+200.00 USDT", usd: "+$200.00", date: "Jun 08, 2026", status: "Completed", incoming: true },
  { type: "Withdrawal", asset: "BNB", amount: "-0.1000 BNB", usd: "-$18.57", date: "Jun 03, 2026", status: "Pending", incoming: false },
  { type: "Deposit", asset: "BTC", amount: "+0.00950 BTC", usd: "+$589.10", date: "May 28, 2026", status: "Completed", incoming: true },
];

export type PopularAsset = { symbol: string; name: string; price: string; change: number; color: string };

export const POPULAR_ASSETS: PopularAsset[] = [
  { symbol: "SOL", name: "Solana", price: "$148.20", change: 4.1, color: "#9945ff" },
  { symbol: "ADA", name: "Cardano", price: "$0.44", change: 1.5, color: "#0033ad" },
  { symbol: "DOGE", name: "Dogecoin", price: "$0.11", change: -2.3, color: "#c2a633" },
  { symbol: "MATIC", name: "Polygon", price: "$0.56", change: 0.8, color: "#8247e5" },
];
