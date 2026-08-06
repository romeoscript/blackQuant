import { env } from "@/lib/env";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

type Mail = {
  to: string;
  subject: string;
  /** Plain text only — every mail this app sends is a single link plus context. */
  body: string;
};

/**
 * Send a transactional email.
 *
 * Resend is called over its REST API when RESEND_API_KEY is set; there is no
 * SDK dependency because one `fetch` covers the whole surface we use. Without a
 * key the mail is written to the server log instead, so the reset flow is still
 * exercisable end to end in development. That fallback is deliberately noisy —
 * it must never look like a real delivery.
 */
export async function sendMail({ to, subject, body }: Mail): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.info(
      `\n[mail:dev] No RESEND_API_KEY set — not delivered.\n` +
        `  to:      ${to}\n  subject: ${subject}\n${body}\n`,
    );
    return;
  }

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: env.RESEND_FROM, to, subject, text: body }),
  });

  if (!response.ok) {
    // Surfaced to the caller so it can decide what the user sees; the body is
    // logged rather than returned because it can echo the recipient address.
    console.error(`[mail] Resend rejected the send: ${await response.text()}`);
    throw new Error(`Email delivery failed with status ${response.status}`);
  }
}
