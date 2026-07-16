import OpenAI from "openai";
import { z } from "zod";
import { env } from "@/lib/env";
import { retrieve } from "@/lib/assistant/rag";
import { getClientIp, rateLimit } from "@/lib/assistant/rate-limit";

export const runtime = "nodejs";

// Default to a cheap, reliable vision model on OpenRouter so images work out of
// the box. Swap any of these via env (see .env.example) with no code change.
const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL = "google/gemini-2.5-flash";

const textPart = z.object({ type: z.literal("text"), text: z.string().max(4000) });
const imagePart = z.object({
  type: z.literal("image_url"),
  image_url: z.object({
    // base64 data URL (from the client) or a plain https URL. ~4MB cap.
    url: z
      .string()
      .max(4_000_000)
      .refine((u) => u.startsWith("data:image/") || u.startsWith("https://"), "invalid image"),
  }),
});

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.union([
          z.string().trim().min(1).max(4000),
          z.array(z.union([textPart, imagePart])).min(1).max(6),
        ]),
      }),
    )
    .min(1)
    .max(40),
});

const SYSTEM = `You are the BlackQuant Assistant, the in-app support agent for BlackQuant — a non-custodial quantitative trading platform.

What BlackQuant offers:
- Treasury: track crypto holdings, allocation, balance history, and transactions.
- Signal Plan: subscription tiers (Starter $29/mo, Growth $79/mo, Elite $199/mo) for automated trade signals.
- Positions: open/close trades, view equity curve, P&L by pair, win rate.
- Signal Engine: live automated strategies (e.g. multi-timeframe EMA crossover).
- Security: non-custodial — the bot has execution permission only and never takes custody of user funds. Users control their wallet at all times. Features include 2FA, verification, and audited infrastructure.

How to respond:
- Be concise, friendly, and accurate. Prefer short paragraphs and bullet points.
- Users may attach screenshots (e.g. an error, a chart, a failed transaction). Read the image and help with what it shows.
- Only describe features that actually exist above; if you don't know something, say so and point the user to human support rather than inventing details.
- Never give personalized investment or financial advice, price predictions, or tell users what to trade. If asked, explain you're a support assistant, not a licensed advisor.
- For account-specific issues (billing, a stuck withdrawal, a locked account), tell the user to open a ticket with human support — you can't access their account.
- Never ask for passwords, seed phrases, private keys, or 2FA codes.`;

export async function POST(req: Request) {
  // NOTE: open endpoint for the demo. Gate behind auth() before production —
  // the fake login flow doesn't create a real session, so requiring one here
  // would break the assistant for demo users.
  const limit = rateLimit(getClientIp(req));
  if (!limit.ok) {
    return Response.json(
      { error: "You're sending messages too fast. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  if (!env.ASSISTANT_API_KEY) {
    return Response.json(
      { error: "The assistant isn't configured yet. Add ASSISTANT_API_KEY to your environment." },
      { status: 503 },
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  // Any OpenAI-compatible provider (OpenRouter by default; override via env).
  const client = new OpenAI({
    apiKey: env.ASSISTANT_API_KEY,
    baseURL: env.ASSISTANT_BASE_URL ?? DEFAULT_BASE_URL,
    defaultHeaders: { "X-Title": "BlackQuant Assistant" },
  });
  const encoder = new TextEncoder();

  // RAG: pull the most relevant knowledge-base chunks for the latest question
  // and add them to the system prompt. Degrades gracefully if the index is
  // empty or retrieval fails — the assistant still answers from SYSTEM.
  const lastUser = [...parsed.data.messages].reverse().find((m) => m.role === "user");
  const query =
    typeof lastUser?.content === "string"
      ? lastUser.content
      : (lastUser?.content ?? [])
          .filter((p): p is { type: "text"; text: string } => p.type === "text")
          .map((p) => p.text)
          .join(" ");

  let system = SYSTEM;
  try {
    const hits = await retrieve(query);
    if (hits.length) {
      system +=
        "\n\n# Knowledge base\nUse these BlackQuant docs to answer. Prefer them over general knowledge, and if they don't cover the question, say so.\n\n" +
        hits.map((h) => `## ${h.source}\n${h.text}`).join("\n\n");
    }
  } catch (err) {
    console.error("[assistant] retrieval failed:", err instanceof Error ? err.message : err);
  }

  const messages = [
    { role: "system", content: system },
    ...parsed.data.messages,
  ] as OpenAI.Chat.Completions.ChatCompletionMessageParam[];

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const completion = await client.chat.completions.create({
          model: env.ASSISTANT_MODEL ?? DEFAULT_MODEL,
          max_tokens: 2048,
          stream: true,
          messages,
        });
        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) controller.enqueue(encoder.encode(delta));
        }
      } catch (err) {
        const detail =
          err instanceof OpenAI.APIError
            ? `${err.status ?? ""} ${err.message}`.trim()
            : err instanceof Error
              ? err.message
              : "unknown error";
        console.error("[assistant] request failed:", detail);
        controller.enqueue(
          encoder.encode("\n\nSomething went wrong reaching the assistant. Please try again."),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
