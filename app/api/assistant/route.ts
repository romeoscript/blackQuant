import OpenAI from "openai";
import { z } from "zod";
import { env } from "@/lib/env";

export const runtime = "nodejs";

const DEFAULT_BASE_URL = "https://api.deepseek.com";
const DEFAULT_MODEL = "deepseek-chat";

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(4000),
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
- Only describe features that actually exist above; if you don't know something, say so and point the user to human support rather than inventing details.
- Never give personalized investment or financial advice, price predictions, or tell users what to trade. If asked, explain you're a support assistant, not a licensed advisor.
- For account-specific issues (billing, a stuck withdrawal, a locked account), tell the user to open a ticket with human support — you can't access their account.
- Never ask for passwords, seed phrases, private keys, or 2FA codes.`;

export async function POST(req: Request) {
  // NOTE: open endpoint for the demo. Gate behind auth() before production —
  // the fake login flow doesn't create a real session, so requiring one here
  // would break the assistant for demo users.
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

  // Any OpenAI-compatible provider (DeepSeek by default; override via env).
  const client = new OpenAI({
    apiKey: env.ASSISTANT_API_KEY,
    baseURL: env.ASSISTANT_BASE_URL ?? DEFAULT_BASE_URL,
  });
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const completion = await client.chat.completions.create({
          model: env.ASSISTANT_MODEL ?? DEFAULT_MODEL,
          max_tokens: 2048,
          stream: true,
          messages: [{ role: "system", content: SYSTEM }, ...parsed.data.messages],
        });
        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) controller.enqueue(encoder.encode(delta));
        }
      } catch {
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
