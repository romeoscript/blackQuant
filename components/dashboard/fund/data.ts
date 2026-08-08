// Store placeholders. The deposit side of this page reads `lib/deposit.ts` and
// the database, and the balance shown here is the real one — only the catalogue
// is mock, until the purchase flow debits against it.
export type StoreItem = { name: string; price: number; icon: "cpu" | "chart" | "headset" | "briefcase" | "shield"; popular?: boolean };

export const STORE_ITEMS: StoreItem[] = [
  { name: "Signal Pro — Monthly", price: 500, icon: "cpu", popular: true },
  { name: "Signal Pro — Annual", price: 4800, icon: "cpu" },
  { name: "VIP Analytics Pack", price: 200, icon: "chart" },
  { name: "Priority Support", price: 150, icon: "headset" },
  { name: "Extra Positions Slot", price: 100, icon: "briefcase" },
  { name: "Risk Guard Add-on", price: 250, icon: "shield" },
];
