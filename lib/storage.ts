import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { AwsClient } from "aws4fetch";
import { env } from "@/lib/env";

/**
 * Where the dev fallback writes. Gitignored, and only ever used when no bucket
 * is configured — see `sendMail` for the same shape.
 */
const DEV_UPLOAD_DIR = join(process.cwd(), ".uploads");

/** How long a download link stays valid. Short: these are identity documents. */
const SIGNED_URL_TTL_SECONDS = 120;

export const isObjectStoreConfigured = () =>
  Boolean(
    env.S3_BUCKET &&
      env.S3_ACCESS_KEY_ID &&
      env.S3_SECRET_ACCESS_KEY &&
      env.S3_ENDPOINT,
  );

function client(): AwsClient {
  return new AwsClient({
    accessKeyId: env.S3_ACCESS_KEY_ID as string,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY as string,
    region: env.S3_REGION ?? "auto",
    service: "s3",
  });
}

const objectUrl = (key: string) =>
  `${(env.S3_ENDPOINT as string).replace(/\/$/, "")}/${env.S3_BUCKET}/${key}`;

/**
 * Stores bytes privately and returns nothing — callers keep the key, never a
 * URL, so nothing durable ever points at an identity document.
 */
export async function putObject(
  key: string,
  body: Uint8Array,
  contentType: string,
): Promise<void> {
  if (!isObjectStoreConfigured()) {
    const path = join(DEV_UPLOAD_DIR, key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, body);
    console.warn(
      `\n[storage:dev] No S3 bucket configured — identity document written to disk, unencrypted.\n` +
        `  key:  ${key}\n  path: ${path}\n  This path must never be used outside development.\n`,
    );
    return;
  }

  const response = await client().fetch(objectUrl(key), {
    method: "PUT",
    body,
    headers: { "content-type": contentType },
  });
  if (!response.ok) {
    throw new Error(
      `Object store rejected upload (${response.status} ${response.statusText})`,
    );
  }
}

/**
 * A short-lived link for a reviewer. Presigned rather than proxied so the bytes
 * never pass through the app, and expiring so a copied link stops working.
 */
export async function signedDownloadUrl(key: string): Promise<string> {
  if (!isObjectStoreConfigured()) {
    return `data:text/plain;base64,${Buffer.from(
      `[dev] ${key} is on local disk; no bucket is configured.`,
    ).toString("base64")}`;
  }

  const signed = await client().sign(
    new Request(`${objectUrl(key)}?X-Amz-Expires=${SIGNED_URL_TTL_SECONDS}`),
    { aws: { signQuery: true } },
  );
  return signed.url;
}

/**
 * The bytes behind a key, or null if there are none. Unlike
 * `signedDownloadUrl` this does pass them through the app — an avatar is drawn
 * on every page, and a link that expires in two minutes cannot do that.
 * Callers must decide who is allowed to see the key before asking for it.
 */
export async function getObject(
  key: string,
): Promise<ReadableStream<Uint8Array> | Uint8Array | null> {
  if (!isObjectStoreConfigured()) {
    try {
      const file = await readFile(join(DEV_UPLOAD_DIR, key));
      return new Uint8Array(file);
    } catch {
      return null;
    }
  }

  const response = await client().fetch(objectUrl(key));
  if (!response.ok || !response.body) return null;
  return response.body;
}

/**
 * Best-effort removal, used when an object is replaced. A failure is logged
 * rather than thrown: the new object is already stored and the row already
 * points at it, so the only cost is one file nobody references.
 */
export async function deleteObject(key: string): Promise<void> {
  try {
    if (!isObjectStoreConfigured()) {
      await rm(join(DEV_UPLOAD_DIR, key), { force: true });
      return;
    }
    const response = await client().fetch(objectUrl(key), { method: "DELETE" });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error(`[storage:delete] ${key}`, error);
  }
}

/** Dev-only: reads back what the fallback wrote, so tests can assert on it. */
export async function readDevObject(key: string): Promise<Buffer> {
  return readFile(join(DEV_UPLOAD_DIR, key));
}
