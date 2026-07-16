export type DepositAsset = {
  symbol: string;
  name: string;
  network: string;
  networkName: string;
  color: string;
  address: string;
  minDeposit: string;
  confirmations: string;
  fee: string;
  arrival: string;
};

export const DEPOSIT_ASSETS: DepositAsset[] = [
  { symbol: "BTC", name: "Bitcoin", network: "Bitcoin", networkName: "Bitcoin Network", color: "#f7931a", address: "1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P", minDeposit: "0.0001 BTC", confirmations: "6 blocks", fee: "~$1.20", arrival: "~10 mins" },
  { symbol: "ETH", name: "Ethereum", network: "ERC-20", networkName: "Ethereum Network", color: "#627eea", address: "0x9f8E7d6C5b4A39281706F5e4D3c2B1a0918273Fa", minDeposit: "0.005 ETH", confirmations: "12 blocks", fee: "~$0.80", arrival: "~4 mins" },
  { symbol: "USDT", name: "Tether", network: "TRC-20", networkName: "Tron Network", color: "#26a17b", address: "TXk8s2Qw3mHf9L1pR7vNc5jB4dGz6yUaE0", minDeposit: "1 USDT", confirmations: "20 blocks", fee: "~$0.10", arrival: "~3 mins" },
  { symbol: "BNB", name: "BNB", network: "BEP-20", networkName: "BNB Smart Chain", color: "#f3ba2f", address: "bnb1q8w7e6r5t4y3u2i1o0p9a8s7d6f5g4h3j2k1l", minDeposit: "0.01 BNB", confirmations: "15 blocks", fee: "~$0.05", arrival: "~2 mins" },
  { symbol: "SOL", name: "Solana", network: "Solana", networkName: "Solana Network", color: "#9945ff", address: "5Gv8tQm2xWnYr7Kc4JhPb9dLf3sAz6uE1oViT0qHkX8N", minDeposit: "0.05 SOL", confirmations: "32 slots", fee: "~$0.01", arrival: "~1 min" },
  { symbol: "XRP", name: "XRP", network: "XRP Ledger", networkName: "XRP Ledger", color: "#00aae4", address: "rP4x9wK2mQz7vT5cJ8bYh3nLf6dGs1aEu0", minDeposit: "10 XRP", confirmations: "1 ledger", fee: "~$0.02", arrival: "~1 min" },
  { symbol: "ADA", name: "Cardano", network: "Cardano", networkName: "Cardano Network", color: "#0d92d6", address: "addr1q9x8w7v6u5t4s3r2q1p0o9n8m7l6k5j4h3g2f1e0d", minDeposit: "5 ADA", confirmations: "15 blocks", fee: "~$0.15", arrival: "~5 mins" },
  { symbol: "DOT", name: "Polkadot", network: "Polkadot", networkName: "Polkadot Network", color: "#e6007a", address: "14Kw9pS3rV7mXc2yQ8bJh5nLf4dGz6uEa1oT0iHk", minDeposit: "1 DOT", confirmations: "2 blocks", fee: "~$0.08", arrival: "~2 mins" },
];

export type RecentDeposit = {
  symbol: string;
  color: string;
  amount: string;
  usd: string;
  credited: string;
  date: string;
  conf: string;
};

export const RECENT_DEPOSITS: RecentDeposit[] = [
  { symbol: "BTC", color: "#f7931a", amount: "+0.01842 BTC", usd: "$1,142.30", credited: "+1,142 ARB", date: "Jun 15, 2026", conf: "6/6 conf." },
  { symbol: "USDT", color: "#26a17b", amount: "+200.00 USDT", usd: "$200.00", credited: "+200 ARB", date: "Jun 08, 2026", conf: "12/12 conf." },
  { symbol: "SOL", color: "#9945ff", amount: "+4.20 SOL", usd: "$622.44", credited: "+622 ARB", date: "Jun 01, 2026", conf: "32/32 conf." },
];

export const STORE_BALANCE = 1964.3;

export type StoreItem = { name: string; price: number; icon: "cpu" | "chart" | "headset" | "briefcase" | "shield"; popular?: boolean };

export const STORE_ITEMS: StoreItem[] = [
  { name: "Signal Pro — Monthly", price: 500, icon: "cpu", popular: true },
  { name: "Signal Pro — Annual", price: 4800, icon: "cpu" },
  { name: "VIP Analytics Pack", price: 200, icon: "chart" },
  { name: "Priority Support", price: 150, icon: "headset" },
  { name: "Extra Positions Slot", price: 100, icon: "briefcase" },
  { name: "Risk Guard Add-on", price: 250, icon: "shield" },
];
