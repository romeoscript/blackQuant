import type { LucideIcon } from "lucide-react";
import {
  Zap,
  Sprout,
  Lock,
  ShieldCheck,
  Globe,
  BadgeCheck,
} from "lucide-react";

export const NAV_LINKS = [
  { label: "Infrastructure", target: "infrastructure" },
  { label: "Features", target: "features" },
  { label: "Security", target: "security" },
  { label: "Community", target: "community" },
  { label: "About Us", target: "about" },
] as const;

export const HERO_STATS = [
  { value: "$2.4B+", label: "Volume Processed" },
  { value: "98.7%", label: "Uptime" },
  { value: "40K+", label: "Active Wallets" },
  { value: "1.8%", label: "Peak Daily Yield" },
] as const;

// Partner / ecosystem logos. `w`/`h` are the files' intrinsic pixel sizes
// (all wordmarks normalized to 270px tall) so next/image keeps aspect ratio
// while the strip renders them at a fixed display height.
export const PARTNERS = [
  { src: "/logos/1.webp", w: 459, h: 270 },
  { src: "/logos/5.webp", w: 1941, h: 270 },
  { src: "/logos/4.webp", w: 285, h: 270 },
  { src: "/logos/3.webp", w: 1272, h: 270 },
  { src: "/logos/8.webp", w: 258, h: 270 },
  { src: "/logos/6.webp", w: 873, h: 270 },
  { src: "/logos/10.webp", w: 255, h: 270 },
  { src: "/logos/9.webp", w: 1485, h: 270 },
  { src: "/logos/19.webp", w: 264, h: 270 },
  { src: "/logos/12.webp", w: 1851, h: 270 },
  { src: "/logos/15.webp", w: 684, h: 270 },
  { src: "/logos/2.webp", w: 693, h: 270 },
  { src: "/logos/13.webp", w: 1092, h: 270 },
  { src: "/logos/7.webp", w: 789, h: 270 },
  { src: "/logos/14.webp", w: 1368, h: 270 },
  { src: "/logos/11.webp", w: 930, h: 270 },
  { src: "/logos/16.webp", w: 1851, h: 270 },
  { src: "/logos/20.webp", w: 1503, h: 270 },
  { src: "/logos/18.webp", w: 1524, h: 270 },
  { src: "/logos/17.webp", w: 1869, h: 270 },
  { src: "/logos/1.png", w: 500, h: 374 },
  { src: "/logos/2.png", w: 1039, h: 184 },
] as const;

export const INFRA_TAGS = [
  "HFT System",
  "Distributed Infrastructure",
  "Blockchain Engine",
  "Quant Trading",
  "Low-Latency Stack",
] as const;

export type TradeRow = {
  pair: string;
  route: string;
  type: "Type A" | "Type B";
  latency: string;
  profit: string;
  active?: boolean;
};

export const NEXUS_TRADES: TradeRow[] = [
  { pair: "ETH/USDC", route: "3-hop · Uni→Sushi→Curve", type: "Type B", latency: "241ms", profit: "+$24.3" },
  { pair: "WBTC/ETH", route: "Cross-chain · Arb→ETH", type: "Type A", latency: "189ms", profit: "+$11.7" },
  { pair: "ARB/USDT", route: "Statistical · GMX→Camel", type: "Type B", latency: "312ms", profit: "+$8.1" },
  { pair: "SOL/USDC", route: "Liquidity shift detected", type: "Type A", latency: "98ms", profit: "+$6.4", active: true },
  { pair: "OP/USDT", route: "Multi-hop · 4 exchanges", type: "Type B", latency: "204ms", profit: "+$14.9" },
];

export type Pool = { name: string; apy: string; profit: string; allocation: number };

export const ARBOR_POOLS: Pool[] = [
  { name: "USDC-ETH LP", apy: "14.2% APY", profit: "+$421", allocation: 38 },
  { name: "WBTC-USDC LP", apy: "9.8% APY", profit: "+$287", allocation: 32 },
  { name: "ARB-USDC LP", apy: "22.1% APY", profit: "+$334", allocation: 30 },
];

export const ARBOR_LOG = [
  { time: "4h ago", text: "Compound cycle complete · +$1,042" },
  { time: "8h ago", text: "ARB-USDC rebalanced · APY ↑ 22.1%" },
  { time: "12h ago", text: "Compound cycle complete · +$988" },
] as const;

export type Feature = {
  index: string;
  kicker: string;
  accent: "green" | "blue";
  title: string;
  body: string;
  bullets: string[];
  meta: string;
};

export const FEATURES: Feature[] = [
  {
    index: "01",
    kicker: "Non-Custodial",
    accent: "green",
    title: "Your Capital, Your Control",
    body: "BlackQuant never holds your funds. Capital flows: wallet → bot → market → profit → back to your wallet. Fully on-chain, fully verifiable.",
    bullets: ["Zero custodial access", "On-chain verifiable every trade", "Instant profit routing to your wallet"],
    meta: "Your Capital, Your Control",
  },
  {
    index: "02",
    kicker: "Infrastructure-First",
    accent: "blue",
    title: "Institutional-Grade MEV Access",
    body: "HFT-style MEV — complex multi-hop routes, cross-chain inefficiencies, statistical anomalies — detected before most platforms can even react.",
    bullets: ["Multi-hop route detection", "Cross-chain inefficiency capture", "Sub-5ms execution latency"],
    meta: "Institutional-Grade MEV Access",
  },
  {
    index: "03",
    kicker: "Transparency",
    accent: "green",
    title: "A Transparent Execution Network",
    body: "Non-custodial MEV execution. Every trade is on-chain and auditable. No black boxes, no hidden fees. 4 independent audits confirm it.",
    bullets: ["4 independent smart contract audits", "847K+ on-chain verifiable trades", "Zero custodial events ever"],
    meta: "A Transparent Execution Network",
  },
  {
    index: "04",
    kicker: "AI-Optimized",
    accent: "blue",
    title: "Low-Latency Arbitrage Infrastructure",
    body: "AI-optimized routing and quantitative models across 6 distributed node clusters, 99.97% uptime SLA, sub-5ms average latency, 7 AI models running simultaneously.",
    bullets: ["6 global node clusters", "99.97% uptime SLA", "7 AI quantitative models active"],
    meta: "Low-Latency Arbitrage Infrastructure",
  },
];

export const TRUST_METRICS = [
  { value: "0", label: "Custodial Events" },
  { value: "847K+", label: "On-Chain Trades" },
  { value: "4", label: "Audit Firms" },
  { value: "99.97%", label: "Uptime SLA" },
] as const;

export const TRUST_CARDS: { index: string; icon: LucideIcon; title: string; body: string }[] = [
  { index: "01", icon: Lock, title: "Non-Custodial by Design", body: "Smart contracts are immutable. BlackQuant has zero access to your principal or profits — ever." },
  { index: "02", icon: ShieldCheck, title: "Audited Contracts", body: "Core contracts audited by Trail of Bits, Certik, OpenZeppelin, and Hacken. All reports publicly available." },
  { index: "03", icon: BadgeCheck, title: "MEV Protection", body: "Private mempool routing prevents front-running of your on-chain transactions across all networks." },
  { index: "04", icon: Globe, title: "Distributed Infrastructure", body: "5 regional node clusters · 99.97% uptime SLA · automatic failover across ETH, ARB, BASE, SOL." },
];

export const AUDITS = [
  { firm: "Trail of Bits", score: "98/100" },
  { firm: "Certik", score: "96/100" },
  { firm: "OpenZeppelin", score: "99/100" },
  { firm: "Hacken", score: "97/100" },
] as const;

export const LIVE_METRICS = [
  { label: "Executions Processed", value: "1,842" },
  { label: "Available Liquidity Sources", value: "14" },
  { label: "Node clusters", value: "5" },
  { label: "Avg latency", value: "4ms" },
] as const;

export const DEX_POOLS = ["Sushiswap", "Uniswap", "Balancer", "Pancakeswap"] as const;

export const BOT_ICONS = { nexus: Zap, arbor: Sprout } as const;

export const CTA_STATS = [
  { value: "$2.4B+", label: "Volume Processed" },
  { value: "40K+", label: "Active Wallets" },
  { value: "1.8%", label: "Peak Yield" },
  { value: "99.97%", label: "Uptime SLA" },
] as const;

export const FOOTER_COLUMNS = [
  { heading: "Product", links: ["Dashboard", "Nexus Bot", "Arbor Bot", "Portfolio", "Analytics"] },
  { heading: "Developers", links: ["Documentation", "API Reference", "SDK", "GitHub", "Changelog"] },
  { heading: "Security", links: ["Audit Reports", "Bug Bounty", "Smart Contracts", "Non-Custodial Proof", "Uptime Status"] },
  { heading: "Company", links: ["About", "Blog", "Careers", "Press Kit", "Contact"] },
  { heading: "Community", links: ["Twitter / X", "Discord", "Telegram", "LinkedIn", "Mirror"] },
] as const;

export const CHAINS = ["ETH", "ARB", "BASE", "SOL"] as const;
