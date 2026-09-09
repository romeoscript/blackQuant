/**
 * Published third-party security reviews.
 *
 * Every field here is copied from the report it describes rather than from
 * marketing copy, including `subject` — which names the codebase the firm
 * actually reviewed. Both reports below cover upstream dependencies, not
 * BlackQuant's own contracts, and the page says so plainly: an audit page that
 * lets a reader infer the wrong scope is worse than no audit page, because it
 * is the one page a reader arrives at already looking for reassurance.
 *
 * The firm wordmarks live in `components/landing/audit-logos`, keyed by the
 * same slugs, and are pulled in by the page rather than imported here — that
 * module is ~11 KB of SVG geometry and is deliberately kept out of any data
 * file a client component might reach.
 */

export type Severity = "critical" | "high" | "medium" | "low" | "note";

/** Findings by severity. Absent severities had none in that report. */
export type FindingCount = { severity: Severity; count: number };

export type AuditReport = {
  /** Slug, and the anchor a deep link lands on. */
  id: string;
  firm: string;
  /** Key into `AUDIT_LOGOS`, so the card shows the firm's own wordmark. */
  logoSlug: string;
  /** The report's own title, so a reader can match the file to the entry. */
  title: string;
  /** The codebase reviewed. Not ours — see the note above. */
  subject: string;
  /** True when the review covers a dependency rather than BlackQuant's code. */
  upstream: boolean;
  /** Publication date of the final report, and its machine-readable form. */
  published: string;
  publishedIso: string;
  /** Review window as the report states it, not the publication date. */
  window: string;
  repo: { label: string; href: string };
  summary: string;
  findings: readonly FindingCount[];
  /** Fix status as the report itself records it. */
  resolution: string;
  /** Served from `public/audits`, so this is the report exactly as delivered. */
  href: string;
  size: string;
};

export const AUDIT_REPORTS: readonly AuditReport[] = [
  {
    id: "trail-of-bits-lagoon-v0",
    firm: "Trail of Bits",
    logoSlug: "trail-of-bits",
    title: "Kiln Lagoon Vault Diff Review — Security Assessment",
    subject: "Lagoon v0 vault protocol (ERC-7540), version 0.6.0",
    upstream: true,
    published: "11 May 2026",
    publishedIso: "2026-05-11",
    window: "20–24 April 2026 · one engineer-week",
    repo: {
      label: "hopperlabsxyz/lagoon-v0",
      href: "https://github.com/hopperlabsxyz/lagoon-v0",
    },
    summary:
      "A diff review of the v0.5.1-to-v0.6.0 upgrade: entry and exit fee arithmetic across the settlement, asynchronous claim and synchronous paths, the haircut mechanism for synchronous redemptions, the external sanctions-list oracle, whitelist and blacklist access modes, and the VaultInit delegatecall and storage layout. Deployment scripts and off-chain infrastructure were out of scope.",
    findings: [
      { severity: "medium", count: 1 },
      { severity: "low", count: 1 },
    ],
    resolution: "Both findings resolved at fix review, 29 April 2026.",
    href: "/audits/trail-of-bits-lagoon-v0-2026-05.pdf",
    size: "969 KB",
  },
  {
    id: "openzeppelin-contracts-v5-6",
    firm: "OpenZeppelin",
    logoSlug: "openzeppelin",
    title: "OpenZeppelin Contracts v5.6 Audit",
    subject: "OpenZeppelin Contracts library, v5.4.0 → v5.6.0-rc.1",
    upstream: true,
    published: "27 February 2026",
    publishedIso: "2026-02-27",
    window: "26 January – 5 February 2026",
    repo: {
      label: "OpenZeppelin/openzeppelin-contracts",
      href: "https://github.com/OpenZeppelin/openzeppelin-contracts",
    },
    summary:
      "A diff audit of the Solidity library our contracts inherit from — access control and AccessManager, ERC-4337 and ERC-7579 account abstraction, the crosschain and bridge contracts, Governor, the proxy and upgradeability primitives, and the ERC-20/721/1155 token extensions.",
    findings: [
      { severity: "critical", count: 0 },
      { severity: "high", count: 0 },
      { severity: "medium", count: 2 },
      { severity: "low", count: 10 },
      { severity: "note", count: 5 },
    ],
    resolution: "18 findings in total — 14 resolved, 2 partially resolved.",
    href: "/audits/openzeppelin-contracts-v5.6-2026-02.pdf",
    size: "369 KB",
  },
];

/**
 * Severity pill colours. A zero count is drawn muted whatever its severity —
 * a red "0 Critical" pill reads as an alarm at a glance, which is the opposite
 * of what it says.
 */
export const SEVERITY_STYLES: Record<Severity, string> = {
  critical: "border-bq-loss-text/30 bg-bq-loss-text/10 text-bq-loss-text",
  high: "border-bq-loss-text/30 bg-bq-loss-text/10 text-bq-loss-text",
  medium: "border-bq-warn-text/30 bg-bq-warn-text/10 text-bq-warn-text",
  low: "border-bq-border bg-bq-overlay/[0.03] text-bq-text",
  note: "border-bq-border bg-bq-overlay/[0.03] text-bq-muted",
};

export const EMPTY_SEVERITY_STYLE =
  "border-bq-border bg-bq-overlay/[0.02] text-bq-dim";

export const SEVERITY_LABELS: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  note: "Notes",
};

export const SECURITY_INBOX = "security@blackquant.io";
