"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, ArrowUp, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "How does the Signal Engine work?",
  "Is BlackQuant custodial?",
  "What do the Signal Plan tiers include?",
  "How do I withdraw funds?",
];

function setLast(list: Msg[], content: string): Msg[] {
  const copy = [...list];
  copy[copy.length - 1] = { role: "assistant", content };
  return copy;
}

export function AssistantChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const base = [...messages, { role: "user" as const, content: trimmed }];
    setMessages([...base, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: base }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        setMessages((m) =>
          setLast(m, data.error ?? "The assistant is unavailable right now. Please try again later."),
        );
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => setLast(m, acc));
      }
      if (!acc) setMessages((m) => setLast(m, "…"));
    } catch {
      setMessages((m) => setLast(m, "Something went wrong. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  const empty = messages.length === 0;

  return (
    <div className="flex h-[calc(100vh-220px)] min-h-[440px] flex-col rounded-2xl border border-bq-border bg-bq-card">
      <div className="flex items-center gap-3 border-b border-bq-border-soft px-5 py-4">
        <span className="flex size-9 items-center justify-center rounded-full bg-bq-mint/12 text-bq-mint">
          <Sparkles className="size-4" />
        </span>
        <div className="flex-1">
          <p className="text-[14px] font-semibold text-white">BlackQuant Assistant</p>
          <p className="flex items-center gap-1.5 text-[11px] text-bq-dim">
            <span className="size-1.5 rounded-full bg-bq-mint" /> Online · answers about features & security
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-bq-mint/12 text-bq-mint">
              <Sparkles className="size-5" />
            </span>
            <div>
              <p className="text-[15px] font-semibold text-white">How can I help?</p>
              <p className="mt-1 text-[13px] text-bq-dim">
                Ask about the platform. I can&apos;t access your account or give financial advice.
              </p>
            </div>
            <div className="flex max-w-md flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-bq-border bg-bq-surface px-3 py-1.5 text-[12px] text-bq-text transition-colors hover:border-bq-mint/40 hover:text-white"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => <Bubble key={i} msg={m} loading={loading && i === messages.length - 1} />)
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-bq-border-soft p-3"
      >
        <div className="flex items-end gap-2 rounded-xl border border-bq-border bg-bq-surface px-3 py-2 focus-within:border-bq-mint">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder="Ask the assistant…"
            className="max-h-32 min-h-[24px] flex-1 resize-none bg-transparent text-[13px] text-white outline-none placeholder:text-bq-dim"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-bq-mint text-black transition hover:bg-bq-mint/90 disabled:opacity-40"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
          </button>
        </div>
        <p className="mt-2 px-1 text-[10px] text-bq-dim">
          BlackQuant Assistant can make mistakes. Not financial advice.
        </p>
      </form>
    </div>
  );
}

function Bubble({ msg, loading }: { msg: Msg; loading: boolean }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-bq-surface text-bq-muted" : "bg-bq-mint/12 text-bq-mint",
        )}
      >
        {isUser ? <User className="size-4" /> : <Sparkles className="size-4" />}
      </span>
      <div
        className={cn(
          "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed",
          isUser ? "bg-bq-surface text-white" : "bg-bq-bg text-bq-text",
        )}
      >
        {msg.content || (loading && <Loader2 className="size-4 animate-spin text-bq-dim" />)}
      </div>
    </div>
  );
}
