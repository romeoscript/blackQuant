import type { LucideIcon } from "lucide-react";
import {
  Zap,
  Sprout,
  Lock,
  ShieldCheck,
  Globe,
  BadgeCheck,
} from "lucide-react";

/**
 * `target` links scroll to a landing-page section (and become `/#target` when
 * the nav is mounted on another route); `href` links navigate outright.
 */
export const NAV_LINKS = [
  { label: "Infrastructure", target: "infrastructure" },
  { label: "Features", target: "features" },
  { label: "Security", target: "security" },
  { label: "Community", target: "community" },
  { label: "About Us", href: "/about" },
] as const;

export const HERO_STATS = [
  { value: "$2.4B+", label: "Volume Processed" },
  { value: "98.7%", label: "Uptime" },
  { value: "40K+", label: "Active Wallets" },
  { value: "1.8%", label: "Peak Daily Yield" },
] as const;

/**
 * Named protocols for the mobile integrations strip. The marquee's logo files
 * carry no name metadata and there are twenty of them, so the design's
 * shortlist is its own list rather than a projection of PARTNERS.
 */
export const DEFI_PARTNERS = [
  "Uniswap",
  "Aave",
  "1inch",
  "Chainlink",
  "Lido",
  "Compound",
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
  {
    pair: "ETH/USDC",
    route: "3-hop · Uni→Sushi→Curve",
    type: "Type B",
    latency: "241ms",
    profit: "+$24.3",
  },
  {
    pair: "WBTC/ETH",
    route: "Cross-chain · Arb→ETH",
    type: "Type A",
    latency: "189ms",
    profit: "+$11.7",
  },
  {
    pair: "ARB/USDT",
    route: "Statistical · GMX→Camel",
    type: "Type B",
    latency: "312ms",
    profit: "+$8.1",
  },
  {
    pair: "SOL/USDC",
    route: "Liquidity shift detected",
    type: "Type A",
    latency: "98ms",
    profit: "+$6.4",
    active: true,
  },
  {
    pair: "OP/USDT",
    route: "Multi-hop · 4 exchanges",
    type: "Type B",
    latency: "204ms",
    profit: "+$14.9",
  },
];

export type Pool = {
  name: string;
  apy: string;
  profit: string;
  allocation: number;
};

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
    bullets: [
      "Zero custodial access",
      "On-chain verifiable every trade",
      "Instant profit routing to your wallet",
    ],
    meta: "Your Capital, Your Control",
  },
  {
    index: "02",
    kicker: "Infrastructure-First",
    accent: "blue",
    title: "Institutional-Grade MEV Access",
    body: "HFT-style MEV — complex multi-hop routes, cross-chain inefficiencies, statistical anomalies — detected before most platforms can even react.",
    bullets: [
      "Multi-hop route detection",
      "Cross-chain inefficiency capture",
      "Sub-5ms execution latency",
    ],
    meta: "Institutional-Grade MEV Access",
  },
  {
    index: "03",
    kicker: "Transparency",
    accent: "green",
    title: "A Transparent Execution Network",
    body: "Non-custodial MEV execution. Every trade is on-chain and auditable. No black boxes, no hidden fees. 4 independent audits confirm it.",
    bullets: [
      "4 independent smart contract audits",
      "847K+ on-chain verifiable trades",
      "Zero custodial events ever",
    ],
    meta: "A Transparent Execution Network",
  },
  {
    index: "04",
    kicker: "AI-Optimized",
    accent: "blue",
    title: "Low-Latency Arbitrage Infrastructure",
    body: "AI-optimized routing and quantitative models across 6 distributed node clusters, 99.97% uptime SLA, sub-5ms average latency, 7 AI models running simultaneously.",
    bullets: [
      "6 global node clusters",
      "99.97% uptime SLA",
      "7 AI quantitative models active",
    ],
    meta: "Low-Latency Arbitrage Infrastructure",
  },
];

export const TRUST_METRICS = [
  { value: "0", label: "Custodial Events" },
  { value: "847K+", label: "On-Chain Trades" },
  { value: "3", label: "Audit Firms" },
  { value: "99.97%", label: "Uptime SLA" },
] as const;

export const TRUST_CARDS: {
  index: string;
  icon: LucideIcon;
  title: string;
  body: string;
}[] = [
  {
    index: "01",
    icon: Lock,
    title: "Non-Custodial by Design",
    body: "Smart contracts are immutable. BlackQuant has zero access to your principal or profits — ever.",
  },
  {
    index: "02",
    icon: ShieldCheck,
    title: "Audited Contracts",
    body: "Core contracts audited by Trail of Bits, OpenZeppelin, and Hacken. All reports publicly available.",
  },
  {
    index: "03",
    icon: BadgeCheck,
    title: "MEV Protection",
    body: "Private mempool routing prevents front-running of your on-chain transactions across all networks.",
  },
  {
    index: "04",
    icon: Globe,
    title: "Distributed Infrastructure",
    body: "5 regional node clusters · 99.97% uptime SLA · automatic failover across ETH, ARB, BASE, SOL.",
  },
];

// `slug` keys into AUDIT_LOGOS for the firm's wordmark. It lives here rather
// than the logo module so this stays plain data: ./data is pulled into the
// client bundle by the landing page's client components, and the logo paths
// are only ever rendered on the server.
export const AUDITS = [
  { firm: "Trail of Bits", slug: "trail-of-bits", score: "98/100" },
  { firm: "OpenZeppelin", slug: "openzeppelin", score: "99/100" },
  { firm: "Hacken", slug: "hacken", score: "97/100" },
] as const;

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
};

/**
 * Placeholder copy: these people are invented. Swap in real quotes, with the
 * author's consent, before this ships — an invented endorsement on a financial
 * product is a regulatory problem, not just a copy one. The quotes only restate
 * claims the landing page already makes, so nothing here promises a return.
 */
export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "I've connected wallets to a lot of bots. This is the first one where I could trace every trade on-chain and watch the profit land back in my own wallet.",
    name: "Daniel Mercer",
    role: "DeFi fund analyst",
  },
  {
    quote:
      "The non-custodial part sold me. The bot has execution permission and nothing else — I revoked and re-granted it twice just to be sure.",
    name: "Priya Raman",
    role: "Independent trader",
  },
  {
    quote: "Setup took less time than reading the audit reports, and I read all three.",
    name: "Marcus Lindqvist",
    role: "Smart contract auditor",
  },
  {
    quote:
      "Latency is the whole game in MEV. Watching multi-hop routes fill in a couple hundred milliseconds told me the infrastructure is real.",
    name: "Tomás Herrera",
    role: "Quant developer",
  },
  {
    quote:
      "The clearest dashboard I've used. Allocation, pool APY, compound cycles — nothing hidden behind a vague 'strategy' label.",
    name: "Sofia Marchetti",
    role: "Portfolio manager",
  },
  {
    quote:
      "I run a small DAO treasury. Being able to show members an on-chain trail for every execution made the vote easy.",
    name: "Kenji Watanabe",
    role: "DAO treasury lead",
  },
  {
    quote:
      "Arbor quietly rebalances in the background. I read the log once a day and get on with my week.",
    name: "Hannah Cole",
    role: "Long-term holder",
  },
  {
    quote:
      "Private mempool routing was the feature I didn't know I needed until I stopped getting front-run.",
    name: "Samuel Park",
    role: "On-chain trader",
  },
  {
    quote: "Every other platform asked me to deposit first. BlackQuant never touches the principal, which is how it should be.",
    name: "Oliver Grant",
    role: "Crypto-native founder",
  },
  {
    quote: "Audited by three firms and the reports are public. That shouldn't be rare, but it is.",
    name: "Fatima Zahra",
    role: "Security engineer",
  },
  {
    quote: "Tools I used to only see inside trading desks, a wallet connection away.",
    name: "Ethan Brooks",
    role: "Former prop trader",
  },
  {
    quote:
      "Clean, fast, and honest about how it works. I've recommended it to half my trading group.",
    name: "Chloé Dubois",
    role: "Community moderator",
  },
  {
    quote:
      "Uptime has been boringly reliable, which is exactly what you want from execution infrastructure.",
    name: "Ravi Menon",
    role: "DevOps engineer",
  },
  {
    quote: "I came for the MEV access and stayed for the transparency. No black boxes.",
    name: "Grace Whitfield",
    role: "Retail investor",
  },
  {
    quote:
      "Cross-chain opportunities I'd only ever read about, executed from ETH to ARB without me babysitting a single transaction.",
    name: "Lucía Moreno",
    role: "Protocol researcher",
  },
];

export const LIVE_METRICS = [
  { label: "Executions Processed", value: "1,842" },
  { label: "Available Liquidity Sources", value: "14" },
  { label: "Node clusters", value: "5" },
  { label: "Avg latency", value: "4ms" },
] as const;

export const DEX_POOLS = [
  "Sushiswap",
  "Uniswap",
  "Balancer",
  "Pancakeswap",
] as const;

export const BOT_ICONS = { nexus: Zap, arbor: Sprout } as const;

export const CTA_STATS = [
  { value: "$2.4B+", label: "Volume Processed" },
  { value: "40K+", label: "Active Wallets" },
  { value: "1.8%", label: "Peak Yield" },
  { value: "99.97%", label: "Uptime SLA" },
] as const;

export const FOOTER_COLUMNS = [
  // { heading: "Product", links: ["Dashboard", "Nexus Bot", "Arbor Bot", "Portfolio", "Analytics"] },
  {
    heading: "Developers",
    links: ["Documentation", "API Reference", "GitHub", "Changelog"],
  },
  {
    heading: "Security",
    links: [
      "Audit Reports",
      "Smart Contracts",
      "Uptime Status",
    ],
  },
  {
    heading: "Company",
    links: ["About", "Blog", "Careers", "Press Kit", "Contact"],
  },
  {
    heading: "Community",
    links: ["Twitter / X", "Discord", "Telegram", "LinkedIn"],
  },
] as const;

/** Public repository holding the on-chain contracts, and the only code we publish. */
export const CONTRACTS_REPO =
  "https://github.com/Blackquant-labs/blackquant-contract";

/**
 * The published handbook. Written as markdown in this repo's `docs/`, and
 * deployed to Mintlify from `rempprandy/docs` — so the site is generated from
 * the source here rather than maintained beside it.
 */
const DOCS_URL = "https://docs.blackquantlabs.com";

/** Footer links that resolve to a real destination; everything else toasts. */
export const FOOTER_LINK_HREFS: Record<string, string | undefined> = {
  About: "/about",
  Blog: "/blog",
  Careers: "/careers",
  "Press Kit": "/press",
  Contact: "/contact",
  "Audit Reports": "/audits",
  Changelog: "/changelog",
  Documentation: DOCS_URL,
  // The generated OpenAPI reference, not a hand-written page — `/api-reference`
  // redirects to its first operation.
  "API Reference": `${DOCS_URL}/api-reference`,
  // Both point at the same repo: it is what "our GitHub" means today, and the
  // contracts are what a reader following the security column is looking for.
  GitHub: CONTRACTS_REPO,
  "Smart Contracts": CONTRACTS_REPO,
};

/** Footer legal row. A missing `href` has no page yet and toasts instead. */
export const LEGAL_LINKS: readonly { label: string; href?: string }[] = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Cookie Policy" },
];

export const CHAINS = ["ETH", "ARB", "BASE", "SOL"] as const;

/**
 * Height of the network diagram. Lives here rather than in network-flow.tsx so
 * the lazy wrapper can reserve the exact same box without statically importing
 * that module — which would pull @xyflow/react back into the eager bundle and
 * defeat the code split.
 */
export const NETWORK_FLOW_HEIGHT = "h-[360px] sm:h-[440px]";
