import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import { ScrollText } from "lucide-react";
import { renderMarkdown } from "@/lib/blog-render";
import { Reveal } from "@/components/landing/reveal";
import { Band, PageHero, PageShell } from "@/components/marketing/page-shell";

export const metadata: Metadata = {
  title: "Changelog · BlackQuant",
  description:
    "Notable changes to BlackQuant, in Keep a Changelog format and semantic versioning order.",
  alternates: { canonical: "/changelog" },
};

/**
 * The page renders `changelog.md` from the repo root, so the file a release
 * commit edits *is* the published page — there is no second copy to forget.
 *
 * The leading `# Changelog` is stripped because `PageHero` already supplies the
 * document title; rendering both would put two `h1`s in the outline. Everything
 * below it, including the Keep a Changelog preamble, is rendered as written.
 */
async function getChangelogHtml(): Promise<string> {
  const markdown = await readFile(
    path.join(process.cwd(), "changelog.md"),
    "utf8",
  );
  const { html } = await renderMarkdown(markdown.replace(/^#[^\n]*\n/, ""));
  return html;
}

export default async function ChangelogPage() {
  const html = await getChangelogHtml();

  return (
    <PageShell>
      <PageHero
        icon={ScrollText}
        eyebrow="Changelog"
        title="What changed, and when"
        subtitle="Every notable change, newest first. Dated releases are shipped; Unreleased is on main and not yet tagged."
      />

      <Band width="narrow">
        <Reveal>
          {/* Same prose styles as a blog post, so headings, lists and links
              here match the rest of the site's long-form typography. */}
          <div
            className="bq-prose"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </Reveal>
      </Band>
    </PageShell>
  );
}
