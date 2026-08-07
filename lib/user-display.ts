/**
 * Only the fields this module reads. Widened from `AuthUser` so a caller
 * holding a profile row rather than a session can reuse it instead of
 * fabricating a session-shaped object.
 */
type IdentitySource = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
};

export type UserIdentity = {
  displayName: string;
  /** One or two letters for the avatar fallback. */
  initials: string;
  /** The account id as shown in the UI, or null before the session resolves. */
  uid: string | null;
};

const PLACEHOLDER: UserIdentity = {
  displayName: "Account",
  initials: "··",
  uid: null,
};

/**
 * Derives what the chrome shows for the current user. Shared by the topbar and
 * the mobile drawer so the two cannot drift, and so neither has to decide what
 * to render while the session is still loading.
 *
 * OAuth accounts can arrive with no name, so the email local-part is the
 * fallback before the generic placeholder.
 */
export function userIdentity(user: IdentitySource | null | undefined): UserIdentity {
  if (!user) return PLACEHOLDER;

  const named = user.name?.trim();
  const localPart = user.email?.split("@")[0]?.trim();
  const displayName = named || localPart || PLACEHOLDER.displayName;

  return {
    displayName,
    initials: initialsOf(displayName),
    uid: user.id ?? null,
  };
}

function initialsOf(displayName: string): string {
  const words = displayName.split(/[\s._-]+/).filter(Boolean);
  if (words.length === 0) return PLACEHOLDER.initials;

  const letters =
    words.length === 1
      ? words[0].slice(0, 2)
      : `${words[0][0]}${words[words.length - 1][0]}`;

  return letters.toUpperCase();
}
