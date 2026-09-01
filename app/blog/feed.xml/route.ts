import { getAllPosts } from "@/lib/blog";
import { SITE_URL, siteUrl } from "@/lib/site";

/**
 * RSS 2.0 feed for the blog.
 *
 * A static segment, so it takes precedence over `/blog/[slug]` and is never
 * mistaken for a post called "feed.xml".
 *
 * Built from the same `getAllPosts` the index uses, so the feed cannot list a
 * post the site does not show — including drafts, which that function already
 * filters out of production.
 */

/** Escapes the five XML entities. Titles and excerpts are prose and will contain them. */
function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const posts = await getAllPosts();
  const self = siteUrl("/blog/feed.xml");

  const items = posts
    .map((post) => {
      const url = siteUrl(`/blog/${post.slug}`);
      return `    <item>
      <title>${xmlEscape(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${xmlEscape(post.excerpt)}</description>
      <category>${xmlEscape(post.category)}</category>
      <dc:creator>${xmlEscape(post.author.name)}</dc:creator>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
    </item>`;
    })
    .join("\n");

  // `lastBuildDate` follows the newest post rather than the clock, so a rebuild
  // that changed nothing does not tell every reader there is something new.
  const lastBuild = posts[0]
    ? new Date(posts[0].date).toUTCString()
    : new Date(0).toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>BlackQuant — Research &amp; Engineering Notes</title>
    <link>${SITE_URL}/blog</link>
    <description>How MEV markets actually work, what execution latency is really made of, and the measurements behind what we ship.</description>
    <language>en</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${self}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      // Readers poll on their own schedule; an hour keeps that cheap without
      // letting a new post sit unseen for long.
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
