"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, X } from "lucide-react";
import { toast } from "sonner";
import { Panel } from "@/components/dashboard/panel";
import { ActivateView } from "@/components/dashboard/license/activate-view";
import { ActivatedView } from "@/components/dashboard/license/activated-view";
import { PLANS, TRIAL_DAYS, type Billing, type Plan } from "@/components/dashboard/license/data";

export default function LicensePage() {
  const router = useRouter();
  const [activated, setActivated] = useState(false);
  const [plan, setPlan] = useState<Plan>(PLANS[1]);
  const [billing, setBilling] = useState<Billing>("monthly");

  function activate() {
    setActivated(true);
    toast.success(`${plan.name} plan activated`, {
      description: `Your ${TRIAL_DAYS}-day free trial has started.`,
    });
  }

  function upgrade() {
    setPlan(PLANS[2]);
    setActivated(false);
    toast("Upgrade to Elite", { description: "Review your new plan below before confirming." });
  }

  function cancel() {
    setActivated(false);
    toast("Subscription cancelled", { description: "Your plan has been deactivated." });
  }

  return (
    <div className="mx-auto max-w-[780px]">
      <Panel className="overflow-hidden">
        <div className="flex items-center gap-3 border-b border-bq-border px-5 pb-4 pt-7">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[#232323] text-bq-heading">
            <Settings className="size-3.5" />
          </span>
          <h1 className="min-w-0 flex-1 text-xl font-bold text-white">
            {activated ? "License Activated" : "Activate License"}
          </h1>
          <button
            onClick={() => router.push("/dashboard")}
            aria-label="Close"
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-bq-surface text-bq-dim transition-colors hover:text-white"
          >
            <X className="size-3" />
          </button>
        </div>

        <div className="px-5 py-6 sm:px-8">
          {activated ? (
            <ActivatedView plan={plan} billing={billing} onUpgrade={upgrade} onCancel={cancel} />
          ) : (
            <ActivateView
              plan={plan}
              billing={billing}
              onPlan={setPlan}
              onBilling={setBilling}
              onActivate={activate}
            />
          )}
        </div>
      </Panel>
    </div>
  );
}
