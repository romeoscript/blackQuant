import { auth } from "@/auth";
import { subscribeToDeposits, type DepositEventMessage } from "@/lib/events";

/**
 * Server-sent events for the signed-in account's deposits.
 *
 * The browser holds this open and the IPN handler pushes down it the moment a
 * deposit moves, so a confirmation count updates on arrival rather than on the
 * next poll. The screens keep their slow polling as a fallback: proxies buffer
 * or drop long-lived responses, and a stream that silently dies must not take
 * the balance with it.
 *
 * The stream carries no balances or amounts — only that something changed, and
 * for which payment. Clients refetch through the normal authenticated actions,
 * so this endpoint cannot become a second, weaker way to read account data.
 */

// Streaming a response is incompatible with any attempt to render it statically.
export const dynamic = "force-dynamic";

/** Proxies commonly close a connection idle for 30–60s. */
const HEARTBEAT_MS = 25_000;

export async function GET(request: Request) {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!Number.isInteger(userId)) {
    return new Response(null, { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let open = true;

      const send = (chunk: string) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          // The client vanished between the abort firing and this write.
          open = false;
        }
      };

      const unsubscribe = subscribeToDeposits(userId, (message: DepositEventMessage) => {
        send(`event: deposit\ndata: ${JSON.stringify(message)}\n\n`);
      });

      // A comment line: valid SSE, ignored by EventSource, enough to keep an
      // intermediary from deciding the connection is idle.
      const heartbeat = setInterval(() => send(": ping\n\n"), HEARTBEAT_MS);

      const close = () => {
        if (!open) return;
        open = false;
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Already closed by the runtime; nothing left to do.
        }
      };

      // The only reliable signal that a tab went away. Without this the
      // listener and its interval outlive every closed connection.
      request.signal.addEventListener("abort", close);

      send(": connected\n\n");
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      // Tells nginx not to buffer, which would defeat the whole endpoint.
      "x-accel-buffering": "no",
    },
  });
}
