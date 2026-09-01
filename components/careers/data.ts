import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  Compass,
  GraduationCap,
  HeartPulse,
  Laptop,
  LineChart,
  Ruler,
  ScrollText,
  Timer,
} from "lucide-react";

/** Applications go here; the role's title is pre-filled into the subject. */
export const CAREERS_INBOX = "careers@blackquant.io";

export type RoleType = "Full-time" | "Fractional" | "Contract";

export type Role = {
  slug: string;
  title: string;
  team: string;
  type: RoleType;
  location: string;
  /** Shown on the card under the title — one sentence on what the role is for. */
  summary: string;
  /** Compensation band or structure. Stated on every role on purpose. */
  compensation: string;
  responsibilities: string[];
  requirements: string[];
  /** Rendered expanded and first. At most one. */
  featured?: boolean;
};

/**
 * Open roles.
 *
 * Every role states its compensation. Making a candidate reach the third
 * conversation before finding out the band wastes their time and ours, and the
 * roles most likely to skip it — the senior ones — are the ones where the
 * mismatch is most expensive.
 */
export const ROLES: Role[] = [
  {
    slug: "fractional-ceo",
    title: "Fractional CEO",
    team: "Executive",
    type: "Fractional",
    location: "Remote · Singapore time zone overlap",
    featured: true,
    summary:
      "Take the commercial and regulatory weight off a technical founding team, two to three days a week, without pretending to be full-time.",
    compensation:
      "Day rate plus meaningful equity, weighted to equity. Reviewed at the raise.",
    responsibilities: [
      "Own the fundraise end to end — narrative, data room, investor pipeline and the term sheet negotiation, through to close",
      "Set commercial strategy and pricing for the execution product, and hold the revenue number",
      "Lead regulatory posture across MAS, MiCA and the venues we route through, working with counsel rather than around them",
      "Open and close institutional partnerships: market makers, custodians, liquidity venues and audit firms",
      "Build the executive bench you will eventually hand to a permanent CEO, including your own successor",
      "Chair the board rhythm — reporting, governance and the cadence that keeps a technical team honest about commercial reality",
    ],
    requirements: [
      "You have been a CEO, COO or founder before, in trading infrastructure, fintech or crypto — not adjacent to it",
      "You have raised institutional capital through a priced round and can describe what went wrong in one",
      "You are fluent in the regulatory surface of digital assets in at least one major jurisdiction",
      "You are comfortable that this is a non-custodial product, and can explain to an allocator why that constrains the business model",
      "You have worked fractionally before and know how to be genuinely decisive on two days a week",
      "You want the company to outgrow the arrangement, and will say so when it has",
    ],
  },
  {
    slug: "senior-execution-engineer",
    title: "Senior Execution Engineer",
    team: "Engineering",
    type: "Full-time",
    location: "Remote · Europe or Asia",
    summary:
      "Own the path from signal to submitted bundle, where the budget is five milliseconds and most of it is network.",
    compensation: "$180k–$240k + equity, adjusted for location",
    responsibilities: [
      "Own the hot path end to end: event ingestion, route simulation, signing and builder submission",
      "Drive down p99 rather than the mean — the tail is where opportunities are actually lost",
      "Design the failover so a dropped builder connection costs microseconds, not the next forty opportunities",
      "Instrument single requests through every stage, because aggregates hide the hop that matters",
    ],
    requirements: [
      "Deep systems experience in Rust, Go or C++ where latency was a product requirement, not a preference",
      "You have profiled a real system and can talk about allocation pressure and GC pauses concretely",
      "Working knowledge of EVM mechanics: mempools, bundles, builders, gas",
      "You are unromantic about performance — you measure before you optimise, and you delete more than you add",
    ],
  },
  {
    slug: "quantitative-researcher",
    title: "Quantitative Researcher",
    team: "Research",
    type: "Full-time",
    location: "Remote · Global",
    summary:
      "Find edges that survive costs, and be the person who says so when they do not.",
    compensation: "$170k–$230k + performance share",
    responsibilities: [
      "Build and test execution strategies across DEX venues and chains",
      "Hold the line on methodology: out-of-sample discipline, cost modelling, honest trade counts",
      "Publish internal post-mortems on strategies that decayed, and why",
      "Work directly with execution engineers, because the edge is usually in the plumbing",
    ],
    requirements: [
      "Strong statistics and a real understanding of overfitting — not just the word",
      "Python and a data stack you can move quickly in",
      "You have killed a strategy you built, on evidence, and can describe the moment",
      "Market microstructure knowledge; on-chain experience is a plus, not a prerequisite",
    ],
  },
  {
    slug: "smart-contract-engineer",
    title: "Smart Contract Engineer",
    team: "Engineering",
    type: "Full-time",
    location: "Remote · Global",
    summary:
      "Write the contracts that hold the non-custodial guarantee up, and make them auditable by someone who does not trust us.",
    compensation: "$170k–$220k + equity",
    responsibilities: [
      "Design and ship the execution and settlement contracts",
      "Keep approvals scoped to the job in front of them rather than unlimited and forever",
      "Run the audit relationship: prepare, respond, and publish the reports whole",
      "Build the verification path a sceptical user can walk without asking us anything",
    ],
    requirements: [
      "Production Solidity with real value at risk, and the scar tissue that comes with it",
      "Fluency in the permission and upgradeability failure modes that cause most large losses",
      "Testing discipline: fuzzing, invariants, forked-mainnet simulation",
      "You treat an audit as a floor, not a certificate",
    ],
  },
  {
    slug: "head-of-compliance",
    title: "Head of Compliance",
    team: "Operations",
    type: "Full-time",
    location: "Singapore · Hybrid",
    summary:
      "Build the compliance function for a non-custodial product, where most of the off-the-shelf playbook assumes custody.",
    compensation: "S$180k–S$240k + equity",
    responsibilities: [
      "Own the KYC/AML programme end to end, including the vendor stack and the exception queue",
      "Map the regulatory perimeter of a non-custodial execution product across our operating jurisdictions",
      "Be the counterparty for auditors, banking partners and regulators",
      "Write policy that engineers can actually implement, and review the implementation",
    ],
    requirements: [
      "Compliance leadership in a regulated financial or digital-asset business",
      "Direct experience with MAS licensing, or a comparable regime you can generalise from",
      "You can tell the difference between a rule and a vendor's interpretation of a rule",
      "Comfortable saying no, in writing, with reasons",
    ],
  },
];

export type Value = { icon: LucideIcon; title: string; body: string };

export const HOW_WE_WORK: Value[] = [
  {
    icon: Ruler,
    title: "Measured, not asserted",
    body: "Claims come with numbers attached. Our own engineering write-ups publish the before and after, including the commit that shipped a mistake and how long it took us to notice.",
  },
  {
    icon: Timer,
    title: "Small team, long attention",
    body: "We would rather five people hold whole systems in their heads than twenty coordinate. That means fewer hires, taken slowly, paid properly.",
  },
  {
    icon: Compass,
    title: "Written down first",
    body: "Decisions land in prose before they land in code — including why the alternative was rejected. It survives the person who made it.",
  },
  {
    icon: LineChart,
    title: "Non-custodial is a constraint",
    body: "It rules out business models that would be easier. We took it anyway, and it shapes what we can and cannot build. Everyone here should be able to explain why.",
  },
];

export const BENEFITS: Value[] = [
  {
    icon: Laptop,
    title: "Remote by default",
    body: "Async written culture with a Singapore-hours anchor for the few things that need one.",
  },
  {
    icon: Banknote,
    title: "Bands published",
    body: "Every role above states its compensation. No negotiation advantage for whoever asks hardest.",
  },
  {
    icon: HeartPulse,
    title: "Health cover",
    body: "Medical, dental and vision for you and your dependants, wherever you are based.",
  },
  {
    icon: GraduationCap,
    title: "Research budget",
    body: "Conferences, papers, data and hardware. Latency work in particular needs real hardware.",
  },
  {
    icon: ScrollText,
    title: "Equity, explained",
    body: "Options with a 10-year exercise window, and a plain-English explanation of what they are worth and what could make them worthless.",
  },
  {
    icon: Timer,
    title: "Time that is actually off",
    body: "Minimum 25 days, enforced rather than offered. On-call is compensated and rotated.",
  },
];

export const HIRING_PROCESS = [
  {
    step: "01",
    title: "Written application",
    body: "Email us. A short note about what you have built beats a cover letter; we read every one.",
  },
  {
    step: "02",
    title: "Intro conversation",
    body: "45 minutes on what you want and what the role is. We state the band on this call.",
  },
  {
    step: "03",
    title: "Technical or strategic depth",
    body: "A real problem from our domain, discussed live. No whiteboard algorithms, no take-home longer than two hours — and we pay for the take-home.",
  },
  {
    step: "04",
    title: "Team and references",
    body: "Meet the people you would work with, and we speak to people you have worked with.",
  },
  {
    step: "05",
    title: "Offer",
    body: "Within three business days of the final conversation, with the equity explained in writing.",
  },
] as const;

/** `mailto:` for a specific role, with the subject already filled in. */
export function applyHref(role: Role) {
  const subject = encodeURIComponent(`Application — ${role.title}`);
  return `mailto:${CAREERS_INBOX}?subject=${subject}`;
}
