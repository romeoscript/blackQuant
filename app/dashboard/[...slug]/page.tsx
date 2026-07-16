import Link from "next/link";
import { Construction, ArrowLeft } from "lucide-react";

export default async function DashboardSection({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const name = (slug?.[0] ?? "section")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl border border-bq-border bg-bq-surface text-bq-muted">
        <Construction className="size-6" />
      </span>
      <h1 className="mt-5 text-xl font-bold text-white">{name}</h1>
      <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-bq-muted">
        This section is coming soon. The Control Center is live — head back to keep exploring.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 flex items-center gap-2 rounded-lg border border-bq-border px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-white/5"
      >
        <ArrowLeft className="size-4" /> Back to Control Center
      </Link>
    </div>
  );
}
