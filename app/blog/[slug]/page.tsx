import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { siteUrl } from "@/lib/site";
import { getAllPosts, getPost, getRelatedPosts } from "@/lib/blog";
import { Reveal } from "@/components/landing/reveal";
import { ScrollProgress } from "@/components/landing/scroll-progress";
import { Nav } from "@/components/landing/nav";
import { SiteFooter } from "@/components/landing/site-footer";
import { AssistantWidget } from "@/components/assistant/assistant-widget";
import { Byline, CategoryPill, ReadingTime, RelatedCard } from "@/components/blog/post-card";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { ShareRow } from "@/components/blog/share-row";

const PAD = "px-6 sm:px-8 md:px-16";

/**
 * The full set of valid slugs, enumerated from the content directory.
 *
 * Paired with `dynamicParams = false`, any slug outside this list is a 404 at
 * the routing layer — no filesystem lookup, and no render attempted for a file
 * that cannot exist.
 *
 * Worth knowing: this does *not* currently produce prerendered pages. The root
 * layout awaits `auth()`, which opts every route in the app into on-demand
 * rendering — `next build` marks all of them dynamic, not just these. If the
 * layout ever stops reading the session, these pages become statically
 * generated for free, because the param list is already here.
 */
export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post not found · BlackQuant" };

  const url = siteUrl(`/blog/${post.slug}`);
  return {
    title: `${post.title} · BlackQuant`,
    description: post.excerpt,
    authors: [{ name: post.author.name }],
    keywords: post.tags,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.excerpt,
      publishedTime: post.date,
      authors: [post.author.name],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const related = await getRelatedPosts(slug);
  const url = siteUrl(`/blog/${post.slug}`);

  // Structured data so the article is eligible for a rich result. Built from
  // the same fields the page renders, so the two cannot drift apart.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: post.author.name },
    publisher: { "@type": "Organization", name: "BlackQuant" },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    keywords: post.tags.join(", "),
  };

  return (
    <main className="min-h-screen bg-bq-bg font-satoshi text-bq-heading">
      <ScrollProgress />
      <Nav />

      <script
        type="application/ld+json"
        // Serialised from values this file controls, not from user input.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article>
        <header className={cn("relative overflow-hidden bg-bq-bg pt-[87px]", PAD)}>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in srgb, var(--bq-green) 7%, transparent), transparent 70%)",
            }}
          />
          <div className="relative mx-auto max-w-[760px] py-12 md:py-16">
            <Link
              href="/blog"
              className="flex w-fit items-center gap-2 text-[12px] font-bold text-bq-muted transition-colors hover:text-bq-green"
            >
              <ArrowLeft className="size-3.5" />
              All posts
            </Link>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <CategoryPill category={post.category} />
              <ReadingTime minutes={post.readingMinutes} />
            </div>

            <h1 className="mt-4 font-satoshi text-[28px] font-bold leading-[1.2] tracking-tight text-bq-heading md:text-[44px]">
              {post.title}
            </h1>

            <p className="mt-4 text-[14px] leading-[1.7] text-bq-muted md:text-[18px]">
              {post.excerpt}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-bq-border pt-6">
              <Byline post={post} showRole />
              <ShareRow url={url} title={post.title} />
            </div>
          </div>
        </header>

        <div className={cn("bg-bq-bg pb-14 md:pb-20", PAD)}>
          {/* The contents rail is a second column only where there is room for
              one beside a 760px measure; below that the article is the page. */}
          <div className="mx-auto grid max-w-[1040px] gap-12 lg:grid-cols-[minmax(0,760px)_200px]">
            <div
              className="bq-prose"
              dangerouslySetInnerHTML={{ __html: post.html }}
            />

            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <TableOfContents entries={post.toc} />
              </div>
            </aside>
          </div>

          <div className="mx-auto mt-12 max-w-[760px] border-t border-bq-border pt-6">
            <ShareRow url={url} title={post.title} />
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className={cn("border-t border-bq-border bg-bq-overlay/[0.01] py-12 md:py-16", PAD)}>
          <div className="mx-auto max-w-[1040px]">
            <h2 className="font-satoshi text-[17px] font-bold tracking-tight text-bq-heading md:text-[26px]">
              Keep reading
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {related.map((r, i) => (
                <Reveal key={r.slug} delay={i * 70} className="h-full">
                  <RelatedCard post={r} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <SiteFooter />
      <AssistantWidget />
    </main>
  );
}
