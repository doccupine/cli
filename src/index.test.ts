import { describe, it, expect } from "vitest";
import { generateSlug, escapeTemplateContent } from "./index.js";

describe("generateSlug", () => {
  it("returns empty string for index.mdx", () => {
    expect(generateSlug("index.mdx")).toBe("");
    expect(generateSlug("./index.mdx")).toBe("");
  });

  it("strips .mdx extension", () => {
    expect(generateSlug("getting-started.mdx")).toBe("getting-started");
  });

  it("lowercases the slug", () => {
    expect(generateSlug("MyPage.mdx")).toBe("mypage");
  });

  it("replaces special characters with hyphens", () => {
    expect(generateSlug("hello world.mdx")).toBe("hello-world");
  });

  it("preserves forward slashes for nested paths", () => {
    expect(generateSlug("guides/setup.mdx")).toBe("guides/setup");
  });

  it("converts backslashes to forward slashes", () => {
    expect(generateSlug("guides\\setup.mdx")).toBe("guides/setup");
  });

  it("preserves underscores and hyphens", () => {
    expect(generateSlug("my_page-name.mdx")).toBe("my_page-name");
  });
});

describe("escapeTemplateContent", () => {
  it("escapes backticks", () => {
    expect(escapeTemplateContent("hello `world`")).toBe("hello \\`world\\`");
  });

  it("escapes template literal expressions", () => {
    expect(escapeTemplateContent("${variable}")).toBe("\\${variable}");
  });

  it("escapes backslashes", () => {
    expect(escapeTemplateContent("path\\to\\file")).toBe("path\\\\to\\\\file");
  });

  it("escapes all dangerous characters together", () => {
    const input = "Use `${process.env.SECRET}` here";
    const result = escapeTemplateContent(input);
    expect(result).toBe("Use \\`\\${process.env.SECRET}\\` here");
  });

  it("handles content with no special characters", () => {
    expect(escapeTemplateContent("plain text")).toBe("plain text");
  });

  it("handles empty string", () => {
    expect(escapeTemplateContent("")).toBe("");
  });
});
