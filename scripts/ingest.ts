// Build the knowledge index for the assistant's RAG.
// Usage: npm run ingest  (drop .md files in content/knowledge/ first)
import { promises as fs } from "fs";
import path from "path";
import { embed } from "../lib/assistant/rag";

// Load .env into process.env (standalone script — Next isn't running here).
async function loadEnv() {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (process.env[m[1]] === undefined) process.env[m[1]] = v;
    }
  } catch {
    // no .env — rely on the ambient environment
  }
}

function chunkText(md: string): string[] {
  const paras = md.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let cur = "";
  for (const p of paras) {
    if (cur && (cur + "\n\n" + p).length > 1200) {
      chunks.push(cur);
      cur = p;
    } else {
      cur = cur ? cur + "\n\n" + p : p;
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}

async function main() {
  await loadEnv();
  if (!process.env.ASSISTANT_API_KEY) {
    console.error("ASSISTANT_API_KEY is not set — add it to .env, then re-run `npm run ingest`.");
    process.exit(1);
  }

  const dir = path.join(process.cwd(), "content/knowledge");
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".md"));
  const items: { source: string; text: string }[] = [];
  for (const file of files) {
    const md = await fs.readFile(path.join(dir, file), "utf8");
    const title = md.match(/^#\s+(.+)$/m)?.[1]?.trim() || file.replace(/\.md$/, "");
    for (const text of chunkText(md)) items.push({ source: title, text });
  }

  console.log(`Embedding ${items.length} chunks from ${files.length} docs…`);
  const embeddings: number[][] = [];
  const BATCH = 64;
  for (let i = 0; i < items.length; i += BATCH) {
    embeddings.push(...(await embed(items.slice(i, i + BATCH).map((x) => x.text))));
  }

  const index = items.map((x, i) => ({ ...x, embedding: embeddings[i] }));
  await fs.writeFile(path.join(process.cwd(), "content/knowledge.index.json"), JSON.stringify(index));
  console.log(`Wrote content/knowledge.index.json (${index.length} chunks).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
