import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { TradeHeaderActions } from "@/components/dashboard/new-position-dialog";
import { PositionsStats } from "@/components/dashboard/positions/stat-cards";
import { EquityCurve } from "@/components/dashboard/positions/equity-curve";
import { PnlByPair } from "@/components/dashboard/positions/pnl-by-pair";
import { PositionsTable } from "@/components/dashboard/positions/positions-table";

export default function PositionsPage() {
  return (
    <div className="space-y-4 lg:space-y-5">
      <DashboardPageHeader title="Positions" actions={<TradeHeaderActions />} />
      <PositionsStats />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-5">
        <EquityCurve />
        <PnlByPair />
      </div>
      <PositionsTable />
    </div>
  );
}
