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
