import type { Metadata } from "next";
import { BookOpen, Mail, Rss } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAllPosts, getCategories, getFeaturedPost } from "@/lib/blog";
import { Reveal } from "@/components/landing/reveal";
import { ScrollProgress } from "@/components/landing/scroll-progress";
import { Nav } from "@/components/landing/nav";
import { SiteFooter } from "@/components/landing/site-footer";
import { ContactCta } from "@/components/landing/contact-cta";
import { AssistantWidget } from "@/components/assistant/assistant-widget";
import { CategoryFilter } from "@/components/blog/category-filter";
import { FeaturedCard, PostCard } from "@/components/blog/post-card";

/** Matches the band padding used by the About and legal pages. */
const PAD = "px-6 sm:px-8 md:px-16";
const CARD_STAGGER = 70;

export const metadata: Metadata = {
  title: "Blog · BlackQuant",
  description:
    "Research and engineering notes from the BlackQuant desk — MEV market structure, execution latency, on-chain custody and how we measure what we build.",
  alternates: { canonical: "/blog", types: { "application/rss+xml": "/blog/feed.xml" } },
};

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const [posts, categories, featured] = await Promise.all([
    getAllPosts(),
    getCategories(),
    getFeaturedPost(),
  ]);

  // An unknown `?category=` filters to nothing rather than silently showing
  // everything, so a stale or mistyped link is visibly wrong instead of
  // quietly pretending to be the unfiltered view.
  const filtering = category !== undefined;
  const visible = filtering ? posts.filter((p) => p.category === category) : posts;

  // The featured post leads the page, so it is dropped from the grid below it.
  // Under a filter there is no lead card, and it belongs in the grid again.
  const grid = filtering ? visible : visible.filter((p) => p.slug !== featured?.slug);

  return (
    <main className="min-h-screen bg-bq-bg font-satoshi text-bq-heading">
      <ScrollProgress />
      <Nav />

      <section className={cn("relative overflow-hidden bg-bq-bg pt-[87px]", PAD)}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in srgb, var(--bq-green) 8%, transparent), transparent 70%)",
          }}
        />
        <div className="relative mx-auto flex max-w-[768px] flex-col items-center gap-5 py-14 text-center md:py-20">
          <span className="flex items-center gap-2 rounded-full border border-bq-green/20 bg-bq-green/[0.08] px-4 py-1.5">
            <BookOpen className="size-3 text-bq-green" />
            <span className="text-[11px] font-bold text-bq-green">From the desk</span>
          </span>
          <h1 className="font-satoshi text-[28px] font-bold leading-[1.25] tracking-tight text-bq-heading md:text-[48px]">
            Research &amp; Engineering Notes
          </h1>
          <p className="text-[13px] leading-[1.63] text-bq-muted md:text-[18px]">
            How MEV markets actually work, what execution latency is really made of,
            and the measurements behind what we ship. No hype, no signals for sale.
          </p>
        </div>
      </section>

      {posts.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {!filtering && featured && (
            <section className={cn("bg-bq-bg pb-2", PAD)}>
              <Reveal className="mx-auto max-w-[1040px]">
                <FeaturedCard post={featured} />
              </Reveal>
            </section>
          )}

          <section className={cn("bg-bq-bg py-10 md:py-14", PAD)}>
            <div className="mx-auto max-w-[1040px]">
              <Reveal className="flex flex-wrap items-center justify-between gap-4">
                <CategoryFilter
                  categories={categories}
                  active={category}
                  total={posts.length}
                />
                <a
                  href="/blog/feed.xml"
                  className="flex items-center gap-1.5 text-[12px] font-bold text-bq-muted transition-colors hover:text-bq-green"
                >
                  <Rss className="size-3.5" />
                  RSS
                </a>
              </Reveal>

              {grid.length === 0 ? (
                <NoMatches category={category} />
              ) : (
                <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {grid.map((post, i) => (
                    <Reveal key={post.slug} delay={i * CARD_STAGGER} className="h-full">
                      <PostCard post={post} />
                    </Reveal>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className={cn("bg-bq-bg pb-14 md:pb-20", PAD)}>
            <Reveal className="mx-auto max-w-[1040px]">
              <ContactCta
                title="Want these in your inbox?"
                body="We publish when we have something measured to say — usually a few times a month. No signals, no referral spam."
                actions={[
                  { icon: Rss, label: "RSS feed", href: "/blog/feed.xml" },
                  {
                    icon: Mail,
                    prefix: "Email ",
                    label: "the desk",
                    href: "mailto:research@blackquant.io",
                    primary: true,
                  },
                ]}
              />
            </Reveal>
          </section>
        </>
      )}

      <SiteFooter />
      <AssistantWidget />
    </main>
  );
}

function EmptyState() {
  return (
    <section className={cn("bg-bq-bg py-20 text-center", PAD)}>
      <p className="text-[14px] text-bq-muted">
        No posts published yet. Check back shortly.
      </p>
    </section>
  );
}

function NoMatches({ category }: { category?: string }) {
  return (
    <p className="mt-10 text-[13px] text-bq-muted">
      Nothing filed under{" "}
      <span className="font-bold text-bq-heading">{category}</span> yet.
    </p>
  );
}
