"use client";

import Link from "next/link";
import { Headset, MessageCircle } from "lucide-react";
import { Panel } from "@/components/dashboard/panel";
import { TintBadge } from "./asset-select-card";
import { RECENT_DEPOSITS } from "./data";

export function RecentDepositsCard() {
  return (
    <Panel className="p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[13px] font-medium text-bq-heading">Recent Deposits</h2>
        <Link
          href="/dashboard/treasury"
          className="text-[11px] text-bq-dim transition-colors hover:text-white"
        >
          View all
        </Link>
      </div>

      <div className="mt-2 divide-y divide-bq-border-soft">
        {RECENT_DEPOSITS.map((d) => (
          <div key={d.amount} className="flex items-start gap-3 py-3.5">
            <TintBadge symbol={d.symbol} color={d.color} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-bq-mint">{d.amount}</p>
              <p className="mt-0.5 text-[11px] text-bq-dim">
                {d.usd} · {d.credited}
              </p>
              <p className="mt-1 text-[11px] text-bq-dim">{d.date}</p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <span className="rounded-lg bg-bq-mint/10 px-2 py-0.5 text-[11px] text-bq-mint">
                Confirmed
              </span>
              <span className="text-[10px] text-bq-dim">{d.conf}</span>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function HelpCard() {
  return (
    <Panel className="p-5">
      <span className="flex size-8 items-center justify-center rounded-full bg-bq-surface text-bq-heading">
        <Headset className="size-3.5" />
      </span>
      <h2 className="mt-3 text-[13px] font-medium text-bq-heading">Need Help?</h2>
      <p className="mt-1 text-[11px] text-bq-dim">
        Having trouble? Our support team is available 24/7.
      </p>
      <Link
        href="/dashboard/help"
        className="mt-4 flex items-center justify-center gap-2 rounded-[14px] border border-bq-border py-2.5 text-[11px] font-medium text-bq-heading transition-colors hover:bg-bq-surface"
      >
        <MessageCircle className="size-3" /> Contact Support
      </Link>
    </Panel>
  );
}
