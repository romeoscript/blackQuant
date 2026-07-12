/**
 * Schematic recreation of the Figma "Infrastructure Network" diagram.
 * Pure SVG (viewBox 0 0 1000 560) so it scales cleanly at any width.
 */
const GREY = "#3a3a3a";
const LABEL = "#5a5a5a";
const GREEN = "#4ade80";

function Node({
  cx,
  cy,
  r,
  title,
  sub,
  children,
}: {
  cx: number;
  cy: number;
  r: number;
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#0c0c0c" stroke="#242424" />
      <g transform={`translate(${cx}, ${cy - (sub ? 12 : 4)})`} className="text-white">
        {children}
      </g>
      <text
        x={cx}
        y={cy + (sub ? 14 : 16)}
        textAnchor="middle"
        fill="#e5e5e5"
        fontSize="13"
        fontWeight="600"
        className="font-satoshi"
      >
        {title}
      </text>
      {sub && (
        <text
          x={cx}
          y={cy + 30}
          textAnchor="middle"
          fill={LABEL}
          fontSize="10"
          className="font-plex"
        >
          {sub}
        </text>
      )}
    </g>
  );
}

function DashLine({
  x1,
  y1,
  x2,
  y2,
  label,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label?: string;
}) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={GREY}
        strokeWidth="1"
        strokeDasharray="4 4"
      />
      {label && (
        <text
          x={mx}
          y={my - 6}
          textAnchor="middle"
          fill={LABEL}
          fontSize="9"
          letterSpacing="1"
          className="font-plex"
        >
          {label}
        </text>
      )}
    </g>
  );
}

export function NetworkDiagram() {
  const pools = [
    { y: 180, name: "Sushiswap" },
    { y: 268, name: "Uniswap" },
    { y: 356, name: "Balancer" },
    { y: 444, name: "Pancakeswap" },
  ];

  return (
    <svg viewBox="0 0 1000 560" className="h-auto w-full">
      {/* connectors */}
      <DashLine x1={206} y1={188} x2={347} y2={180} label="ASSET DISTRIBUTION" />
      <DashLine x1={206} y1={236} x2={347} y2={392} label="ASSET DISTRIBUTION" />
      <DashLine x1={453} y1={180} x2={610} y2={288} label="COMMAND SIGNALS" />
      <DashLine x1={453} y1={392} x2={612} y2={318} label="YIELD ALLOCATION" />
      {pools.map((p) => (
        <line
          key={p.name}
          x1={712}
          y1={303}
          x2={856}
          y2={p.y}
          stroke={GREY}
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      ))}
      {/* user -> wallet */}
      <line
        x1={150}
        y1={366}
        x2={150}
        y2={272}
        stroke={GREY}
        strokeWidth="1"
        strokeDasharray="4 4"
        markerEnd="url(#arrow)"
      />
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={GREY} />
        </marker>
      </defs>

      {/* green profit-return loop */}
      <path
        d="M660,355 C660,520 150,540 150,272"
        fill="none"
        stroke={GREEN}
        strokeWidth="1.5"
      />
      <text
        x={405}
        y={528}
        textAnchor="middle"
        fill={GREEN}
        fontSize="11"
        letterSpacing="1.5"
        className="font-plex"
      >
        PROFIT RETURN LOOP
      </text>

      {/* nodes */}
      <Node cx={150} cy={210} r={58} title="User Wallet" sub="[Non-Custodial]">
        <rect x={-13} y={-9} width={26} height={18} rx={4} fill="none" stroke="white" strokeWidth="1.5" />
        <line x1={-13} y1={-3} x2={13} y2={-3} stroke="white" strokeWidth="1.5" />
      </Node>

      <Node cx={150} cy={410} r={42} title="User">
        <circle cx={0} cy={-4} r={5} fill="none" stroke="white" strokeWidth="1.5" />
        <path d="M-8,10 A8,7 0 0 1 8,10" fill="none" stroke="white" strokeWidth="1.5" />
      </Node>

      <Node cx={400} cy={175} r={55} title="Nexus Bot" sub="[MEV Arbitrage]">
        <path d="M2,-14 L-8,3 L-1,3 L-2,14 L8,-3 L1,-3 Z" fill={GREEN} />
      </Node>

      <Node cx={400} cy={400} r={55} title="Arbor Bot" sub="[Yield Farming]">
        <path d="M0,-13 C7,-6 7,6 0,13 C-7,6 -7,-6 0,-13 Z" fill="none" stroke={GREEN} strokeWidth="1.5" />
        <line x1={0} y1={-8} x2={0} y2={12} stroke={GREEN} strokeWidth="1.5" />
      </Node>

      <Node cx={660} cy={303} r={52} title="DEX">
        <ellipse cx={0} cy={-6} rx={14} ry={5} fill="none" stroke="white" strokeWidth="1.5" />
        <path d="M-14,-6 L-14,6 A14,5 0 0 0 14,6 L14,-6" fill="none" stroke="white" strokeWidth="1.5" />
      </Node>

      {pools.map((p) => (
        <g key={p.name}>
          <circle cx={882} cy={p.y} r={22} fill="#0c0c0c" stroke="#242424" />
          <circle cx={882} cy={p.y} r={7} fill="none" stroke="#8a8a8a" strokeWidth="1.5" />
          <text
            x={848}
            y={p.y + 4}
            textAnchor="end"
            fill="#c0c0c0"
            fontSize="12"
            className="font-satoshi"
          >
            {p.name}
          </text>
        </g>
      ))}

      <text
        x={935}
        y={510}
        textAnchor="middle"
        fill={LABEL}
        fontSize="12"
        letterSpacing="1"
        className="font-satoshi"
      >
        LIQUIDITY POOLS
      </text>
    </svg>
  );
}
