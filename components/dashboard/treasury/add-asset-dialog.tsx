"use client";

import { useMemo, useState } from "react";
import { Search, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { POPULAR_ASSETS } from "./data";
import { AssetBadge, PctChange } from "@/components/dashboard/panel";

export function AddAssetDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [ticker, setTicker] = useState("");
  const [amount, setAmount] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return POPULAR_ASSETS;
    return POPULAR_ASSETS.filter(
      (a) => a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q),
    );
  }, [query]);

  function addToPortfolio() {
    const symbol = ticker.trim().toUpperCase();
    if (!symbol || !amount.trim()) {
      toast.error("Enter a ticker and holdings amount.");
      return;
    }
    toast.success(`Added ${amount} ${symbol} to your portfolio.`);
    setTicker("");
    setAmount("");
    setOpen(false);
  }

  const inputCls =
    "h-auto rounded-[12px] border-bq-border bg-bq-surface px-3.5 py-2.5 text-[13px] text-white shadow-none placeholder:text-bq-dim focus-visible:border-bq-mint focus-visible:ring-0 md:text-[13px] dark:bg-bq-surface";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="gap-5 rounded-2xl border-bq-border bg-bq-card p-6 font-satoshi text-white sm:max-w-[440px]">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-[18px] font-bold text-white">Add Asset</DialogTitle>
          <DialogDescription className="text-[13px] text-bq-dim">
            Track a new crypto asset in your portfolio.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2.5 rounded-[12px] border border-bq-border bg-bq-surface px-3.5 py-2.5">
          <Search className="size-4 shrink-0 text-bq-dim" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search asset (e.g. BTC, Ethereum…)"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-bq-dim"
          />
        </div>

        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[1px] text-bq-dim">
            Popular assets
          </p>
          <div className="flex flex-col gap-1">
            {results.length === 0 && (
              <p className="py-4 text-center text-[13px] text-bq-dim">No assets match “{query}”.</p>
            )}
            {results.map((a) => (
              <div
                key={a.symbol}
                className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-2 transition-colors hover:border-bq-border hover:bg-bq-surface/50"
              >
                <AssetBadge symbol={a.symbol} color={a.color} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-white">{a.symbol}</p>
                  <p className="text-[11px] text-bq-dim">{a.name}</p>
                </div>
                <span className="text-[12px] text-bq-muted tabular-nums">{a.price}</span>
                <PctChange value={a.change} showIcon={false} className="w-14 justify-end" />
                <button
                  type="button"
                  onClick={() => toast.success(`Added ${a.symbol} to your portfolio.`)}
                  aria-label={`Add ${a.symbol}`}
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-bq-surface text-white transition-colors hover:bg-white/10"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[1px] text-bq-dim">
            Or enter manually
          </p>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] text-bq-dim">Ticker</span>
              <Input
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                placeholder="e.g. BTC"
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] text-bq-dim">Holdings amount</span>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                placeholder="e.g. 0.50000"
                className={inputCls}
              />
            </label>
          </div>
        </div>

        <DialogFooter className="mx-0 mb-0 gap-3 border-t-0 bg-transparent p-0 pt-1 sm:gap-3">
          <DialogClose asChild>
            <Button
              variant="outline"
              className="h-auto flex-1 rounded-[12px] border-bq-border bg-transparent py-3 text-[13px] font-semibold text-white hover:bg-bq-surface dark:border-bq-border dark:bg-transparent dark:hover:bg-bq-surface"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={addToPortfolio}
            className="h-auto flex-1 rounded-[12px] bg-white py-3 text-[13px] font-semibold text-black hover:bg-white/90"
          >
            <Plus className="size-4" />
            Add to Portfolio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
