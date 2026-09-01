"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { sendMail } from "@/lib/mail";
import { rateLimit } from "@/lib/rate-limit";
import { CONTACT_INBOX, CONTACT_TOPICS } from "@/components/contact/data";

export type ContactState = {
  ok: boolean;
  message: string;
  /** Keyed by field name so the form can mark the offending input. */
  fieldErrors?: Partial<Record<"name" | "email" | "topic" | "message", string>>;
};

export const CONTACT_INITIAL: ContactState = { ok: false, message: "" };

const schema = z.object({
  name: z.string().trim().min(1, "Tell us your name.").max(100, "That name is too long."),
  email: z.email("Enter an email address we can reply to."),
  topic: z.enum(CONTACT_TOPICS, { message: "Choose a topic." }),
  message: z
    .string()
    .trim()
    .min(20, "A little more detail helps us route this to the right person.")
    .max(5000, "That is longer than our inbox accepts — send us the summary."),
});

/** Three per ten minutes per address. Enough to correct a mistake and resend. */
const LIMIT = { windowMs: 10 * 60 * 1000, max: 3 };

/**
 * The IP, read from proxy headers rather than a Request.
 *
 * A server action has no `Request` to hand to `getClientIp`, so the same two
 * headers are read directly here. Falling back to a single shared key is
 * deliberate: in local development every submission shares one bucket, which is
 * the safe direction to be wrong in.
 */
async function clientKey() {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  const ip = xff ? xff.split(",")[0]!.trim() : (h.get("x-real-ip") ?? "local");
  return `contact:${ip}`;
}

export async function submitContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  // Honeypot. A field hidden from people but filled by most naive bots; a hit
  // is answered with the success message so the bot has nothing to tune against.
  if (String(formData.get("company") ?? "") !== "") {
    return { ok: true, message: "Thanks — we'll be in touch shortly." };
  }

  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    topic: formData.get("topic"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    const fieldErrors: ContactState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof NonNullable<ContactState["fieldErrors"]>;
      fieldErrors[field] ??= issue.message;
    }
    return { ok: false, message: "Please check the highlighted fields.", fieldErrors };
  }

  const { ok, retryAfter } = rateLimit(await clientKey(), LIMIT);
  if (!ok) {
    const minutes = Math.ceil(retryAfter / 60);
    return {
      ok: false,
      message: `That's a few messages in a short window. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    };
  }

  const { name, email, topic, message } = parsed.data;

  try {
    await sendMail({
      to: CONTACT_INBOX,
      subject: `[${topic}] ${name}`,
      // Plain text, and the sender's address is in the body rather than the
      // From header: sending as the visitor would fail SPF for our domain, so
      // the mail comes from us and is replied to by hand.
      body: [
        `Topic:   ${topic}`,
        `Name:    ${name}`,
        `Email:   ${email}`,
        "",
        message,
      ].join("\n"),
    });
  } catch {
    // sendMail logs the provider's reason. The visitor gets a route that does
    // not depend on us — losing their message silently would be worse.
    return {
      ok: false,
      message: `We couldn't send that. Email ${CONTACT_INBOX} directly and we'll pick it up.`,
    };
  }

  return {
    ok: true,
    message: "Thanks — that's with us. You'll hear back within two working days.",
  };
}
