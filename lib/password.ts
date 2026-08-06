import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const derive = promisify(scrypt);

const SALT_BYTES = 16;
const KEY_BYTES = 64;
/** Prefix stored with every digest so the parameters can be changed later without guessing. */
const SCHEME = "scrypt";

/**
 * Hash a plaintext password for storage.
 *
 * Uses Node's built-in scrypt rather than a bcrypt/argon2 dependency — it is a
 * memory-hard KDF from the platform, so there is nothing to install or keep
 * patched. The salt is random per password and travels with the digest.
 */
export async function hashPassword(plaintext: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = (await derive(plaintext, salt, KEY_BYTES)) as Buffer;
  return `${SCHEME}:${salt.toString("hex")}:${key.toString("hex")}`;
}

/**
 * Check a plaintext password against a stored digest.
 *
 * Returns false rather than throwing on a malformed digest: callers treat this
 * as "wrong password", and a row that predates the current format should fail
 * closed rather than crash the sign-in route.
 */
export async function verifyPassword(
  plaintext: string,
  digest: string,
): Promise<boolean> {
  const [scheme, saltHex, keyHex] = digest.split(":");
  if (scheme !== SCHEME || !saltHex || !keyHex) return false;

  const expected = Buffer.from(keyHex, "hex");
  const actual = (await derive(
    plaintext,
    Buffer.from(saltHex, "hex"),
    expected.length,
  )) as Buffer;

  // timingSafeEqual throws on a length mismatch, so guard before comparing.
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
