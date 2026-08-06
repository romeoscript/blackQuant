import { z } from "zod";

const optionalStr = z
  .string()
  .transform((v) => (v === "" ? undefined : v))
  .optional();

const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid connection string"),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
  AUTH_GITHUB_ID: optionalStr,
  AUTH_GITHUB_SECRET: optionalStr,
  AUTH_GOOGLE_ID: optionalStr,
  AUTH_GOOGLE_SECRET: optionalStr,
  // Absolute origin used to build links in outgoing mail. Auth.js sets
  // AUTH_URL/NEXTAUTH_URL in most deploys; fall back to localhost in dev.
  AUTH_URL: optionalStr,
  // Transactional email. Without a key, mail is logged instead of sent.
  RESEND_API_KEY: optionalStr,
  MAIL_FROM: z.string().default("BlackQuant <onboarding@resend.dev>"),
  // Help Desk assistant — any OpenAI-compatible provider (DeepSeek by default).
  ASSISTANT_API_KEY: optionalStr,
  ASSISTANT_BASE_URL: optionalStr,
  ASSISTANT_MODEL: optionalStr,
  ASSISTANT_EMBED_MODEL: optionalStr,
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
