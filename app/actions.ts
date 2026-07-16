"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

export type JoinState = { ok: boolean; message: string };

const emailSchema = z.email();

/** Luminary Circle waitlist signup — persists the email, deduped by address. */
export async function joinLuminaryCircle(
  _prev: JoinState,
  formData: FormData,
): Promise<JoinState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) {
    return { ok: false, message: "Enter a valid email address." };
  }

  try {
    await prisma.subscriber.create({
      data: { email: parsed.data, source: "luminary-circle" },
    });
    return { ok: true, message: "You're in. Welcome to the Luminary Circle." };
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return { ok: true, message: "You're already on the list — welcome back." };
    }
    return { ok: false, message: "Something went wrong. Please try again." };
  }
}
