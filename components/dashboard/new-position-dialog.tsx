"use client";

import { useState } from "react";
import { Briefcase, CirclePlus, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const PAIRS = [
  { symbol: "BTC/USDT", price: 64800 },
  { symbol: "ETH/USDT", price: 3180 },
  { symbol: "SOL/USDT", price: 148.2 },
  { symbol: "BNB/USDT", price: 412.5 },
  { symbol: "ADA/USDT", price: 0.58 },
  { symbol: "MATIC/USDT", price: 0.56 },
];
const ORDER_TYPES = ["Market", "Limit", "Stop"] as const;
const PCTS = [25, 50, 75, 100];

const num = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

export function NewPositionDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pair, setPair] = useState(PAIRS[0]);
  const [direction, setDirection] = useState<"BUY" | "SELL">("BUY");
  const [orderType, setOrderType] = useState<(typeof ORDER_TYPES)[number]>("Market");
  const [size, setSize] = useState("100");
  const [pct, setPct] = useState(25);
  const [tp, setTp] = useState("66000");
  const [sl, setSl] = useState("63500");

  const entry = pair.price;
  const sizeNum = Number(size) || 0;
  const tpPct = ((Number(tp) - entry) / entry) * 100;
  const slPct = ((Number(sl) - entry) / entry) * 100;
  const fee = sizeNum * 0.001;

  function selectPair(p: (typeof PAIRS)[number]) {
    setPair(p);
    setTp(String(Math.round(p.price * 1.0185 * 100) / 100));
    setSl(String(Math.round(p.price * 0.98 * 100) / 100));
  }

  function submit() {
    toast.success(`${direction} position opened on ${pair.symbol} — $${num(sizeNum)}.`);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[92vh] gap-5 overflow-y-auto rounded-2xl border-bq-border bg-bq-card p-6 font-satoshi text-white sm:max-w-[520px]">
        <DialogHeader className="flex-row items-center gap-3 space-y-0">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bq-surface text-bq-mint">
            <Briefcase className="size-4" />
          </span>
          <div>
            <DialogTitle className="text-[16px] font-bold text-white">New Position</DialogTitle>
            <DialogDescription className="text-[12px] text-bq-dim">
              Open a new trade order
            </DialogDescription>
          </div>
        </DialogHeader>

        <Section label="Trading pair">
          <div className="flex flex-wrap gap-2">
            {PAIRS.map((p) => (
              <Chip key={p.symbol} active={p.symbol === pair.symbol} onClick={() => selectPair(p)}>
                {p.symbol}
              </Chip>
            ))}
          </div>
        </Section>

        <div className="grid grid-cols-2 gap-4">
          <Section label="Direction">
            <Segmented>
              <SegBtn active={direction === "BUY"} tone="mint" onClick={() => setDirection("BUY")}>
                BUY / LONG
              </SegBtn>
              <SegBtn active={direction === "SELL"} tone="red" onClick={() => setDirection("SELL")}>
                SELL / SHORT
              </SegBtn>
            </Segmented>
          </Section>
          <Section label="Order type">
            <Segmented>
              {ORDER_TYPES.map((t) => (
                <SegBtn key={t} active={orderType === t} onClick={() => setOrderType(t)}>
                  {t}
                </SegBtn>
              ))}
            </Segmented>
          </Section>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Section label="Entry price (USDT)">
            <div className="flex items-center rounded-xl border border-bq-border bg-bq-surface px-3.5 py-2.5 text-[13px]">
              <span className="text-bq-dim">{orderType === "Market" ? "Market price" : `${orderType} price`}</span>
              <span className="ml-auto font-medium text-white tabular-nums">${num(entry)}</span>
            </div>
          </Section>
          <Section label="Position size (USDT)">
            <div className="flex items-center rounded-xl border border-bq-border bg-bq-surface px-3.5 py-2.5 text-[13px]">
              <input
                value={size}
                onChange={(e) => setSize(e.target.value)}
                inputMode="decimal"
                className="w-full min-w-0 bg-transparent font-medium text-white outline-none"
              />
              <span className="ml-2 shrink-0 text-bq-dim">USDT</span>
            </div>
          </Section>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            {PCTS.map((p) => (
              <Chip
                key={p}
                active={pct === p}
                onClick={() => {
                  setPct(p);
                  setSize(String(p * 4));
                }}
              >
                {p}%
              </Chip>
            ))}
          </div>
          <span className="text-[12px] text-bq-dim">
            Available: <span className="font-medium text-white">$0.00</span>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Section label="Take profit (USDT)" labelClass="text-bq-mint">
            <PriceField value={tp} onChange={setTp} pct={tpPct} tone="mint" />
          </Section>
          <Section label="Stop loss (USDT)" labelClass="text-red-400">
            <PriceField value={sl} onChange={setSl} pct={slPct} tone="red" />
          </Section>
        </div>

        <div className="rounded-xl border border-bq-border bg-bq-surface/40 p-4">
          <p className="text-[11px] font-medium uppercase tracking-[1px] text-bq-dim">Order preview</p>
          <dl className="mt-3 space-y-2 text-[13px]">
            <Row k="Pair" v={pair.symbol} />
            <Row k="Direction" v={direction === "BUY" ? "BUY / LONG" : "SELL / SHORT"} />
            <Row k="Entry" v={`$${num(entry)} (${orderType})`} />
            <Row k="Size" v={`$${num(sizeNum)}`} />
            <Row k="Take Profit" v={`$${num(Number(tp))}`} vClass="text-bq-mint" />
            <Row k="Stop Loss" v={`$${num(Number(sl))}`} vClass="text-red-400" />
            <Row k="Est. fee (0.1%)" v={`$${fee.toFixed(2)}`} />
          </dl>
        </div>

        <div className="flex gap-3">
          <DialogClose asChild>
            <Button
              variant="outline"
              className="h-auto flex-1 rounded-xl border-bq-border bg-transparent py-3 text-[13px] font-semibold text-white hover:bg-bq-surface dark:border-bq-border dark:bg-transparent dark:hover:bg-bq-surface"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={submit}
            className={cn(
              "h-auto flex-[1.4] rounded-xl py-3 text-[13px] font-bold text-black",
              direction === "BUY" ? "bg-bq-mint hover:bg-bq-mint/90" : "bg-red-400 text-white hover:bg-red-400/90",
            )}
          >
            <Zap className="size-4" />
            Open {direction} Position
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({
  label,
  labelClass,
  children,
}: {
  label: string;
  labelClass?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className={cn("text-[11px] font-medium uppercase tracking-[1px] text-bq-dim", labelClass)}>
        {label}
      </p>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors",
        active ? "bg-white text-black" : "bg-bq-surface text-bq-muted hover:text-white",
      )}
    >
      {children}
    </button>
  );
}

function Segmented({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-1 rounded-xl bg-bq-surface p-1">{children}</div>;
}

function SegBtn({
  active,
  tone,
  onClick,
  children,
}: {
  active: boolean;
  tone?: "mint" | "red";
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-lg px-2 py-1.5 text-[12px] font-semibold transition-colors",
        !active && "text-bq-muted hover:text-white",
        active && tone === "mint" && "bg-bq-mint text-black",
        active && tone === "red" && "bg-red-400 text-white",
        active && !tone && "bg-bq-card text-white",
      )}
    >
      {children}
    </button>
  );
}

function PriceField({
  value,
  onChange,
  pct,
  tone,
}: {
  value: string;
  onChange: (v: string) => void;
  pct: number;
  tone: "mint" | "red";
}) {
  return (
    <div
      className={cn(
        "flex items-center rounded-xl border bg-bq-surface px-3.5 py-2.5 text-[13px]",
        tone === "mint" ? "border-bq-mint/50" : "border-red-400/50",
      )}
    >
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="decimal"
        className="w-full min-w-0 bg-transparent font-medium text-white outline-none"
      />
      <span className={cn("ml-2 shrink-0 font-medium tabular-nums", tone === "mint" ? "text-bq-mint" : "text-red-400")}>
        {pct > 0 ? "+" : ""}
        {pct.toFixed(2)}%
      </span>
    </div>
  );
}

function Row({ k, v, vClass }: { k: string; v: string; vClass?: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-bq-dim">{k}</dt>
      <dd className={cn("font-medium text-white tabular-nums", vClass)}>{v}</dd>
    </div>
  );
}

/** Fund + New Position — the header action cluster shared by trade pages. */
export function TradeHeaderActions() {
  return (
    <>
      <button
        onClick={() => toast("Fund", { description: "Funding flow coming soon." })}
        className="flex items-center gap-2 rounded-lg border border-bq-border px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-bq-surface"
      >
        <CirclePlus className="size-4" /> Fund
      </button>
      <NewPositionDialog
        trigger={
          <button className="flex items-center gap-2 rounded-lg bg-bq-mint px-4 py-2 text-[13px] font-semibold text-black transition hover:bg-bq-mint/90">
            <CirclePlus className="size-4" /> New Position
          </button>
        }
      />
    </>
  );
}
