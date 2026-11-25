import { describe, expect, it } from "vitest";
import { mdxComponentsTemplate } from "./components/MDXComponents.js";

describe("MDX link component", () => {
  it("keeps same-page hash links in the current tab", () => {
    expect(mdxComponentsTemplate).toContain(
      `if (href && href.startsWith("#")) {
        return (
          <a href={href} {...props}>`,
    );
  });
});
