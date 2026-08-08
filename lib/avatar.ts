/**
 * Profile pictures. Separate from `lib/kyc` on purpose: an avatar is served
 * back to the browser on every page, where an identity document never is, so
 * the two have different limits and different handling.
 */

/**
 * The upload is downscaled in the browser before it is sent, so this only has
 * to be generous enough for a phone photo — it is not the size we store.
 */
export const MAX_AVATAR_BYTES = 6 * 1024 * 1024;

/** Longest edge kept when downscaling. Twice the largest place it is drawn. */
export const AVATAR_MAX_EDGE = 512;

/**
 * Accepted types and the extension each is stored under. The extension is how
 * the serving route knows what to send back, which saves a column.
 */
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const CONTENT_TYPES: Record<string, string> = Object.fromEntries(
  Object.entries(EXTENSIONS).map(([type, ext]) => [ext, type]),
);

export const AVATAR_ACCEPT_ATTRIBUTE = Object.keys(EXTENSIONS).join(",");

export const avatarExtension = (contentType: string): string | undefined =>
  EXTENSIONS[contentType];

export const isAcceptedAvatar = (contentType: string): boolean =>
  contentType in EXTENSIONS;

/** What to send a stored object back as, derived from its key. */
export function avatarContentType(key: string): string | undefined {
  return CONTENT_TYPES[key.slice(key.lastIndexOf(".") + 1)];
}

type AvatarSource = {
  /** Our own upload, an object-store key. */
  avatarKey?: string | null;
  /** An OAuth provider's avatar, an absolute URL. */
  image?: string | null;
};

/**
 * Where to point an `<img>`, or null when the account has no picture and the
 * initials should be drawn instead.
 *
 * An upload wins over the provider's picture: it is the one the user chose
 * here. Its URL carries the key's random part so a new upload is a new URL —
 * the route can then be cached hard without a stale face surviving a change.
 */
export function avatarUrl(user: AvatarSource | null | undefined): string | null {
  if (!user) return null;
  if (user.avatarKey) {
    const name = user.avatarKey.slice(user.avatarKey.lastIndexOf("/") + 1);
    return `/api/avatar?v=${encodeURIComponent(name)}`;
  }
  return user.image ?? null;
}
