import { describe, expect, it } from "vitest";

import {
  generateJsonLdScript,
  generateMetadataBlock,
  generateRuntimeOnlyMetadataBlock,
} from "./metadata.js";

describe("metadata code generation", () => {
  it("serializes backticks, interpolation markers, quotes, and newlines", () => {
    const block = generateMetadataBlock({
      title: "Using `foo` and ${bar}",
      titleFallback: "Fallback",
      name: 'The "Docs"\nSite',
      titleOrder: "page-first",
      description: "Line one\n`${stillData}`",
    });

    expect(block).toContain('"Using `foo` and ${bar} - The \\"Docs\\"\\nSite"');
    expect(block).toContain('"Line one\\n`${stillData}`"');
    expect(block).not.toContain("title: `");
  });

  it("uses expressions rather than generated template literals for defaults", () => {
    const block = generateRuntimeOnlyMetadataBlock();
    expect(block).toContain('const pageTitle = config.name || "Doccupine";');
    expect(block).not.toContain("title: `");
  });

  it("emits hreflang alternates and the Open Graph locale only when given", () => {
    const base = {
      titleFallback: "Fallback",
      titleOrder: "page-first" as const,
      canonicalPath: "de/guide",
    };
    const plain = generateMetadataBlock(base);
    expect(plain).toContain('alternates: { canonical: "/de/guide" },');
    expect(plain).not.toContain("languages");
    expect(plain).not.toContain("locale:");
    expect(generateMetadataBlock({ ...base, alternateLanguages: {} })).toBe(
      plain,
    );

    const translated = generateMetadataBlock({
      ...base,
      alternateLanguages: {
        en: "/guide",
        de: "/de/guide",
        "x-default": "/guide",
      },
      ogLocale: "de",
    });
    expect(translated).toContain(
      'alternates: {\n    canonical: "/de/guide",\n    languages: { en: "/guide", de: "/de/guide", "x-default": "/guide" },\n  },',
    );
    expect(translated).toContain('    locale: "de",\n  },');

    const withFeed = generateMetadataBlock({
      ...base,
      rssPath: "/de/guide/rss.xml",
      alternateLanguages: { "pt-br": "/pt-br/guide", "x-default": "/guide" },
    });
    expect(withFeed).toContain(
      '    languages: { "pt-br": "/pt-br/guide", "x-default": "/guide" },\n    types: { "application/rss+xml": "/de/guide/rss.xml" },',
    );
  });

  it("defaults page icons to the site-wide icon set", () => {
    const block = generateMetadataBlock({
      titleFallback: "Fallback",
      titleOrder: "page-first",
    });
    expect(block).toContain("icons: siteIcons,");
    expect(generateRuntimeOnlyMetadataBlock()).toContain("icons: siteIcons,");
  });

  it("keeps a frontmatter icon as a page-local literal", () => {
    const block = generateMetadataBlock({
      titleFallback: "Fallback",
      titleOrder: "page-first",
      icon: "/custom-favicon.png",
    });
    expect(block).toContain('icons: "/custom-favicon.png",');
    expect(block).not.toContain("siteIcons");
  });

  it("feeds JSON-LD logos from the primary icon unless the page has an image", () => {
    const withDefault = generateJsonLdScript({
      kind: "article",
      canonicalPath: "guide",
      title: "Guide",
    });
    expect(withDefault.declarations).toContain(
      "const faviconUrl = primaryIconUrl;",
    );

    const withImage = generateJsonLdScript({
      kind: "article",
      canonicalPath: "guide",
      title: "Guide",
      image: "/og.png",
    });
    expect(withImage.declarations).toContain('const faviconUrl = "/og.png";');
    expect(withImage.declarations).not.toContain("primaryIconUrl");
  });
});
