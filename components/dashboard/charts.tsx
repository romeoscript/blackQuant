export function DonutChart({
  segments,
  size = 140,
  thickness = 16,
  label,
}: {
  segments: { value: number; color: string }[];
  size?: number;
  thickness?: number;
  label?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-bq-border)" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const len = (s.value / total) * c;
          const off = acc;
          acc += len;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-off}
            />
          );
        })}
      </svg>
      {label && (
        <div className="absolute inset-0 flex items-center justify-center text-[15px] font-bold text-white">
          {label}
        </div>
      )}
    </div>
  );
}

export function Sparkline({
  points,
  color,
  width = 72,
  height = 26,
}: {
  points: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const rng = max - min || 1;
  const step = width / (points.length - 1);
  const d = points
    .map((p, i) => `${i * step},${height - ((p - min) / rng) * (height - 4) - 2}`)
    .join(" ");
  return (
    <svg width={width} height={height}>
      <polyline points={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AreaLineChart({
  data,
  height = 190,
  color = "#ffffff",
  showLabels = true,
}: {
  data: { label?: string; value: number }[];
  height?: number;
  color?: string;
  showLabels?: boolean;
}) {
  const W = 1000;
  const H = 100;
  const gid = `area-${color.replace(/[^a-z0-9]/gi, "")}`;
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = (max - min) * 0.18 || 1;
  const lo = min - pad;
  const hi = max + pad;
  const px = (i: number) => (data.length === 1 ? 0 : (i / (data.length - 1)) * W);
  const py = (v: number) => H - ((v - lo) / (hi - lo)) * H;
  const line = data.map((d, i) => `${px(i)},${py(d.value)}`).join(" ");
  const area = `M0,${H} L ${line.split(" ").join(" L ")} L ${W},${H} Z`;

  return (
    <div>
      <div className="relative" style={{ height }}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full">
          <defs>
            <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.16" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gid})`} />
          <polyline points={line} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        </svg>
        {data.map((d, i) => (
          <span
            key={i}
            className="absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-bq-bg ring-2"
            style={
              {
                left: `${data.length === 1 ? 50 : (i / (data.length - 1)) * 100}%`,
                top: `${(1 - (d.value - lo) / (hi - lo)) * 100}%`,
                "--tw-ring-color": color,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
      {showLabels && (
        <div className="mt-2 flex justify-between text-[10px] text-bq-dim">
          {data.map((d, i) => (
            <span key={i}>{d.label}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export function BarChart({
  bars,
  height = 150,
}: {
  bars: { label: string; value: number; color: string }[];
  height?: number;
}) {
  const max = Math.max(...bars.map((b) => b.value)) || 1;
  return (
    <div>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {bars.map((b, i) => (
          <div
            key={i}
            className="flex-1 rounded-[3px]"
            style={{ height: `${(b.value / max) * 100}%`, backgroundColor: b.color }}
          />
        ))}
      </div>
      <div className="mt-2 flex gap-1.5">
        {bars.map((b, i) => (
          <span key={i} className="flex-1 text-center text-[10px] text-bq-dim">
            {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}
