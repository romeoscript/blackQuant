import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPostDate, type PostMeta } from "@/lib/blog";

/**
 * Cards and bylines for the blog index and the related-posts rail.
 *
 * The site has no author photography, so a byline is initials in a token — the
 * same treatment the dashboard uses for accounts without an avatar. It keeps
 * the row from collapsing into undifferentiated grey text without inventing a
 * portrait for a research desk.
 */

export function CategoryPill({ category }: { category: string }) {
  return (
    <span className="w-fit rounded-full border border-bq-green/20 bg-bq-green/[0.08] px-2.5 py-1 font-plex text-[10px] uppercase tracking-[1.5px] text-bq-green">
      {category}
    </span>
  );
}

export function Byline({
  post,
  showRole = false,
}: {
  post: PostMeta;
  showRole?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-full border border-bq-border bg-bq-surface font-plex text-[10px] font-bold text-bq-muted"
      >
        {post.author.initials}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[12px] font-bold text-bq-heading">
          {post.author.name}
        </p>
        <p className="truncate text-[11px] text-bq-dim">
          {showRole ? `${post.author.role} · ` : ""}
          <time dateTime={post.date}>{formatPostDate(post.date)}</time>
        </p>
      </div>
    </div>
  );
}

export function ReadingTime({ minutes }: { minutes: number }) {
  return (
    <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-bq-dim">
      <Clock className="size-3" />
      {minutes} min read
    </span>
  );
}

/** Standard card for the index grid and the related rail. */
export function PostCard({ post }: { post: PostMeta }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex h-full flex-col rounded-2xl border border-bq-border bg-bq-card p-5 transition-colors hover:border-bq-green/30 md:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <CategoryPill category={post.category} />
        <ArrowUpRight className="size-4 shrink-0 text-bq-dim transition-colors group-hover:text-bq-green" />
      </div>

      <h3 className="mt-4 font-satoshi text-[17px] font-bold leading-[1.3] tracking-tight text-bq-heading">
        {post.title}
      </h3>

      {/* `flex-1` on the excerpt pins every card's byline to the bottom, so a
          grid row of uneven summaries still lines its footers up. */}
      <p className="mt-2.5 flex-1 text-[13px] leading-[1.7] text-bq-muted">
        {post.excerpt}
      </p>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-bq-border-soft pt-4">
        <Byline post={post} />
        <ReadingTime minutes={post.readingMinutes} />
      </div>
    </Link>
  );
}

/** The lead article — one per index, given the full column width. */
export function FeaturedCard({ post }: { post: PostMeta }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group relative block overflow-hidden rounded-3xl border border-bq-border bg-bq-card p-6 transition-colors hover:border-bq-green/30 md:p-10"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 60% 80% at 100% 0%, color-mix(in srgb, var(--bq-green) 7%, transparent), transparent 70%)",
        }}
      />
      <div className="relative">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="rounded-full border border-bq-border bg-bq-overlay/[0.03] px-2.5 py-1 font-plex text-[10px] uppercase tracking-[1.5px] text-bq-muted">
            Latest
          </span>
          <CategoryPill category={post.category} />
        </div>

        <h2 className="mt-5 max-w-[760px] font-satoshi text-[24px] font-bold leading-[1.2] tracking-tight text-bq-heading md:text-[38px]">
          {post.title}
        </h2>

        <p className="mt-4 max-w-[640px] text-[14px] leading-[1.75] text-bq-muted md:text-[16px]">
          {post.excerpt}
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-bq-border-soft pt-5">
          <Byline post={post} showRole />
          <div className="flex items-center gap-4">
            <ReadingTime minutes={post.readingMinutes} />
            <span className="flex items-center gap-1.5 text-[12px] font-bold text-bq-green">
              Read
              <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/** Compact row used under an article, where vertical space is scarcer. */
export function RelatedCard({ post, className }: { post: PostMeta; className?: string }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group flex h-full flex-col rounded-2xl border border-bq-border bg-bq-card p-5 transition-colors hover:border-bq-green/30",
        className,
      )}
    >
      <CategoryPill category={post.category} />
      <h3 className="mt-3 flex-1 font-satoshi text-[15px] font-bold leading-[1.35] tracking-tight text-bq-heading">
        {post.title}
      </h3>
      <div className="mt-4 flex items-center gap-3 text-[11px] text-bq-dim">
        <time dateTime={post.date}>{formatPostDate(post.date)}</time>
        <span aria-hidden>·</span>
        <span>{post.readingMinutes} min</span>
      </div>
    </Link>
  );
}
