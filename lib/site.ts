/**
 * The deployment's own origin, for anything that needs an absolute URL:
 * `metadataBase`, canonical links, Open Graph tags, the RSS feed and the
 * sitemap.
 *
 * A relative URL is fine inside the app but wrong in all of those — a feed
 * reader and a crawler resolve links against their own host, not ours, so
 * `/blog/x` in a feed points at the wrong site entirely.
 *
 * `AUTH_URL` is reused because Auth.js already requires the same value in every
 * deploy, and having two variables that must agree is a way to have them
 * disagree. `NEXT_PUBLIC_SITE_URL` overrides it where the public origin and the
 * auth origin genuinely differ.
 */
const RAW =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.AUTH_URL ??
  "http://localhost:3000";

/** Normalised without a trailing slash, so `${SITE_URL}/blog` is never `//blog`. */
export const SITE_URL = RAW.replace(/\/+$/, "");

export const siteUrl = (path: string) =>
  `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
