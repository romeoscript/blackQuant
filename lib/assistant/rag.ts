import OpenAI from "openai";
import { promises as fs } from "fs";
import path from "path";

// RAG helpers — embeddings reuse the same OpenAI-compatible provider as chat
// (OpenRouter by default). Swap the embedding model via ASSISTANT_EMBED_MODEL.
const EMBED_MODEL = process.env.ASSISTANT_EMBED_MODEL || "openai/text-embedding-3-small";
const INDEX_PATH = path.join(process.cwd(), "content/knowledge.index.json");

export type Chunk = { source: string; text: string; embedding: number[] };
export type Hit = { source: string; text: string; score: number };

function client() {
  return new OpenAI({
    apiKey: process.env.ASSISTANT_API_KEY ?? "",
    baseURL: process.env.ASSISTANT_BASE_URL ?? "https://openrouter.ai/api/v1",
  });
}

export async function embed(texts: string[]): Promise<number[][]> {
  const res = await client().embeddings.create({ model: EMBED_MODEL, input: texts });
  return res.data.sort((a, b) => a.index - b.index).map((d) => d.embedding as number[]);
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

async function loadIndex(): Promise<Chunk[]> {
  try {
    return JSON.parse(await fs.readFile(INDEX_PATH, "utf8")) as Chunk[];
  } catch {
    return [];
  }
}

/** Return the top-k knowledge chunks most similar to the query. */
export async function retrieve(query: string, k = 4, minScore = 0.3): Promise<Hit[]> {
  if (!query.trim() || !process.env.ASSISTANT_API_KEY) return [];
  const index = await loadIndex();
  if (!index.length) return [];
  const [q] = await embed([query]);
  return index
    .map((c) => ({ source: c.source, text: c.text, score: cosine(q, c.embedding) }))
    .sort((a, b) => b.score - a.score)
    .filter((h) => h.score >= minScore)
    .slice(0, k);
}
