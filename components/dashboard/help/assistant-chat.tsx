"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, ArrowUp, User, Loader2, ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; text: string; images?: string[] };

const SUGGESTIONS = [
  "How does the Signal Engine work?",
  "Is BlackQuant custodial?",
  "What do the Signal Plan tiers include?",
  "How do I withdraw funds?",
];

const MAX_IMAGES = 4;

// Downscale to keep the base64 payload small before sending to the model.
async function toImageDataUrl(file: File, maxDim = 1280): Promise<string> {
  const raw = await new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
  const img = document.createElement("img");
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
    img.src = raw;
  });
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  if (scale === 1) return raw;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

function toApi(m: Msg) {
  if (m.role === "assistant" || !m.images?.length) {
    return { role: m.role, content: m.text || "" };
  }
  return {
    role: "user" as const,
    content: [
      { type: "text" as const, text: m.text || "Here's a screenshot — can you help with what it shows?" },
      ...m.images.map((url) => ({ type: "image_url" as const, image_url: { url } })),
    ],
  };
}

function setLast(list: Msg[], text: string): Msg[] {
  const copy = [...list];
  copy[copy.length - 1] = { role: "assistant", text };
  return copy;
}

export function AssistantChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, attachments]);

  async function addFiles(files: FileList | File[]) {
    const imgs = [...files].filter((f) => f.type.startsWith("image/"));
    if (!imgs.length) return;
    const room = MAX_IMAGES - attachments.length;
    const next = await Promise.all(imgs.slice(0, room).map((f) => toImageDataUrl(f)));
    setAttachments((a) => [...a, ...next].slice(0, MAX_IMAGES));
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if ((!trimmed && attachments.length === 0) || loading) return;

    const userMsg: Msg = {
      role: "user",
      text: trimmed,
      images: attachments.length ? attachments : undefined,
    };
    const base = [...messages, userMsg];
    setMessages([...base, { role: "assistant", text: "" }]);
    setInput("");
    setAttachments([]);
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: base.map(toApi) }),
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
            <span className="size-1.5 rounded-full bg-bq-mint" /> Online · text &amp; screenshots
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
                Ask a question or attach a screenshot. I can&apos;t access your account or give financial advice.
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
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((url, i) => (
              <div key={i} className="relative size-16 overflow-hidden rounded-lg border border-bq-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => setAttachments((a) => a.filter((_, j) => j !== i))}
                  aria-label="Remove image"
                  className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-black/70 text-white"
                >
                  <X className="size-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 rounded-xl border border-bq-border bg-bq-surface px-2 py-2 focus-within:border-bq-mint">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={attachments.length >= MAX_IMAGES}
            aria-label="Attach image"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-bq-muted transition-colors hover:bg-bq-bg hover:text-white disabled:opacity-40"
          >
            <ImagePlus className="size-4" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPaste={(e) => {
              const files = [...e.clipboardData.files];
              if (files.some((f) => f.type.startsWith("image/"))) {
                e.preventDefault();
                addFiles(files);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder="Ask the assistant, or paste a screenshot…"
            className="max-h-32 min-h-[24px] flex-1 resize-none self-center bg-transparent text-[13px] text-white outline-none placeholder:text-bq-dim"
          />
          <button
            type="submit"
            disabled={loading || (!input.trim() && attachments.length === 0)}
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
      <div className={cn("flex max-w-[80%] flex-col gap-2", isUser && "items-end")}>
        {msg.images?.length ? (
          <div className={cn("flex flex-wrap gap-2", isUser && "justify-end")}>
            {msg.images.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={url} alt="" className="max-h-40 rounded-xl border border-bq-border object-cover" />
            ))}
          </div>
        ) : null}
        {(msg.text || (!msg.images?.length && loading)) && (
          <div
            className={cn(
              "whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed",
              isUser ? "bg-bq-surface text-white" : "bg-bq-bg text-bq-text",
            )}
          >
            {msg.text || <Loader2 className="size-4 animate-spin text-bq-dim" />}
          </div>
        )}
      </div>
    </div>
  );
}
