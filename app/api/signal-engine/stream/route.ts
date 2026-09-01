import { currentUserId } from "@/lib/session";
import { isSignalEngineConfigured, openSignalStream } from "@/lib/signal-engine";

/**
 * The engine's event stream, proxied to the browser.
 *
 * `EventSource` cannot set headers and cannot reach another origin without
 * CORS, so the browser must not talk to the engine directly: it would leak the
 * engine's address into the page and leave the API key with nowhere to ride.
 * This route authenticates by cookie the way `/api/deposit/stream` does, then
 * holds the upstream connection server-side where the key belongs.
 *
 * The body is piped through unchanged. Unlike the deposit stream, which
 * deliberately carries no amounts, signals are not account data — they are the
 * same product data this screen already renders — so there is nothing here
 * that the authenticated overview would not also return.
 */

// Streaming a response is incompatible with any attempt to render it statically.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if ((await currentUserId()) === null) {
    return new Response(null, { status: 401 });
  }
  if (!isSignalEngineConfigured()) {
    return new Response(null, { status: 503 });
  }

  try {
    // The abort signal is the tab going away; passing it up means a closed tab
    // closes the engine connection too, rather than leaking one per reload.
    const upstream = await openSignalStream(request.signal);

    // Pumped rather than piped. Returning `upstream.body` directly left the
    // engine holding a client per page load — closed tabs included — and those
    // never-ending requests starve the server of capacity for the actions this
    // screen needs, so the page loads once and then hangs forever. Reading it
    // explicitly gives the disconnect somewhere to land.
    // `openSignalStream` rejects a bodyless response, so this is unreachable —
    // it exists because the compiler cannot see that across the call.
    if (!upstream.body) return new Response(null, { status: 502 });

    const reader = upstream.body.getReader();
    const body = new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            return;
          }
          controller.enqueue(value);
        } catch {
          // Upstream went away mid-read; end this stream rather than error it.
          controller.close();
        }
      },
      cancel(reason) {
        // The browser disconnected. Release the engine's connection with it.
        void reader.cancel(reason).catch(() => {});
      },
    });

    request.signal.addEventListener("abort", () => {
      void reader.cancel("client disconnected").catch(() => {});
    });

    return new Response(body, {
      headers: {
        "content-type": "text/event-stream",
        "cache-control": "no-cache, no-transform",
        connection: "keep-alive",
        // Tells nginx not to buffer, which would defeat the whole endpoint.
        "x-accel-buffering": "no",
      },
    });
  } catch (error) {
    // A dead engine is not a broken app: the screen keeps polling underneath
    // and says so, so this closes quietly rather than throwing a 500.
    console.error("[signal-engine] stream unavailable:", error);
    return new Response(null, { status: 502 });
  }
}
