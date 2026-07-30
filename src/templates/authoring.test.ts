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

// Cherry marks its styling props transient with a $ prefix, which is how
// styled-components keeps them off the DOM node - an implementation detail of
// the library underneath, not something an MDX author should have to know.
// Every component Doccupine hands to authors therefore takes plain prop names.
// Space is the one that used to be re-exported straight from Cherry, so these
// tests pin the wrapper that keeps the prefix out of the authoring API, and
// pin the compatibility path that keeps already-written pages rendering.
describe("MDX authoring API", () => {
  it("hands authors the Space wrapper rather than Cherry's own component", () => {
    expect(mdxComponentsTemplate).toContain(
      'import { Space } from "@/components/layout/Space";',
    );
    expect(mdxComponentsTemplate).not.toContain("cherry-styled-components");
  });

  it("maps every unprefixed Space prop onto Cherry's transient prop", () => {
    for (const prop of SPACE_PROPS) {
      expect(spaceTemplate).toContain(`${prop}?:`);
      expect(spaceTemplate).toContain(`$${prop}={${prop} ?? $${prop}}`);
    }
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
