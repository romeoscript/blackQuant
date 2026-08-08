/**
 * In-process fan-out from the IPN handler to open browser connections.
 *
 * A registry keyed by user rather than an EventEmitter: dispatch is a single
 * map lookup instead of a scan, there is no listener-count warning to raise,
 * and a subscriber can only ever be reached through its own user's key — which
 * is what keeps one account's deposits out of another's stream.
 *
 * Single-process only. Behind more than one instance, a callback can land on a
 * server the browser is not connected to and that tab hears nothing until it
 * polls; a shared channel (Redis pub/sub) is what removes that caveat.
 */

export type DepositEventMessage = {
  type: "deposit";
  npPaymentId: string;
  status: string;
  confirmations: number;
};

type Listener = (message: DepositEventMessage) => void;

// Held on globalThis so hot reload cannot leave the IPN route publishing into
// one registry while the stream route listens to another — the same reason
// `lib/prisma` does it.
const globalForEvents = globalThis as unknown as {
  depositListeners: Map<number, Set<Listener>> | undefined;
};

const listeners = (globalForEvents.depositListeners ??= new Map());

/** Returns the unsubscribe. Callers must run it, or the set grows forever. */
export function subscribeToDeposits(
  userId: number,
  listener: Listener,
): () => void {
  const forUser = listeners.get(userId) ?? new Set<Listener>();
  forUser.add(listener);
  listeners.set(userId, forUser);

  return () => {
    forUser.delete(listener);
    // Dropping the empty set keeps the map from accumulating a key per user
    // who has ever connected.
    if (forUser.size === 0) listeners.delete(userId);
  };
}

/**
 * Never throws: a broken subscriber must not fail the callback that is trying
 * to credit someone's balance.
 */
export function publishDeposit(
  userId: number,
  message: DepositEventMessage,
): void {
  const forUser = listeners.get(userId);
  if (!forUser) return;

  for (const listener of forUser) {
    try {
      listener(message);
    } catch (error) {
      console.error("[events:deposit] subscriber failed", error);
    }
  }
}

/** Test seam: how many connections are open for a user. */
export const depositListenerCount = (userId: number): number =>
  listeners.get(userId)?.size ?? 0;
