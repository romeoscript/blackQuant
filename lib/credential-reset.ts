import { z } from "zod";

/** Long enough to arrive and be typed, short enough to limit guessing. */
export const CODE_TTL_MINUTES = 10;

/**
 * Guesses allowed against one code before it is burned. Six digits is a
 * ~1,000,000-wide space, so this cap — not the code length — is what makes
 * brute force impractical inside the TTL.
 */
export const MAX_CODE_ATTEMPTS = 5;

export const CODE_LENGTH = 6;

export const MIN_PASSWORD_LENGTH = 8;

export const codeSchema = z
  .string()
  .trim()
  .regex(new RegExp(`^\\d{${CODE_LENGTH}}$`), `Enter the ${CODE_LENGTH}-digit code`);

export const newPasswordSchema = z
  .object({
    code: codeSchema,
    password: z
      .string()
      .min(
        MIN_PASSWORD_LENGTH,
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      ),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });

/** `ada@example.com` → `a**@example.com`, so the screen can name the inbox. */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const head = local.slice(0, 1);
  return `${head}${"*".repeat(Math.max(local.length - 1, 1))}@${domain}`;
}
