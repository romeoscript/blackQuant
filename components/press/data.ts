/**
 * Press kit content.
 *
 * The boilerplate is here verbatim so a journalist can copy it rather than
 * paraphrase from marketing copy — a paraphrase is how "non-custodial
 * execution infrastructure" becomes "crypto trading bot" in print.
 */

export const PRESS_INBOX = "press@blackquant.io";

/** Kept to a single sentence, because this is the one that gets used. */
export const BOILERPLATE_SHORT =
  "BlackQuant builds non-custodial execution infrastructure for on-chain markets, giving independent traders the latency and routing that institutional desks take for granted.";

export const BOILERPLATE_LONG =
  "BlackQuant is a non-custodial execution platform for on-chain markets. It routes trades through distributed infrastructure to capture arbitrage and MEV opportunities that depend on sub-five-millisecond execution — the kind of edge that has historically required an institutional desk. Because the platform is non-custodial, users retain their own keys throughout: BlackQuant is granted permission to execute specific routes and never to withdraw. Every trade settles on-chain and is independently verifiable. The company was founded in 2026 and its core contracts have been audited by Trail of Bits, OpenZeppelin and Hacken.";

export type Fact = { label: string; value: string };

export const FACTS: Fact[] = [
  { label: "Founded", value: "2026" },
  { label: "Headquarters", value: "Singapore" },
  { label: "Category", value: "Non-custodial execution infrastructure" },
  { label: "Networks", value: "Ethereum · Arbitrum · Base · Solana" },
  { label: "Independent audits", value: "3 — Trail of Bits, OpenZeppelin, Hacken" },
  { label: "Custodial events", value: "Zero, by design" },
];

export type BrandAsset = {
  name: string;
  description: string;
  href: string;
  /** Rendered behind the preview so a light mark is visible on a light theme. */
  preview: "mint" | "black" | "white";
  kind: "logomark" | "wordmark";
};

export const BRAND_ASSETS: BrandAsset[] = [
  {
    name: "Logomark — mint",
    description: "Primary mark. Use on dark or light backgrounds.",
    href: "/press/blackquant-logomark-mint.svg",
    preview: "mint",
    kind: "logomark",
  },
  {
    name: "Logomark — black",
    description: "Monochrome, for light backgrounds and print.",
    href: "/press/blackquant-logomark-black.svg",
    preview: "black",
    kind: "logomark",
  },
  {
    name: "Logomark — white",
    description: "Monochrome, for dark backgrounds and photography.",
    href: "/press/blackquant-logomark-white.svg",
    preview: "white",
    kind: "logomark",
  },
  {
    name: "Wordmark — dark text",
    description: "Horizontal lockup for light backgrounds.",
    href: "/press/blackquant-wordmark-mint.svg",
    preview: "black",
    kind: "wordmark",
  },
  {
    name: "Wordmark — light text",
    description: "Horizontal lockup for dark backgrounds.",
    href: "/press/blackquant-wordmark-white.svg",
    preview: "white",
    kind: "wordmark",
  },
];

export type BrandColor = { name: string; hex: string; use: string };

export const BRAND_COLORS: BrandColor[] = [
  { name: "Mint", hex: "#00E5AA", use: "The mark. Accent only — never body text." },
  { name: "Signal green", hex: "#4ADE80", use: "Live states and positive figures." },
  { name: "Ink", hex: "#080808", use: "Primary background." },
  { name: "Panel", hex: "#030303", use: "Recessed surfaces." },
  { name: "Paper", hex: "#F6F6F7", use: "Light-theme background." },
];

export const USAGE_RULES = {
  do: [
    "Use the supplied SVGs; they scale to any size without softening",
    "Keep clear space around the mark equal to the height of the ring",
    "Use the monochrome variants when colour would clash with surrounding material",
    "Write the name as one word, capital B and Q: BlackQuant",
  ],
  dont: [
    "Recolour, rotate, stretch or add effects to the mark",
    "Set the wordmark in a different typeface, or re-letter it",
    "Place the mint mark on a background that drops it below 3:1 contrast",
    "Write Blackquant, Black Quant, BLACKQUANT or BQ in running text",
  ],
} as const;

/** The wordmark's typeface, stated so a designer can reproduce a lockup. */
export const TYPEFACE = {
  name: "Satoshi",
  weight: "Bold (700)",
  note: "Tracking is tightened slightly at display sizes. IBM Plex Mono is used for labels and figures.",
};
