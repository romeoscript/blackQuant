/**
 * The blog's content layer: markdown files in `content/blog` become typed posts.
 *
 * Posts are repo files rather than database rows, so publishing is a commit and
 * every post is statically rendered. That also means a malformed post is a
 * build failure rather than a broken page in production, which is why the
 * frontmatter goes through zod instead of being cast — the error names the file
 * and the field.
 *
 * `cache` here is React's per-request dedupe, not a persistent cache. The index
 * page, its metadata export, the sitemap and the feed all ask for the post list
 * while rendering the same request; without it each one re-reads and re-parses
 * the whole directory.
 */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import matter from "gray-matter";
import { z } from "zod";
import { readingMinutes, renderMarkdown, type TocEntry } from "./blog-render";

const POSTS_DIR = path.join(process.cwd(), "content", "blog");

export type Author = {
  /** Display name on the byline. */
  name: string;
  role: string;
  /** Fallback avatar: the site has no author photos, so bylines use initials. */
  initials: string;
};

/**
 * Bylines live here rather than in each post's frontmatter so a change of role
 * is one edit instead of one per article. Posts reference a key; an unknown key
 * fails the build rather than rendering a blank byline.
 */
export const AUTHORS = {
  research: {
    name: "BlackQuant Research",
    role: "Research Desk",
    initials: "BQ",
  },
  romeo: {
    name: "Romeo Ogonna",
    role: "Founder & Engineering",
    initials: "RO",
  },
  engineering: {
    name: "BlackQuant Engineering",
    role: "Platform Team",
    initials: "BE",
  },
} as const satisfies Record<string, Author>;

export type AuthorKey = keyof typeof AUTHORS;

const frontmatterSchema = z.object({
  title: z.string().min(1),
  excerpt: z.string().min(1, "excerpt is used on cards and in social previews"),
  category: z.string().min(1),
  author: z.enum(
    Object.keys(AUTHORS) as [AuthorKey, ...AuthorKey[]],
    { message: `author must be one of: ${Object.keys(AUTHORS).join(", ")}` },
  ),
  // YAML parses an unquoted date into a Date; quoted, it arrives as a string.
  // Both are accepted and normalised to an ISO string below.
  date: z.coerce.date(),
  tags: z.array(z.string()).default([]),
  /** At most one post should set this; the index features the newest that does. */
  featured: z.boolean().default(false),
  /** Hidden from listings, feed and sitemap in production; visible in dev. */
  draft: z.boolean().default(false),
});

export type PostMeta = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  author: Author;
  /** ISO 8601, for `<time dateTime>` and the feed. */
  date: string;
  readingMinutes: number;
  featured: boolean;
  draft: boolean;
};

export type Post = PostMeta & { html: string; toc: TocEntry[] };

/** Drafts stay readable on a dev server and disappear from a production build. */
const showDrafts = process.env.NODE_ENV !== "production";

async function readPostFile(slug: string) {
  const raw = await readFile(path.join(POSTS_DIR, `${slug}.md`), "utf8");
  const { data, content } = matter(raw);

  const parsed = frontmatterSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid frontmatter in content/blog/${slug}.md:\n${issues}`);
  }

  const fm = parsed.data;
  const meta: PostMeta = {
    slug,
    title: fm.title,
    excerpt: fm.excerpt,
    category: fm.category,
    tags: fm.tags,
    author: AUTHORS[fm.author],
    date: fm.date.toISOString(),
    readingMinutes: readingMinutes(content),
    featured: fm.featured,
    draft: fm.draft,
  };

  return { meta, content };
}

/** Every published post, newest first. */
export const getAllPosts = cache(async (): Promise<PostMeta[]> => {
  let files: string[];
  try {
    files = await readdir(POSTS_DIR);
  } catch {
    // No content directory yet — an empty blog is a valid state, not a crash.
    return [];
  }

  const slugs = files
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));

  const posts = await Promise.all(slugs.map(async (s) => (await readPostFile(s)).meta));

  return posts
    .filter((p) => showDrafts || !p.draft)
    .sort((a, b) => b.date.localeCompare(a.date));
});

/** One post with its rendered body, or null when the slug has no file. */
export const getPost = cache(async (slug: string): Promise<Post | null> => {
  // Keeps a crafted slug from walking out of the content directory.
  if (!/^[a-z0-9-]+$/.test(slug)) return null;

  let file: Awaited<ReturnType<typeof readPostFile>>;
  try {
    file = await readPostFile(slug);
  } catch (err) {
    // A missing file is a 404; anything else is an authoring error worth surfacing.
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }

  if (file.meta.draft && !showDrafts) return null;

  const { html, toc } = await renderMarkdown(file.content);
  return { ...file.meta, html, toc };
});

/** The post the index leads with — newest flagged, else newest overall. */
export const getFeaturedPost = cache(async (): Promise<PostMeta | null> => {
  const posts = await getAllPosts();
  return posts.find((p) => p.featured) ?? posts[0] ?? null;
});

/** Categories present in the content, with counts, most-used first. */
export const getCategories = cache(
  async (): Promise<{ name: string; count: number }[]> => {
    const counts = new Map<string, number>();
    for (const post of await getAllPosts()) {
      counts.set(post.category, (counts.get(post.category) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  },
);

/**
 * Posts to read next: same category first, then the newest of anything else so
 * the slot is always filled. A post never relates to itself.
 */
export const getRelatedPosts = cache(
  async (slug: string, limit = 3): Promise<PostMeta[]> => {
    const posts = await getAllPosts();
    const current = posts.find((p) => p.slug === slug);
    if (!current) return [];

    const others = posts.filter((p) => p.slug !== slug);
    const sameCategory = others.filter((p) => p.category === current.category);
    const rest = others.filter((p) => p.category !== current.category);

    return [...sameCategory, ...rest].slice(0, limit);
  },
);

/** Long form for post headers and cards — e.g. "14 August 2026". */
export function formatPostDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
