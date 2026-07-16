import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

export function Panel({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      className={cn("rounded-2xl border border-bq-border bg-bq-card", className)}
      {...props}
    />
  );
}

export function AssetBadge({
  symbol,
  color,
  className,
}: {
  symbol: string;
  color: string;
  className?: string;
}) {
  return (
    <span
      style={{ backgroundColor: color }}
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white",
        className,
      )}
    >
      {symbol.slice(0, 2)}
    </span>
  );
}

export function PctChange({
  value,
  className,
  showIcon = true,
}: {
  value: number;
  className?: string;
  showIcon?: boolean;
}) {
  const negative = value < 0;
  const Icon = negative ? ArrowDownRight : ArrowUpRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[12px] font-medium tabular-nums",
        negative ? "text-red-400" : "text-bq-mint",
        className,
      )}
    >
      {showIcon && value !== 0 && <Icon className="size-3" />}
      {value > 0 ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}
