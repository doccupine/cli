// Feed extraction for subscribable changelogs: pages that contain <Update>
// blocks publish an RSS feed at {page-url}/rss.xml.
//
// Anchor parity is the load-bearing constraint here. Feed entry links are
// `{pageUrl}#{anchor}`, and the anchor must byte-match the id the generated
// app assigns: one shared slugger walks the fenced-code-stripped document
// collecting markdown headings AND <Update label> open tags in byte order
// (components/Docs.tsx `extractHeadings` + components/MDXComponents.tsx).
// `slugify`/`createSlugger` below are byte-exact ports of the generated
// app's components/layout/Slug.ts, and `parseUpdateBlocks` replays that
// exact walk - headings consume slugger slots too, so an `## Setup` before
// `<Update label="Setup">` pushes the entry's anchor to "setup-1".
// rss.test.ts guards both ports against template drift.

export function slugify(text: string): string {
  return (text ?? "")
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim();
}

export type Slugger = (text: string) => string;

export function createSlugger(): Slugger {
  const seen = new Map<string, number>();
  return (text: string) => {
    const base = slugify(text);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count}`;
  };
}

export interface UpdateFeedItem {
  /** The Update's `label` attribute; doubles as the feed entry title. */
  label: string;
  /** Anchor id the generated app assigns this entry (see parity note above). */
  anchor: string;
  /**
   * Feed entry text: the `rss` attribute when present, otherwise the block's
   * children reduced to pure Markdown (components, code, and HTML removed).
   */
  description: string;
}

export function parseUpdateBlocks(mdx: string): UpdateFeedItem[] {
  // Fenced code is stripped before any matching, mirroring extractHeadings:
  // an <Update> example inside a fence is not an entry, and positions below
  // are measured in the stripped string on both sides of the parity contract.
  const content = mdx.replace(/```[\s\S]*?```/g, "");

  interface Entry {
    kind: "heading" | "update";
    text: string;
    position: number;
    tag: string;
    tagEnd: number;
  }
  const entries: Entry[] = [];
  let match: RegExpExecArray | null;

  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  while ((match = headingRegex.exec(content)) !== null) {
    entries.push({
      kind: "heading",
      text: match[2].trim(),
      position: match.index,
      tag: "",
      tagEnd: 0,
    });
  }

  // [^>] spans newlines, so multi-line open tags match - same as the app.
  const updateRegex = /<Update\b[^>]*?\blabel=["']([^"']+)["'][^>]*>/g;
  while ((match = updateRegex.exec(content)) !== null) {
    entries.push({
      kind: "update",
      text: match[1].trim(),
      position: match.index,
      tag: match[0],
      tagEnd: match.index + match[0].length,
    });
  }

  entries.sort((a, b) => a.position - b.position);

  const slug = createSlugger();
  const items: UpdateFeedItem[] = [];
  for (const entry of entries) {
    const anchor = slug(entry.text);
    if (entry.kind !== "update") continue;
    const rssAttr = /\brss=["']([^"']*)["']/.exec(entry.tag)?.[1];
    const inner = entry.tag.endsWith("/>")
      ? ""
      : extractInner(content, entry.tagEnd);
    items.push({
      label: entry.text,
      anchor,
      description:
        rssAttr !== undefined ? rssAttr.trim() : toRssMarkdown(inner),
    });
  }
  return items;
}

/**
 * Slice out an Update block's children: scan from the end of its open tag to
 * the matching close tag, tracking depth so nested <Update> blocks close
 * correctly. An unclosed block runs to the end of the document (the renderer
 * swallows the rest of the page in that case too).
 */
function extractInner(content: string, from: number): string {
  const token = /<Update\b[^>]*?>|<\/Update\s*>/g;
  token.lastIndex = from;
  let depth = 1;
  let match: RegExpExecArray | null;
  while ((match = token.exec(content)) !== null) {
    if (match[0].startsWith("</")) {
      depth -= 1;
      if (depth === 0) return content.slice(from, match.index);
    } else if (!match[0].endsWith("/>")) {
      depth += 1;
    }
  }
  return content.slice(from);
}

/**
 * Reduce an Update block's children to pure Markdown for feed readers:
 * components, code, and HTML are removed (tag children text survives),
 * images collapse to their alt text, inline code keeps its text. Markdown
 * inline syntax (emphasis, links, lists, headings) passes through, including
 * autolinks - `<https://...>` never matches the tag pattern because a `:`
 * follows the leading word characters.
 */
export function toRssMarkdown(inner: string): string {
  const stripped = inner
    .replace(/```[\s\S]*?```/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/?[A-Za-z][a-zA-Z0-9]*(?:\s[^>]*)?\/?>/g, "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]*)`/g, "$1");
  return dedent(stripped)
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Update children are conventionally indented under the open tag; strip the
 * common leading indentation so lists and headings arrive at column 0.
 */
function dedent(text: string): string {
  const lines = text.split("\n");
  let minIndent = Infinity;
  for (const line of lines) {
    if (line.trim() === "") continue;
    const indent = /^ */.exec(line)![0].length;
    if (indent < minIndent) minIndent = indent;
  }
  if (!Number.isFinite(minIndent) || minIndent === 0) return text;
  return lines.map((line) => line.slice(minIndent)).join("\n");
}
