import { Panel } from "@/components/dashboard/panel";
import { DonutChart } from "@/components/dashboard/charts";
import { PNL_BY_PAIR } from "./data";

export function PnlByPair() {
  const d = PNL_BY_PAIR;
  return (
    <Panel className="flex flex-col p-5">
      <div>
        <h2 className="text-[15px] font-semibold text-white">P&L by Pair</h2>
        <p className="text-[12px] text-bq-dim">Contribution per asset</p>
      </div>

      <div className="mt-4 flex items-center gap-5">
        <DonutChart
          size={120}
          thickness={14}
          label="$1.5K"
          segments={d.segments.map((s) => ({ value: s.pct, color: s.color }))}
        />
        <div className="flex-1 space-y-2.5">
          {d.segments.map((s) => (
            <div key={s.label} className="flex items-center gap-2 text-[12px]">
              <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="flex-1 text-bq-text">{s.label}</span>
              <span className="font-semibold text-white tabular-nums">{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-bq-border-soft pt-4">
        <span className="text-[12px] text-bq-dim">Net P&L</span>
        <span className="text-[15px] font-bold text-bq-mint tabular-nums">{d.net}</span>
      </div>
    </Panel>
  );
}
