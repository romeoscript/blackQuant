// Replay signed NOWPayments IPN callbacks at a running dev server.
//
// The deposit flow's only interesting half is the callback, and waiting for a
// real chain to confirm is a slow way to test it. This signs a payload with
// NOWPAYMENTS_IPN_SECRET exactly as NOWPayments does — sorted keys, HMAC-SHA512,
// hex — and posts it, so the whole credit path is exercisable without an
// account, an API key, or a tunnel.
//
// It mints balances out of nothing, so it refuses to talk to anything but
// localhost unless you insist with --force.
//
//   npm run ipn -- --email you@example.com --asset BTC --amount 250 --paid 0.0023
//   npm run ipn -- --email you@example.com --asset XRP --amount 100
//   npm run ipn -- --email you@example.com --asset BTC --status confirming --confirmations 3
//   npm run ipn -- --email you@example.com --asset BTC --amount 250 --tamper
//   npm run ipn -- --email you@example.com --asset BTC --amount 250 \
//                  --payment-id dev-123          # same id twice: proves idempotency
//   npm run ipn -- --email you@example.com --asset BTC --amount 250 \
//                  --outcome-currency btc        # proves the auto-conversion guard
//
import crypto from "crypto";
import { loadEnv } from "./load-env";

type Args = Record<string, string | boolean>;

function parseArgs(argv: string[]): Args {
  const args: Args = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i++;
    }
  }
  return args;
}

const str = (v: string | boolean | undefined) =>
  typeof v === "string" ? v : undefined;

/** Sorted keys, recursively — the form NOWPayments signs over. */
function canonicalise(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalise);
  if (value && typeof value === "object") {
    return Object.keys(value as object)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = canonicalise((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return value;
}

function sign(body: unknown, secret: string): string {
  return crypto
    .createHmac("sha512", secret)
    .update(JSON.stringify(canonicalise(body)))
    .digest("hex");
}

const usd = (d: { toFixed(n: number): string }) => `$${d.toFixed(2)}`;

async function main() {
  await loadEnv();

  const args = parseArgs(process.argv.slice(2));

  const secret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!secret) {
    console.error(
      "NOWPAYMENTS_IPN_SECRET is not set.\n" +
        "For local testing any value works — it only has to match what the server has.\n" +
        'Put e.g. NOWPAYMENTS_IPN_SECRET="dev-secret" in .env and restart the dev server.',
    );
    process.exit(1);
  }

  const target = str(args.url) ?? process.env.AUTH_URL ?? "http://localhost:3000";
  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(target);
  if (!isLocal && !args.force) {
    console.error(
      `Refusing to send to ${target}.\n` +
        "This script credits real balances. Pass --force if that is genuinely what you want.",
    );
    process.exit(1);
  }

  // Imported here, not at the top: lib/prisma pulls in lib/env, which validates
  // at module scope and would throw before loadEnv() had run.
  const prismaModule = await import("../lib/prisma");
  const prisma = (prismaModule as { default: typeof prismaModule.default }).default;
  const { depositAsset } = await import("../lib/deposit");

  const email = str(args.email);
  const user = email
    ? await prisma.user.findUnique({ where: { email } })
    : await prisma.user.findFirst({ orderBy: { id: "asc" } });

  if (!user) {
    console.error(
      email ? `No user with email ${email}.` : "No users in the database.",
    );
    process.exit(1);
  }
  if (!email) console.log(`No --email given, using ${user.email}.`);

  const symbol = (str(args.asset) ?? "BTC").toUpperCase();
  const asset = depositAsset(symbol);
  if (!asset) {
    console.error(`Unknown asset ${symbol}.`);
    process.exit(1);
  }

  // A locally seeded address, so this works with no NOWPayments account at all.
  // Real provisioning mints these through the API; the shape is identical.
  const shared = "sharedAddress" in asset && asset.sharedAddress;
  let address = await prisma.depositAddress.findUnique({
    where: { userId_currency: { userId: user.id, currency: asset.currency } },
  });
  if (!address) {
    address = await prisma.depositAddress.create({
      data: {
        userId: user.id,
        currency: asset.currency,
        address: shared
          ? `dev-shared-${asset.currency}`
          : `dev-${asset.currency}-${user.id}`,
        // Shared-address chains identify the user by tag, never by address.
        extraId: shared ? String(100000 + user.id) : null,
        npPaymentId: `dev-seed-${user.id}-${asset.currency}`,
      },
    });
    console.log(
      `Seeded a development ${symbol} address (not registered with NOWPayments).`,
    );
  }

  const paymentId = str(args["payment-id"]) ?? `dev-${Date.now()}`;
  const amount = str(args.amount) ?? "250.00";
  // Crypto actually sent. Defaults to the dollar figure, which is fine for a
  // stablecoin and nonsense for BTC — pass --paid to make a demo look real.
  const paid = str(args.paid) ?? amount;
  const outcomeCurrency = str(args["outcome-currency"]) ?? "usdttrc20";
  const confirmations = Number(str(args.confirmations) ?? 6);

  // One status if asked for, otherwise the whole life of a deposit.
  const statuses = str(args.status)
    ? [str(args.status)!]
    : ["waiting", "confirming", "finished"];

  console.log(
    `\n${user.email} · ${symbol} · payment ${paymentId}\n` +
      `→ ${target}/api/deposit/ipn\n`,
  );

  for (const status of statuses) {
    const finished = status === "finished";
    const body: Record<string, unknown> = {
      payment_id: paymentId,
      pay_address: address.address,
      payment_status: status,
      pay_currency: asset.currency,
      actually_paid: status === "waiting" ? "0" : paid,
      outcome_amount: finished ? amount : "0",
      outcome_currency: outcomeCurrency,
      confirmations: status === "waiting" ? 0 : confirmations,
      payin_hash: `0xdev${paymentId}`,
      ...(address.extraId ? { payin_extra_id: address.extraId } : {}),
    };

    // A signature over a *different* body: what a tampered callback looks like.
    const signature = args.tamper
      ? sign({ ...body, outcome_amount: "999999" }, secret)
      : sign(body, secret);

    const response = await fetch(`${target}/api/deposit/ipn`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-nowpayments-sig": signature,
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    console.log(
      `  ${status.padEnd(11)} → ${response.status} ${text}` +
        (args.tamper ? "   (tampered: 401 is the correct answer)" : ""),
    );
  }

  const [after, entries, event] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { balanceUsd: true },
    }),
    prisma.ledgerEntry.count({ where: { userId: user.id } }),
    prisma.depositEvent.findUnique({ where: { npPaymentId: paymentId } }),
  ]);

  console.log(
    `\n  balance   ${usd(after!.balanceUsd)}\n` +
      `  ledger    ${entries} entr${entries === 1 ? "y" : "ies"}\n` +
      `  deposit   ${event ? `${event.status}, ${event.confirmations} conf, credited ${usd(event.usdCredited)}` : "no row"}` +
      (event?.heldReason ? `\n  HELD      ${event.heldReason}` : "") +
      "\n",
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
