"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export type StreamState = {
  /** True while the engine's stream is open and pushing. */
  connected: boolean;
  /** Epoch ms of the last `signal` or `resolve`, or null if none this session. */
  lastEventAt: number | null;
  /** Events seen since the page opened — what "live" actually amounts to. */
  events: number;
};

/**
 * Floor between refetches triggered by the stream.
 *
 * A 1m-bar engine across nineteen markets emits many times a second; the
 * snapshot behind this screen is three HTTP calls. Without a floor the second
 * outruns the first indefinitely.
 */
const REFETCH_THROTTLE_MS = 2_000;

/**
 * How often accumulated events are published to React.
 *
 * Event arrival and render rate are deliberately decoupled. Calling `setState`
 * per event pinned the main thread on a busy feed — the counter climbed while
 * the page never finished loading and the tab stopped responding — so events
 * accumulate in refs and surface on this tick instead.
 */
const FLUSH_MS = 1_000;

/**
 * Holds the engine's event stream open and refetches when it fires.
 *
 * The stream is a trigger, not a source: the message says something moved and
 * the authoritative data still arrives through the normal authenticated query.
 * That keeps one path to the numbers on screen instead of two that can drift.
 *
 * Polling stays underneath. A stream can be buffered by a proxy or dropped
 * without either end noticing, and a feed that silently stops is worse than
 * one that updates on a timer.
 *
 * `connected` is reported honestly: it reflects an open connection to the
 * engine, so the screen can distinguish genuinely live from merely polling
 * rather than showing a green dot either way.
 */
export function useSignalStream(): StreamState {
  const queryClient = useQueryClient();
  const [state, setState] = useState<StreamState>({
    connected: false,
    lastEventAt: null,
    events: 0,
  });

  // Written on every event, read once per flush. Refs rather than state
  // precisely so that writing them cannot schedule a render.
  const pendingEvents = useRef(0);
  const lastEventAt = useRef<number | null>(null);
  const connected = useRef(false);

  useEffect(() => {
    // Same-origin, so the session cookie rides along; EventSource cannot set
    // headers, which is exactly why the route authenticates by cookie.
    const source = new EventSource("/api/signal-engine/stream");
    let refetchTimer: ReturnType<typeof setTimeout> | null = null;

    const onOpen = () => {
      connected.current = true;
    };

    const onEvent = () => {
      pendingEvents.current += 1;
      lastEventAt.current = Date.now();
      connected.current = true;

      // Trailing throttle: the last event in a burst still gets a refetch, so
      // the feed cannot strand on whatever the previous one happened to hold.
      if (refetchTimer) return;
      refetchTimer = setTimeout(() => {
        refetchTimer = null;
        queryClient.invalidateQueries({ queryKey: ["signal-engine"] });
      }, REFETCH_THROTTLE_MS);
    };

    source.addEventListener("open", onOpen);
    source.addEventListener("signal", onEvent);
    source.addEventListener("resolve", onEvent);

    // EventSource reconnects on its own after a network drop; a non-200 — the
    // engine being down, say — closes it for good, and polling covers that.
    source.addEventListener("error", () => {
      connected.current = false;
    });

    const flush = setInterval(() => {
      setState((previous) =>
        previous.events === pendingEvents.current &&
        previous.connected === connected.current
          ? // Nothing moved this tick. Returning the same object keeps React
            // from re-rendering the screen once a second for no reason.
            previous
          : {
              connected: connected.current,
              lastEventAt: lastEventAt.current,
              events: pendingEvents.current,
            },
      );
    }, FLUSH_MS);

    return () => {
      if (refetchTimer) clearTimeout(refetchTimer);
      clearInterval(flush);
      source.close();
    };
  }, [queryClient]);

  return state;
}
