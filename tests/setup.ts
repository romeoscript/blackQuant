import { vi } from "vitest";
import { loadEnv } from "../scripts/load-env";

/**
 * These are integration tests: they run against a real Postgres, because the
 * behaviour under test — that a replayed callback cannot credit twice — is
 * enforced by a unique constraint. Mocking the database would assert the mock.
 *
 * They create and delete their own rows, all under the `@ipn.test` email
 * domain, but they are still writes. Refuse to run against a production
 * database rather than trust that nobody ever points one here.
 */
await loadEnv();

if (process.env.NODE_ENV === "production") {
  throw new Error("Refusing to run integration tests with NODE_ENV=production");
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is required — these tests need a database. Copy .env.example to .env.",
  );
}

// Set rather than defaulted, so the suite signs with a known secret regardless
// of what the developer has configured locally.
process.env.NOWPAYMENTS_IPN_SECRET = "test-ipn-secret";
process.env.AUTH_SECRET ??= "test-auth-secret";

// Server actions call `revalidatePath`, which needs a Next request context that
// does not exist under vitest. Stubbed so an action can be tested as a plain
// function; what it revalidates is Next's concern, not this suite's.
vi.mock("next/cache", () => ({
  revalidatePath: () => {},
  revalidateTag: () => {},
}));
