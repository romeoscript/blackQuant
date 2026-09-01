/**
 * Uploads the landing page's background clips to Cloudinary.
 *
 * The masters are 1080p–4K and total ~85 MB, so they are deliberately not in
 * the repo. This script is the reproducible path from the Pexels sources to
 * the Cloudinary public IDs that `lib/cloudinary.ts` builds delivery URLs
 * against: it downloads each master (caching under .cache/videos so a re-run
 * is cheap) and uploads it under a fixed public ID.
 *
 * Because the public ID is fixed and `overwrite` is set, swapping a clip later
 * is a one-line manifest edit and a re-run — the delivery URLs never change,
 * so no component has to be touched and no CDN cache goes stale (`invalidate`
 * purges the edge).
 *
 * Usage:  npm run upload:videos
 * Needs:  CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * The four clips, in feature order.
 *
 * `source` is the direct Pexels CDN URL for the highest resolution that Pexels
 * exposes for that clip — the newer uploads (02–04) mint a distinct file ID per
 * resolution and only publish the largest one they have, which is why the
 * resolutions below are not uniform. `credit` is kept so the licence trail
 * survives without a lookup; all four are Pexels' free licence.
 */
const CLIPS = [
  {
    publicId: "feature-01-data",
    pexels: 11584395,
    resolution: "3840x2160 30fps",
    credit: "Binary Code Rain Animation — Oleg Gamulinskii (Pexels)",
    source:
      "https://videos.pexels.com/video-files/11584395/11584395-uhd_3840_2160_60fps.mp4",
  },
  {
    publicId: "feature-02-core",
    pexels: 32336493,
    resolution: "2560x1440 60fps",
    credit: "Abstract Digital Network Light Nodes Visual (Pexels)",
    source:
      "https://videos.pexels.com/video-files/32336493/13794754_2560_1440_60fps.mp4",
  },
  {
    publicId: "feature-03-network",
    pexels: 35004655,
    resolution: "1920x1080 30fps",
    credit: "Abstract 3D Network Structure Animation (Pexels)",
    source:
      "https://videos.pexels.com/video-files/35004655/14829557_1920_1080_30fps.mp4",
  },
  {
    publicId: "feature-04-ai",
    pexels: 33260952,
    resolution: "1920x1080 30fps",
    credit: "Mesmerizing Abstract Tunnel of Vibrant Spheres (Pexels)",
    source:
      "https://videos.pexels.com/video-files/33260952/14170295_1920_1080_30fps.mp4",
  },
];

/** Must match `VIDEO_FOLDER` in lib/cloudinary.ts. */
const FOLDER = "blackquant/landing";
const CACHE_DIR = path.join(process.cwd(), ".cache", "videos");

/** Minimal .env reader — Next isn't running to do it for us. */
async function loadEnv() {
  try {
    const raw = await readFile(path.join(process.cwd(), ".env"), "utf8");
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

/**
 * Cloudinary's signature: every signed parameter sorted by key, joined as a
 * query string, with the API secret appended and the whole thing SHA-1'd.
 * `file`, `api_key` and `resource_type` are excluded by the API contract.
 */
function sign(params, secret) {
  const canonical = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(canonical + secret).digest("hex");
}

/** Downloads to the cache on first run; later runs reuse the file. */
async function master(clip) {
  const file = path.join(CACHE_DIR, `${clip.publicId}.mp4`);
  if (existsSync(file)) {
    const buf = await readFile(file);
    console.log(`  cached  ${(buf.byteLength / 1e6).toFixed(1)} MB`);
    return buf;
  }
  const res = await fetch(clip.source);
  if (!res.ok) {
    throw new Error(`download failed (${res.status}) — ${clip.source}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(file, buf);
  console.log(`  fetched ${(buf.byteLength / 1e6).toFixed(1)} MB`);
  return buf;
}

async function upload(clip, buf, { cloudName, apiKey, apiSecret }) {
  const signed = {
    folder: FOLDER,
    invalidate: "true",
    overwrite: "true",
    public_id: clip.publicId,
    timestamp: Math.floor(Date.now() / 1000),
  };

  const form = new FormData();
  for (const [k, v] of Object.entries(signed)) form.append(k, String(v));
  form.append("api_key", apiKey);
  form.append("signature", sign(signed, apiSecret));
  form.append("file", new Blob([buf], { type: "video/mp4" }), `${clip.publicId}.mp4`);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
    { method: "POST", body: form },
  );
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`upload failed (${res.status}) — ${body?.error?.message ?? "unknown"}`);
  }
  return body;
}

async function main() {
  await loadEnv();

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  const missing = [
    ["CLOUDINARY_CLOUD_NAME", cloudName],
    ["CLOUDINARY_API_KEY", apiKey],
    ["CLOUDINARY_API_SECRET", apiSecret],
  ]
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length) {
    console.error(
      `Missing ${missing.join(", ")}.\n` +
        "Copy them from https://console.cloudinary.com/settings/api-keys into .env.",
    );
    process.exit(1);
  }

  const creds = { cloudName, apiKey, apiSecret };

  for (const clip of CLIPS) {
    console.log(`\n${clip.publicId}  (Pexels ${clip.pexels}, ${clip.resolution})`);
    const buf = await master(clip);
    const result = await upload(clip, buf, creds);
    console.log(
      `  uploaded ${result.width}x${result.height} ${result.format} ` +
        `${(result.bytes / 1e6).toFixed(1)} MB -> ${result.public_id}`,
    );
  }

  console.log(
    `\nDone. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=${cloudName} in .env so the ` +
      "landing page delivers them.",
  );
}

main().catch((err) => {
  console.error(`\n${err.message}`);
  process.exit(1);
});
