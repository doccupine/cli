import { describe, expect, it } from "vitest";

import { mdxComponentsTemplate } from "./components/MDXComponents.js";
import { mermaidPreTemplate } from "./components/MermaidPre.js";

// A fenced block reaches the `pre` handlers as <pre><code>. When the
// components map overrides `code`, the child is that component rather than
// the plain "code" element, and a handler that only checks for "code" never
// recognises the fence: mermaid diagrams then render as plain code blocks.
describe("code block handlers and the code override", () => {
  const override = /^\s+code: (\w+),$/m.exec(mdxComponentsTemplate)?.[1];

  it("the components map overrides code", () => {
    expect(override).toBe("InlineCode");
  });

  it("Pre accepts the overridden code element", () => {
    expect(mdxComponentsTemplate).toContain(
      `child.type === "code" || child.type === ${override}`,
    );
  });

  it("MermaidPre accepts the overridden code element", () => {
    expect(mermaidPreTemplate).toContain(
      `child.type === "code" || child.type === ${override}`,
    );
    expect(mermaidPreTemplate).toMatch(
      new RegExp(
        `import \\{[^}]*\\b${override}\\b[^}]*\\} from "@/components/MDXComponents"`,
      ),
    );
  });
});
