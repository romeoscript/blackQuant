import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { getObject } from "@/lib/storage";
import { avatarContentType } from "@/lib/avatar";

/**
 * Serves the signed-in account's own uploaded picture, and only that: the key
 * comes from their row rather than from the request, so there is nothing to
 * point at somebody else's object.
 *
 * Cached hard because the URL carries the key's random part — a new upload is a
 * new URL, so a cached response can never be the wrong face. `private` keeps it
 * out of shared caches, since it is a different image per session.
 */
export async function GET() {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!Number.isInteger(userId)) {
    return new Response(null, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarKey: true },
  });
  const key = user?.avatarKey;
  if (!key) return new Response(null, { status: 404 });

  const body = await getObject(key);
  if (!body) return new Response(null, { status: 404 });

  return new Response(body, {
    headers: {
      "content-type": avatarContentType(key) ?? "application/octet-stream",
      "cache-control": "private, max-age=31536000, immutable",
    },
  });
}
