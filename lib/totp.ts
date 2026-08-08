import {
  createCipheriv,
  createDecipheriv,
  createHash,
  hkdfSync,
  randomBytes,
  randomInt,
} from "node:crypto";
import { Secret, TOTP } from "otpauth";
import { qrSvg } from "@/lib/qr";
import { env } from "@/lib/env";

const ISSUER = "BlackQuant";

/**
 * One step either side of now, so a clock a few seconds out of sync still
 * authenticates. Wider would meaningfully extend the window a stolen code is
 * replayable in.
 */
const CLOCK_SKEW_STEPS = 1;

export const RECOVERY_CODE_COUNT = 10;
const RECOVERY_CODE_BYTES = 5;

/**
 * Derived from AUTH_SECRET so 2FA needs no extra configuration. The tradeoff is
 * real and worth knowing: rotating AUTH_SECRET makes every stored secret
 * undecryptable, and enrolled users must fall back to a recovery code and
 * re-enroll. Rotating it already invalidates every session, so it is not a
 * routine operation.
 */
function encryptionKey(): Buffer {
  return Buffer.from(
    hkdfSync("sha256", env.AUTH_SECRET, "", "blackquant:totp:v1", 32),
  );
}

/** `iv.tag.ciphertext`, each base64url. */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const body = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), body]
    .map((b) => b.toString("base64url"))
    .join(".");
}

/** Null rather than throwing: an undecryptable secret is a state to handle. */
export function decryptSecret(payload: string): string | null {
  const parts = payload.split(".");
  if (parts.length !== 3) return null;

  try {
    const [iv, tag, body] = parts.map((p) => Buffer.from(p, "base64url"));
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

export function createTotpSecret(): string {
  return new Secret({ size: 20 }).base32;
}

function totpFor(secret: string, account: string): TOTP {
  return new TOTP({
    issuer: ISSUER,
    label: account,
    secret: Secret.fromBase32(secret),
  });
}

export function provisioningUri(secret: string, account: string): string {
  return totpFor(secret, account).toString();
}

export function provisioningQrSvg(secret: string, account: string): string {
  return qrSvg(provisioningUri(secret, account));
}

export function verifyTotp(secret: string, token: string): boolean {
  const cleaned = token.replace(/\D/g, "");
  if (cleaned.length !== 6) return false;
  return (
    totpFor(secret, ISSUER).validate({
      token: cleaned,
      window: CLOCK_SKEW_STEPS,
    }) !== null
  );
}

/** Only the digest is stored, so a leaked table cannot be replayed. */
export const hashRecoveryCode = (code: string) =>
  createHash("sha256").update(normaliseRecoveryCode(code)).digest("hex");

/** Accepts what the user typed however they typed it: case and dashes vary. */
export const normaliseRecoveryCode = (code: string) =>
  code.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

/**
 * Crockford-ish base32 without vowels, so a printed code cannot spell anything
 * and 0/O and 1/I cannot be confused when typed back in.
 */
const ALPHABET = "0123456789BCDFGHJKLMNPQRSTVWXZ";

export function generateRecoveryCodes(): string[] {
  return Array.from({ length: RECOVERY_CODE_COUNT }, () => {
    const chars = Array.from(
      { length: RECOVERY_CODE_BYTES * 2 },
      () => ALPHABET[randomInt(0, ALPHABET.length)],
    ).join("");
    return `${chars.slice(0, 5)}-${chars.slice(5)}`;
  });
}
