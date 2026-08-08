import { promises as fs } from "fs";
import path from "path";

/**
 * Load .env into process.env. Standalone scripts need this because Next isn't
 * running to do it for them.
 *
 * Must be awaited before importing anything that reaches `lib/env`, which
 * validates at module scope and throws on a missing DATABASE_URL.
 */
export async function loadEnv(): Promise<void> {
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
