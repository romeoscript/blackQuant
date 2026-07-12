import { z } from "zod";

/**
 * Validated environment variables. Import from here instead of reading
 * `process.env` directly so a missing/invalid var fails fast at startup
 * with a clear message rather than surfacing as a runtime error later.
 */
/** Treat empty strings (`FOO=`) as unset so optional vars stay optional. */
const optionalStr = z
  .string()
  .transform((v) => (v === "" ? undefined : v))
  .optional();

const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid connection string"),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
  AUTH_GITHUB_ID: optionalStr,
  AUTH_GITHUB_SECRET: optionalStr,
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
  throw new Error(`Invalid environment variables:\n${issues}`);
}

export const env = parsed.data;
