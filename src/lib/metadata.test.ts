import { describe, expect, it } from "vitest";

import {
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
});
