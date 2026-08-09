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
  // Private object storage for KYC documents. Any S3-compatible endpoint —
  // AWS S3, Cloudflare R2, Backblaze B2, MinIO. Without a bucket configured,
  // uploads fall back to a local directory that is development-only.
  S3_ENDPOINT: optionalStr,
  S3_REGION: optionalStr,
  S3_BUCKET: optionalStr,
  S3_ACCESS_KEY_ID: optionalStr,
  S3_SECRET_ACCESS_KEY: optionalStr,
  // Crypto deposits through NOWPayments. Without an API key the deposit page
  // cannot provision addresses and says so; the IPN route rejects everything.
  NOWPAYMENTS_API_KEY: optionalStr,
  NOWPAYMENTS_IPN_SECRET: optionalStr,
  NOWPAYMENTS_BASE_URL: optionalStr,
  // The dexwatch signal engine — a separate process serving the live feed and
  // the measured strategy stats. Without a base URL the Signal Engine screen
  // says it isn't connected rather than showing invented numbers.
  //
  // The key is only needed when the engine is bound off the loopback
  // interface; a local engine accepts writes without one, and refuses them
  // entirely when it is remote and no key was configured on its side.
  SIGNAL_ENGINE_BASE_URL: optionalStr,
  SIGNAL_ENGINE_API_KEY: optionalStr,
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
  // An API key without the IPN secret is the dangerous half-configuration:
  // addresses get handed out and money arrives, but every callback that would
  // credit it fails signature verification. Caught at boot, not at deposit time.
  .superRefine((v, ctx) => {
    if (!v.NOWPAYMENTS_API_KEY) return;
    for (const key of ["NOWPAYMENTS_IPN_SECRET", "NOWPAYMENTS_BASE_URL"] as const) {
      if (!v[key]) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: `${key} is required when NOWPAYMENTS_API_KEY is set`,
        });
      }
    }
  })
  // A relative or half-typed engine URL fails at `fetch` time, which on this
  // screen looks identical to the engine being down — one is a typo in a
  // deploy config and the other is an outage, so they are separated here.
  .superRefine((v, ctx) => {
    if (v.SIGNAL_ENGINE_BASE_URL && !URL.canParse(v.SIGNAL_ENGINE_BASE_URL)) {
      ctx.addIssue({
        code: "custom",
        path: ["SIGNAL_ENGINE_BASE_URL"],
        message: `SIGNAL_ENGINE_BASE_URL must be an absolute URL such as http://127.0.0.1:8820 — got ${JSON.stringify(v.SIGNAL_ENGINE_BASE_URL)}`,
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
