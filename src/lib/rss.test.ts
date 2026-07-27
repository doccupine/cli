import { describe, it, expect } from "vitest";
import matter from "gray-matter";
import {
  slugify,
  createSlugger,
  parseUpdateBlocks,
  toRssMarkdown,
} from "./rss.js";
import { slugTemplate } from "../templates/components/layout/Slug.js";
import { docsTemplate } from "../templates/components/Docs.js";
import { updateMdxTemplate } from "../templates/mdx/update.mdx.js";
import { rssRouteTemplate } from "../templates/app/rssRoute.js";
import { rssLibTemplate } from "../templates/lib/rss.js";

describe("slugify", () => {
  it("lowercases and hyphenates whitespace", () => {
    expect(slugify("Key Additions")).toBe("key-additions");
  });

  it("strips symbols including dots (version labels)", () => {
    expect(slugify("v0.0.1")).toBe("v001");
    expect(slugify("v2.0 (beta)")).toBe("v20-beta");
  });

  it("drops non-word characters like accents", () => {
    expect(slugify("café")).toBe("caf");
  });

  it("handles empty and nullish input", () => {
    expect(slugify("")).toBe("");
  });
});

describe("createSlugger", () => {
  it("de-duplicates with occurrence suffixes", () => {
    const slug = createSlugger();
    expect(slug("Setup")).toBe("setup");
    expect(slug("Setup")).toBe("setup-1");
    expect(slug("Setup")).toBe("setup-2");
    expect(slug("Other")).toBe("other");
  });
});

// The CLI ports must stay byte-identical to the generated app's slugger and
// document walk, or feed anchors stop resolving. These guards fail when the
// templates drift so the port (and these tests) get updated in lockstep.
describe("template parity drift-guards", () => {
  it("Slug.ts template still matches the CLI slugify port", () => {
    expect(slugTemplate).toContain('.replace(/[^\\w\\s-]/g, "")');
    expect(slugTemplate).toContain('.replace(/\\s+/g, "-")');
    expect(slugTemplate).toContain(".toLowerCase()");
    expect(slugTemplate).toContain(".trim();");
    expect(slugTemplate).toContain("const count = seen.get(base) ?? 0;");
    expect(slugTemplate).toContain("seen.set(base, count + 1);");
    expect(slugTemplate).toContain("count === 0 ? base : `${base}-${count}`");
  });

  it("Docs.ts extractHeadings still matches the CLI walk", () => {
    expect(docsTemplate).toContain('content.replace(/```[\\s\\S]*?```/g, "")');
    expect(docsTemplate).toContain("/^(#{1,6})\\s+(.+)$/gm");
    expect(docsTemplate).toContain(
      "/<Update\\b[^>]*?\\blabel=[\"']([^\"']+)[\"'][^>]*>/g",
    );
    expect(docsTemplate).toContain(".sort((a, b) => a.position - b.position)");
  });
});

describe("parseUpdateBlocks", () => {
  it("extracts label, anchor, and markdown description", () => {
    const items = parseUpdateBlocks(
      '<Update label="v1.0" description="First">\n  Fixed a bug.\n</Update>',
    );
    expect(items).toEqual([
      { label: "v1.0", anchor: "v10", description: "Fixed a bug." },
    ]);
  });

  it("shares the slugger with headings (dedup interplay)", () => {
    const mdx = '## Setup\n\n<Update label="Setup">\n  Text.\n</Update>';
    expect(parseUpdateBlocks(mdx)[0].anchor).toBe("setup-1");
  });

  it("de-duplicates repeated labels", () => {
    const mdx =
      '<Update label="v1.0">\n  A.\n</Update>\n\n<Update label="v1.0">\n  B.\n</Update>';
    const items = parseUpdateBlocks(mdx);
    expect(items.map((i) => i.anchor)).toEqual(["v10", "v10-1"]);
  });

  it("ignores Update examples inside fenced code blocks", () => {
    const mdx =
      '<Update label="Real">\n  Yes.\n</Update>\n\n```html\n<Update label="Example">\n  No.\n</Update>\n```';
    const items = parseUpdateBlocks(mdx);
    expect(items.map((i) => i.label)).toEqual(["Real"]);
  });

  it("prefers the rss attribute over children (both quote styles)", () => {
    const double = parseUpdateBlocks(
      '<Update label="v1" rss="Feed text.">\n  Page text.\n</Update>',
    );
    expect(double[0].description).toBe("Feed text.");
    const single = parseUpdateBlocks(
      "<Update label='v1' rss='Feed text.'>\n  Page text.\n</Update>",
    );
    expect(single[0].description).toBe("Feed text.");
  });

  it("handles self-closing blocks", () => {
    const items = parseUpdateBlocks('<Update label="v1" rss="Only feed." />');
    expect(items).toEqual([
      { label: "v1", anchor: "v1", description: "Only feed." },
    ]);
  });

  it("matches multi-line open tags", () => {
    const mdx = '<Update\n  label="v1"\n  description="d"\n>\n  Hi.\n</Update>';
    expect(parseUpdateBlocks(mdx)).toEqual([
      { label: "v1", anchor: "v1", description: "Hi." },
    ]);
  });

  it("runs an unclosed block to the end of the document", () => {
    const items = parseUpdateBlocks('<Update label="v1">\n  Tail text.');
    expect(items[0].description).toBe("Tail text.");
  });

  it("tracks depth for nested blocks", () => {
    const mdx =
      '<Update label="Outer">\n  Before.\n  <Update label="Inner">\n    Within.\n  </Update>\n  After.\n</Update>';
    const items = parseUpdateBlocks(mdx);
    expect(items.map((i) => i.label)).toEqual(["Outer", "Inner"]);
    // The outer entry spans past the inner close tag; the inner block's text
    // survives with its relative indentation once the tags are removed.
    expect(items[0].description).toBe("Before.\n\n  Within.\n\nAfter.");
    expect(items[1].description).toBe("Within.");
  });

  it("preserves document order", () => {
    const mdx =
      '<Update label="B">\n  b\n</Update>\n\n<Update label="A">\n  a\n</Update>';
    expect(parseUpdateBlocks(mdx).map((i) => i.label)).toEqual(["B", "A"]);
  });

  it("returns no items for pages without Update blocks", () => {
    expect(parseUpdateBlocks("# Just a page\n\nText.")).toEqual([]);
  });

  it("extracts the expected feed from the shipped update.mdx sample", () => {
    const { content } = matter(updateMdxTemplate);
    const items = parseUpdateBlocks(content);
    expect(items.map((i) => i.label)).toContain("v0.0.1");
    const first = items.find((i) => i.label === "v0.0.1")!;
    expect(first.anchor).toBe("v001");
    expect(first.description).toContain("Fully responsive layout");
    expect(first.description).not.toContain("<");
  });
});

describe("toRssMarkdown", () => {
  it("removes component tags but keeps their text children", () => {
    expect(toRssMarkdown("<Note>Heads up.</Note>")).toBe("Heads up.");
  });

  it("removes HTML elements and comments", () => {
    expect(toRssMarkdown('<div class="x">Hi</div> <!-- note -->')).toBe("Hi");
  });

  it("collapses images to their alt text", () => {
    expect(toRssMarkdown("![Demo Image](https://x.test/a.png)")).toBe(
      "Demo Image",
    );
  });

  it("unwraps inline code and drops fenced code", () => {
    expect(toRssMarkdown("Use `npm i`.\n\n```bash\nnpm i\n```")).toBe(
      "Use npm i.",
    );
  });

  it("keeps markdown links and autolinks", () => {
    expect(toRssMarkdown("[docs](https://x.test) and <https://x.test>")).toBe(
      "[docs](https://x.test) and <https://x.test>",
    );
  });

  it("dedents indented children and collapses blank runs", () => {
    const inner = "\n  ## Notes\n\n\n\n  - one\n  - two\n";
    expect(toRssMarkdown(inner)).toBe("## Notes\n\n- one\n- two");
  });
});

describe("rssRouteTemplate", () => {
  const feed = {
    pagePath: "update",
    title: "Update",
    description: "Changelog",
    items: [{ title: "v0.0.1", anchor: "v001", description: "Notes." }],
  };

  it("emits a force-static RSS route", () => {
    const out = rssRouteTemplate(feed);
    expect(out).toContain('export const dynamic = "force-static";');
    expect(out).toContain("export const revalidate = false;");
    expect(out).toContain("application/rss+xml; charset=utf-8");
    expect(out).toContain("import { buildRssFeed, type RssFeedData }");
  });

  it("pre-wraps the embedded feed (always exceeds the print width)", () => {
    // Even an empty feed overflows 80 cols once the JSON.parse prefix is
    // added, so every emitted route uses the wrapped argument shape.
    const minimal = rssRouteTemplate({
      pagePath: "u",
      title: null,
      description: null,
      items: [],
    });
    expect(minimal).toContain("JSON.parse(\n  '");
    expect(minimal).toContain("',\n);");
    const full = rssRouteTemplate(feed);
    expect(full).toContain("JSON.parse(\n  '");
    expect(full).toContain("',\n);");
  });
});

describe("rssLibTemplate", () => {
  it("guards the homepage feed's empty pagePath against double slashes", () => {
    // The homepage feed (updatePagesIndex) passes pagePath: "" - naive
    // `/${pagePath}` joins would emit "//rss.xml", a protocol-relative URL.
    expect(rssLibTemplate).toContain(
      'const pagePrefix = feed.pagePath ? `/${feed.pagePath}` : "";',
    );
    expect(rssLibTemplate).toContain('`${base}${pagePrefix}` || "/"');
    expect(rssLibTemplate).toContain("`${base}${pagePrefix}/rss.xml`");
  });
});
