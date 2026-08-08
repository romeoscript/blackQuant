import { cn } from "@/lib/utils";

/**
 * Brand marks for the deposit assets, drawn as inline SVG.
 *
 * Inline rather than fetched: these sit next to an address someone is about to
 * send money to, so they must render before paint and must not depend on a
 * third-party CDN being up — a missing logo on this screen is a hesitation
 * about whether the page is real.
 *
 * Each is a 32×32 disc in the asset's brand colour with a white mark, which is
 * how every exchange renders them and therefore what people recognise.
 */

type LogoProps = { className?: string };

const BTC = () => (
  <>
    <circle cx="16" cy="16" r="16" fill="#F7931A" />
    <g fill="#fff">
      <rect x="13.1" y="5.8" width="1.9" height="20.4" rx="0.6" />
      <rect x="17.3" y="5.8" width="1.9" height="20.4" rx="0.6" />
      <path d="M11.2 8.6h2.6v14.8h-2.6z" />
      <path d="M13.4 8.6h4.9a3.7 3.7 0 0 1 0 7.4h-4.9z" />
      <path d="M13.4 16h5.6a3.7 3.7 0 0 1 0 7.4h-5.6z" />
    </g>
  </>
);

const ETH = () => (
  <>
    <circle cx="16" cy="16" r="16" fill="#627EEA" />
    <g fill="#fff">
      <path d="M16.5 4v8.87l7.5 3.35z" fillOpacity=".6" />
      <path d="M16.5 4 9 16.22l7.5-3.35z" />
      <path d="M16.5 21.97V28L24 17.62z" fillOpacity=".6" />
      <path d="M16.5 28v-6.03L9 17.62z" />
      <path d="m16.5 20.57 7.5-4.35-7.5-3.35z" fillOpacity=".2" />
      <path d="M9 16.22l7.5 4.35v-7.7z" fillOpacity=".6" />
    </g>
  </>
);

/** A T whose stem passes through an ellipse — drawn in that order, so the stem
 *  sits in front of it exactly as the mark does. */
const USDT = () => (
  <>
    <circle cx="16" cy="16" r="16" fill="#26A17B" />
    <g fill="#fff">
      <path d="M7.4 7.2h17.2v4H7.4z" />
      <ellipse
        cx="16"
        cy="14.6"
        rx="8"
        ry="3.3"
        fill="none"
        stroke="#fff"
        strokeWidth="1.9"
      />
      <path d="M13.9 7.2h4.2v17.4h-4.2z" />
    </g>
  </>
);

/** Four satellites around a larger centre — the BNB "diamond of diamonds". */
const BNB = () => {
  const diamond = (cx: number, cy: number, s: number) =>
    `M${cx} ${cy - s}L${cx + s} ${cy}L${cx} ${cy + s}L${cx - s} ${cy}Z`;
  return (
    <>
      <circle cx="16" cy="16" r="16" fill="#F3BA2F" />
      <g fill="#fff">
        <path d={diamond(16, 7.8, 3.9)} />
        <path d={diamond(7.8, 16, 3.9)} />
        <path d={diamond(24.2, 16, 3.9)} />
        <path d={diamond(16, 24.2, 3.9)} />
        <path d={diamond(16, 16, 4.6)} />
      </g>
    </>
  );
};

/** Three bars, the middle one leaning against the other two. */
const SOL = () => (
  <>
    <circle cx="16" cy="16" r="16" fill="#9945FF" />
    <g fill="#fff">
      <path d="M10.4 9.4H25l-3.4 3.6H7z" />
      <path d="M7 14.4h14.6l3.4 3.6H10.4z" />
      <path d="M10.4 19.4H25l-3.4 3.6H7z" />
    </g>
  </>
);

const XRP = () => (
  <>
    <circle cx="16" cy="16" r="16" fill="#00AAE4" />
    <g stroke="#fff" strokeWidth="2.8" strokeLinecap="round">
      <path d="M10 10L22 22" />
      <path d="M22 10L10 22" />
    </g>
  </>
);

/** Cardano's constellation: a centre with two rings of satellites. */
const ADA = () => {
  const ring = (radius: number, r: number, offset: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const angle = ((offset + i * 60) * Math.PI) / 180;
      return (
        <circle
          key={`${radius}-${i}`}
          cx={16 + radius * Math.cos(angle)}
          cy={16 - radius * Math.sin(angle)}
          r={r}
        />
      );
    });
  return (
    <>
      <circle cx="16" cy="16" r="16" fill="#0D92D6" />
      <g fill="#fff">
        <circle cx="16" cy="16" r="2" />
        {ring(5.4, 1.5, 30)}
        {ring(9.2, 1.1, 0)}
      </g>
    </>
  );
};

/** Six ellipses on a ring, each lying tangent to it. */
const DOT = () => (
  <>
    <circle cx="16" cy="16" r="16" fill="#E6007A" />
    <g fill="#fff">
      {Array.from({ length: 6 }, (_, i) => {
        const degrees = i * 60;
        const angle = (degrees * Math.PI) / 180;
        const cx = 16 + 8 * Math.cos(angle);
        const cy = 16 - 8 * Math.sin(angle);
        return (
          <ellipse
            key={i}
            cx={cx}
            cy={cy}
            rx="2.7"
            ry="1.8"
            transform={`rotate(${-degrees + 90} ${cx} ${cy})`}
          />
        );
      })}
    </g>
  </>
);

const MARKS: Record<string, () => React.ReactElement> = {
  BTC,
  ETH,
  USDT,
  BNB,
  SOL,
  XRP,
  ADA,
  DOT,
};

export function CoinLogo({
  symbol,
  className,
}: LogoProps & { symbol: string }) {
  const Mark = MARKS[symbol];

  // An unmapped asset falls back to its ticker rather than an empty hole, so
  // adding a currency to the table cannot break this screen.
  if (!Mark) {
    return (
      <span
        className={cn(
          "flex items-center justify-center rounded-full bg-bq-surface text-[10px] font-bold text-bq-muted",
          className,
        )}
      >
        {symbol.slice(0, 3)}
      </span>
    );
  }

  return (
    <svg
      viewBox="0 0 32 32"
      role="img"
      aria-label={symbol}
      className={cn("shrink-0", className)}
    >
      <Mark />
    </svg>
  );
}
