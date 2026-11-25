import { describe, expect, it } from "vitest";

import { mdxComponentsTemplate } from "./components/MDXComponents.js";
import { spaceTemplate } from "./components/layout/Space.js";
import { spaceMdxTemplate } from "./mdx/space.mdx.js";

const SPACE_PROPS = [
  "size",
  "xs",
  "sm",
  "md",
  "lg",
  "xl",
  "xxl",
  "xxxl",
  "horizontal",
];

// Space used to be Cherry's component, whose styling props carried a $
// prefix (styled-components' transient props), an implementation detail an
// MDX author should never have to know. Every component Doccupine hands to
// authors takes plain prop names; these tests pin that, and the
// compatibility path that keeps pages written with the prefix rendering.
describe("MDX authoring API", () => {
  it("hands authors the site's own Space component", () => {
    expect(mdxComponentsTemplate).toContain(
      'import { Space } from "@/components/layout/Space";',
    );
    expect(mdxComponentsTemplate).not.toContain("cherry-styled-components");
  });

  it("reads every unprefixed Space prop first, then its $ name", () => {
    for (const prop of SPACE_PROPS) {
      expect(spaceTemplate).toContain(`  ${prop}?:`);
    }
    expect(spaceTemplate).toContain(
      "const horizontal = props.horizontal ?? props.$horizontal ?? false;",
    );
    expect(spaceTemplate).toContain("const size = props.size ?? props.$size;");
    expect(spaceTemplate).toContain(
      "props[breakpoint] ?? props[`$${breakpoint}`],",
    );
    // The $ props never reach the DOM: the span only gets a class, a data
    // flag and inline custom properties.
    expect(spaceTemplate).not.toContain("{...props}");
  });

  it("still accepts the $ props existing pages were written with", () => {
    for (const prop of SPACE_PROPS) {
      expect(spaceTemplate).toContain(`$${prop}?:`);
    }
  });

  it("documents Space without the $ prefix", () => {
    expect(spaceMdxTemplate).toContain("<Space size={60} />");
    expect(spaceMdxTemplate).toContain("<Space size={20} md={40} xl={80} />");
    expect(spaceMdxTemplate).toContain('<Space size="none" lg={64} />');
    expect(spaceMdxTemplate).toContain("<Space size={24} horizontal />");
    // No example and no documented property may carry the prefix, or the page
    // would teach the very API this wrapper exists to hide.
    expect(spaceMdxTemplate).not.toMatch(/<Space \$/);
    expect(spaceMdxTemplate).not.toMatch(/<Field value="\$/);
  });
});
