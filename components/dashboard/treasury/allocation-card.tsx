import { ASSETS, TRENDS } from "./data";
import { Panel, PctChange, usd } from "./panel";
import { DonutChart, Sparkline } from "./charts";

export function AllocationCard() {
  return (
    <Panel className="flex flex-col p-5">
      <div>
        <h2 className="text-[15px] font-semibold text-white">Asset Allocation</h2>
        <p className="text-[12px] text-bq-dim">By USD value</p>
      </div>

      <div className="mt-4 flex items-center gap-5">
        <DonutChart
          size={128}
          thickness={15}
          label="$1.5K"
          segments={ASSETS.map((a) => ({ value: a.allocation, color: a.color }))}
        />
        <div className="flex-1 space-y-2.5">
          {ASSETS.map((a) => (
            <div key={a.symbol} className="flex items-center gap-2 text-[12px]">
              <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: a.color }} />
              <span className="flex-1 text-bq-text">{a.symbol}</span>
              <span className="text-bq-dim tabular-nums">{usd(a.value)}</span>
              <span className="w-8 text-right font-semibold text-white tabular-nums">{a.allocation}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 border-t border-bq-border-soft pt-4">
        <p className="text-[11px] text-bq-dim">7-day price trend</p>
        <div className="mt-3 space-y-3">
          {TRENDS.map((t) => (
            <div key={t.symbol} className="flex items-center gap-3">
              <span className="w-9 text-[12px] text-bq-text">{t.symbol}</span>
              <div className="flex-1">
                <Sparkline points={t.points} color={t.color} width={120} height={26} />
              </div>
              <PctChange value={t.change} showIcon={false} />
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}
