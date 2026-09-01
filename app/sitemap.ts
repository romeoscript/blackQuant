import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { siteUrl } from "@/lib/site";

/**
 * The public sitemap.
 *
 * Only pages a crawler should reach are listed: the dashboard is behind auth
 * and the auth screens are not content, so neither belongs here. Blog posts are
 * appended from the content directory, which means publishing a post is still
 * just adding a file — nothing here needs updating alongside it.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: siteUrl("/about"), changeFrequency: "monthly", priority: 0.7 },
    { url: siteUrl("/blog"), changeFrequency: "weekly", priority: 0.9 },
    { url: siteUrl("/privacy"), changeFrequency: "yearly", priority: 0.3 },
    { url: siteUrl("/terms"), changeFrequency: "yearly", priority: 0.3 },
  ];

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: siteUrl(`/blog/${post.slug}`),
    lastModified: post.date,
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...postRoutes];
}
