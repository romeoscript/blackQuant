import { describe, expect, it, vi } from "vitest";
import {
  depositListenerCount,
  publishDeposit,
  subscribeToDeposits,
  type DepositEventMessage,
} from "@/lib/events";

const message: DepositEventMessage = {
  type: "deposit",
  npPaymentId: "pay-1",
  status: "CONFIRMED",
  confirmations: 6,
};

describe("deposit event registry", () => {
  it("delivers to every connection a user has open", () => {
    const first = vi.fn();
    const second = vi.fn();
    const stop = [subscribeToDeposits(1, first), subscribeToDeposits(1, second)];

    publishDeposit(1, message);

    expect(first).toHaveBeenCalledWith(message);
    expect(second).toHaveBeenCalledWith(message);
    stop.forEach((fn) => fn());
  });

  it("never delivers one account's deposits to another", () => {
    const alice = vi.fn();
    const bob = vi.fn();
    const stop = [subscribeToDeposits(1, alice), subscribeToDeposits(2, bob)];

    publishDeposit(1, message);

    expect(alice).toHaveBeenCalledOnce();
    expect(bob).not.toHaveBeenCalled();
    stop.forEach((fn) => fn());
  });

  it("stops delivering once unsubscribed, and forgets the user", () => {
    const listener = vi.fn();
    const stop = subscribeToDeposits(3, listener);
    expect(depositListenerCount(3)).toBe(1);

    stop();

    publishDeposit(3, message);
    expect(listener).not.toHaveBeenCalled();
    // The set itself is dropped, so a process cannot accumulate a key for
    // every user who has ever connected.
    expect(depositListenerCount(3)).toBe(0);
  });

  it("publishing to nobody is a no-op", () => {
    expect(() => publishDeposit(999, message)).not.toThrow();
  });

  it("keeps delivering when one subscriber throws", () => {
    const broken = vi.fn(() => {
      throw new Error("client went away");
    });
    const healthy = vi.fn();
    const stop = [
      subscribeToDeposits(4, broken),
      subscribeToDeposits(4, healthy),
    ];

    // A failed push must never propagate into the callback crediting a balance.
    expect(() => publishDeposit(4, message)).not.toThrow();
    expect(healthy).toHaveBeenCalledOnce();
    stop.forEach((fn) => fn());
  });
});
