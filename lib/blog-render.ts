/**
 * Markdown → HTML for blog posts, plus the table of contents that comes out of
 * the same pass.
 *
 * Everything here runs on the server at build time. None of `unified`,
 * `shiki` or their plugins reaches the browser, which is why a pipeline this
 * complete costs the client nothing — the pages ship the resulting HTML string.
 *
 * The headings are collected from the tree *after* `rehype-slug` has run, so
 * the ids in the contents list are the same ones the rendered anchors carry.
 * Deriving them separately is the classic way for a TOC to quietly stop
 * matching its own document.
 */
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeShiki from "@shikijs/rehype";
import rehypeStringify from "rehype-stringify";

export type TocEntry = { id: string; text: string; depth: 2 | 3 };

/** Minimal shape of the hast nodes this module walks. */
type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

function walk(node: HastNode, visit: (n: HastNode) => void) {
  visit(node);
  for (const child of node.children ?? []) walk(child, visit);
}

/** Concatenated text of a node's subtree — the heading's label. */
function textOf(node: HastNode): string {
  let out = "";
  walk(node, (n) => {
    if (n.type === "text" && typeof n.value === "string") out += n.value;
  });
  return out.trim();
}

/**
 * Collects `h2`/`h3` into `sink`. `h1` is deliberately skipped: the post's
 * title is rendered by the page header, so a body `h1` would be a second
 * document title in the outline.
 */
const rehypeCollectHeadings =
  (sink: TocEntry[]) => () => (tree: HastNode) => {
    walk(tree, (node) => {
      if (node.type !== "element") return;
      if (node.tagName !== "h2" && node.tagName !== "h3") return;
      const id = node.properties?.id;
      if (typeof id !== "string") return;
      sink.push({ id, text: textOf(node), depth: node.tagName === "h2" ? 2 : 3 });
    });
  };

/**
 * Wraps every table in a scroll container.
 *
 * A wide table is the one block that reliably overflows the article column, and
 * an unwrapped one makes the whole page scroll sideways on a phone. Doing it
 * here rather than with `display: block` on the table keeps the table's own
 * layout algorithm intact, which is what sizes the columns.
 */
const rehypeWrapTables = () => (tree: HastNode) => {
  const wrap = (node: HastNode) => {
    if (!node.children) return;

    // Descend into the *existing* children before rewriting this level. The
    // generic `walk` cannot be used here: it visits whatever `children` holds
    // after the visitor ran, so it would step into the wrapper just created,
    // find the same table inside it, and wrap it again without end.
    node.children.forEach(wrap);

    node.children = node.children.map((child) =>
      child.type === "element" && child.tagName === "table"
        ? {
            type: "element",
            tagName: "div",
            properties: { className: ["bq-table-scroll"] },
            children: [child],
          }
        : child,
    );
  };

  wrap(tree);
};

/**
 * Both Shiki themes are emitted at once, as `--shiki-light` / `--shiki-dark`
 * CSS variables, and `app/globals.css` picks between them off the `.dark`
 * class. A single theme cannot work here: the site's theme is chosen by the
 * reader at runtime, long after this HTML was generated at build time.
 */
const SHIKI_OPTIONS = {
  themes: { light: "github-light", dark: "github-dark" },
  defaultColor: false,
} as const;

export async function renderMarkdown(
  markdown: string,
): Promise<{ html: string; toc: TocEntry[] }> {
  const toc: TocEntry[] = [];

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    // `allowDangerousHtml` is not set, so raw HTML in a post is dropped rather
    // than passed through. Posts are repo files rather than user input, but a
    // blog is exactly the surface where that stops being true one day.
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeCollectHeadings(toc))
    .use(rehypeWrapTables)
    .use(rehypeShiki, SHIKI_OPTIONS)
    .use(rehypeStringify)
    .process(markdown);

  return { html: String(file), toc };
}

/** Average adult prose speed. Rounded up so a short post never reads "0 min". */
const WORDS_PER_MINUTE = 200;

export function readingMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
