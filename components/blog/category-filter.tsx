import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Category filter for the index.
 *
 * Plain links over a `?category=` search param rather than client-side state:
 * each filtered view then has its own URL that can be linked, shared and
 * indexed, and the page stays a server component with no JavaScript shipped for
 * what is ultimately a list of links.
 */
export function CategoryFilter({
  categories,
  active,
  total,
}: {
  categories: { name: string; count: number }[];
  active?: string;
  total: number;
}) {
  return (
    <nav aria-label="Filter posts by category" className="flex flex-wrap gap-2">
      <FilterLink href="/blog" label="All" count={total} active={!active} />
      {categories.map(({ name, count }) => (
        <FilterLink
          key={name}
          href={`/blog?category=${encodeURIComponent(name)}`}
          label={name}
          count={count}
          active={active === name}
        />
      ))}
    </nav>
  );
}

function FilterLink({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      // `scroll={false}` keeps the viewport where it is when a filter changes;
      // the default would jump back to the top, away from the list just clicked.
      scroll={false}
      className={cn(
        "flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12px] font-bold transition-colors",
        active
          ? "border-bq-green/30 bg-bq-green/[0.08] text-bq-green"
          : "border-bq-border bg-bq-card text-bq-muted hover:border-bq-green/20 hover:text-bq-heading",
      )}
    >
      {label}
      <span className={cn("font-plex text-[10px]", active ? "text-bq-green/70" : "text-bq-dim")}>
        {count}
      </span>
    </Link>
  );
}
