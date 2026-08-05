import { Panel } from "@/components/dashboard/panel";
import { BarChart } from "@/components/dashboard/charts";
import { SUCCESS_RATE } from "./data";

/** Ordered high to low — the first tier a value clears is the one it belongs to. */
const TIERS = [
  { minRate: 80, color: "var(--bq-mint)", label: "≥80% win rate" },
  { minRate: 60, color: "var(--bq-heading)", label: "60—79%" },
  { minRate: 0, color: "var(--bq-dim)", label: "Below 60%" },
] as const;

const tierColor = (rate: number) =>
  (TIERS.find((t) => rate >= t.minRate) ?? TIERS[TIERS.length - 1]).color;

export function SuccessRateCard() {
  return (
    <Panel className="flex flex-col p-5">
      <div>
        <h2 className="text-[15px] font-semibold text-bq-heading">Signal Success Rate</h2>
        <p className="text-[12px] text-bq-dim">Win rate over 12 months</p>
      </div>

      <div className="mt-5">
        <BarChart bars={SUCCESS_RATE.map((b) => ({ label: b.label, value: b.value, color: tierColor(b.value) }))} />
      </div>

      <div className="mt-4 space-y-2">
        {TIERS.map((tier) => (
          <div key={tier.label} className="flex items-center gap-2 text-[11px] text-bq-muted">
            <span className="size-2 rounded-full" style={{ backgroundColor: tier.color }} />
            {tier.label}
          </div>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-bq-border-soft pt-4">
        <span className="text-[12px] text-bq-dim">Avg. success rate</span>
        <span className="text-[13px] font-bold text-bq-mint">67.5%</span>
      </div>
    </Panel>
  );
}
