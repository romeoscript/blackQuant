"use client";

import { useQuery } from "@tanstack/react-query";
import { getBalanceUsd } from "@/app/balance-actions";

/**
 * The account's spendable balance, shared by every screen that shows it.
 *
 * One reader and one cache entry, so the figure in the topbar, the store and
 * the dashboard cannot disagree after a deposit lands.
 *
 * `balanceUsd` is null while loading *and* on failure, and callers render a
 * dash. Falling back to "0.00" would be worse than useless on a funding screen:
 * it reads as "you have no money" rather than "we could not load this".
 */
export function useBalance() {
  const { data, isError, refetch } = useQuery({
    queryKey: ["balance"],
    queryFn: () => getBalanceUsd(),
  });

  return { balanceUsd: isError ? null : (data ?? null), isError, refetch };
}
