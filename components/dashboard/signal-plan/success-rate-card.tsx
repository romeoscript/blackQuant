import { Panel } from "@/components/dashboard/panel";
import { BarChart } from "@/components/dashboard/charts";
import { SUCCESS_RATE } from "./data";

const tierColor = (v: number) => (v >= 80 ? "#00e5aa" : v >= 60 ? "#ffffff" : "#3a3a3a");

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-bq-muted">
      <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </div>
  );
}

export function SuccessRateCard() {
  return (
    <Panel className="flex flex-col p-5">
      <div>
        <h2 className="text-[15px] font-semibold text-white">Signal Success Rate</h2>
        <p className="text-[12px] text-bq-dim">Win rate over 12 months</p>
      </div>

      <div className="mt-5">
        <BarChart bars={SUCCESS_RATE.map((b) => ({ label: b.label, value: b.value, color: tierColor(b.value) }))} />
      </div>

      <div className="mt-4 space-y-2">
        <Legend color="#00e5aa" label="≥80% win rate" />
        <Legend color="#ffffff" label="60—79%" />
        <Legend color="#3a3a3a" label="Below 60%" />
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-bq-border-soft pt-4">
        <span className="text-[12px] text-bq-dim">Avg. success rate</span>
        <span className="text-[13px] font-bold text-bq-mint">67.5%</span>
      </div>
    </Panel>
  );
}
