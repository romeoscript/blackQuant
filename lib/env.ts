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
  RESEND_FROM: optionalStr,
  // Help Desk assistant — any OpenAI-compatible provider (DeepSeek by default).
  ASSISTANT_API_KEY: optionalStr,
  ASSISTANT_BASE_URL: optionalStr,
  ASSISTANT_MODEL: optionalStr,
  ASSISTANT_EMBED_MODEL: optionalStr,
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

/** The two shapes Resend accepts: `email@example.com` or `Name <email@example.com>`. */
const MAIL_FROM_PATTERN =
  /^(?:[^<>@\s]+@[^<>@\s]+\.[^<>@\s]+|[^<>]+<[^<>@\s]+@[^<>@\s]+\.[^<>@\s]+>)$/;

const parsed = envSchema
  // Checked at boot rather than at send time: a missing or malformed sender
  // otherwise surfaces as a 422 the first time someone resets their password,
  // and a stray quote left by dotenv is invisible in the value itself.
  .superRefine((v, ctx) => {
    if (!v.RESEND_API_KEY) return;
    if (!v.RESEND_FROM) {
      ctx.addIssue({
        code: "custom",
        path: ["RESEND_FROM"],
        message: "RESEND_FROM is required when RESEND_API_KEY is set",
      });
      return;
    }
    if (!MAIL_FROM_PATTERN.test(v.RESEND_FROM)) {
      ctx.addIssue({
        code: "custom",
        path: ["RESEND_FROM"],
        message: `RESEND_FROM must be "email@example.com" or "Name <email@example.com>" — got ${JSON.stringify(v.RESEND_FROM)}`,
      });
    }
  })
  .safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
  throw new Error(`Invalid environment variables:\n${issues}`);
}

export const env = parsed.data;
