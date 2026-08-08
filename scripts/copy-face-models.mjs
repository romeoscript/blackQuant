import { cp, mkdir, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Stages the face-detection models into public/ so the liveness step can fetch
 * them at runtime.
 *
 * Copied rather than committed: they are binaries npm already pins, and
 * vendoring them would put model weights in the git history for no benefit.
 * public/models is gitignored and rebuilt on install.
 *
 * The list is what Human actually requests, which is the union of two things:
 * what @sssxyd/face-liveness-detector enables (detector -> blazeface,
 * mesh -> facemesh) and what Human enables by default and the detector never
 * turns off (description -> faceres, emotion -> emotion). Human loads a model
 * for every enabled feature, so a missing file fails the whole `human.load()`
 * rather than degrading. iris, antispoof and liveness are explicitly disabled
 * by the detector and must not be staged.
 */
const USED_MODELS = ["blazeface", "facemesh", "faceres", "emotion"];

const SOURCE = "node_modules/@vladmandic/human/models";
const TARGET = "public/models";

if (!existsSync(SOURCE)) {
  console.warn(
    `[face-models] ${SOURCE} not found — skipping. Run npm install first.`,
  );
  process.exit(0);
}

await mkdir(TARGET, { recursive: true });

const available = await readdir(SOURCE);
const wanted = available.filter((file) =>
  USED_MODELS.some((model) => file === `${model}.json` || file === `${model}.bin`),
);

let bytes = 0;
for (const file of wanted) {
  const from = join(SOURCE, file);
  await cp(from, join(TARGET, file));
  bytes += (await stat(from)).size;
}

const missing = USED_MODELS.filter(
  (model) => !wanted.includes(`${model}.json`) || !wanted.includes(`${model}.bin`),
);
if (missing.length > 0) {
  console.warn(`[face-models] missing weights for: ${missing.join(", ")}`);
}

console.log(
  `[face-models] staged ${wanted.length} files (${(bytes / 1048576).toFixed(1)} MB) into ${TARGET}`,
);
