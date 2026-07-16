"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, ChevronRight } from "lucide-react";

export function DashboardPageHeader({
  title,
  actions,
}: {
  title: string;
  actions?: React.ReactNode;
}) {
  const [time, setTime] = useState("11:58:41");

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="mt-1 flex items-center gap-1 text-[13px] text-bq-muted">
          BlackQuant <ChevronRight className="size-3.5" /> {title}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="flex items-center gap-2 rounded-lg border border-bq-border px-3 py-2 font-plex text-[12px] text-bq-muted">
          <Calendar className="size-3.5" /> Jun 19, 2026
        </span>
        <span className="flex items-center gap-2 rounded-lg border border-bq-border px-3 py-2 font-plex text-[12px] tabular-nums text-bq-muted">
          <Clock className="size-3.5" /> {time}
        </span>
        {actions}
      </div>
    </div>
  );
}
