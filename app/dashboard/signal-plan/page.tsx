import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { TradeHeaderActions } from "@/components/dashboard/new-position-dialog";
import { PricingSection } from "@/components/dashboard/signal-plan/pricing";
import { RecentSignalsCard } from "@/components/dashboard/signal-plan/recent-signals-card";
import { SuccessRateCard } from "@/components/dashboard/signal-plan/success-rate-card";

export default function SignalPlanPage() {
  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Signal Plan" actions={<TradeHeaderActions />} />
      <PricingSection />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6">
        <RecentSignalsCard />
        <SuccessRateCard />
      </div>
    </div>
  );
}
