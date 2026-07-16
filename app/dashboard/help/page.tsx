import { LifeBuoy, BookOpen, ShieldCheck } from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { AssistantChat } from "@/components/assistant/assistant-chat";

const LINKS = [
  { icon: BookOpen, title: "Knowledge Base", body: "Guides on strategies, funding, and payouts." },
  { icon: ShieldCheck, title: "Security", body: "Non-custodial by design — you keep your keys." },
  { icon: LifeBuoy, title: "Human Support", body: "Account-specific issues? Open a ticket with our team." },
];

export default function HelpPage() {
  return (
    <div className="space-y-5">
      <DashboardPageHeader title="Help Desk" />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <AssistantChat className="h-[calc(100vh-220px)] min-h-[440px]" />

        <div className="space-y-4">
          {LINKS.map((l) => (
            <div key={l.title} className="rounded-2xl border border-bq-border bg-bq-card p-5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-bq-surface text-bq-mint">
                <l.icon className="size-4" />
              </span>
              <p className="mt-3 text-[14px] font-semibold text-white">{l.title}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-bq-dim">{l.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
