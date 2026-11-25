import { describe, expect, it } from "vitest";

import { forAudience, hasVisibilityBlocks } from "./visibility.js";

const PAGE = [
  "Intro.",
  "",
  '<Visibility for="humans">',
  "Click **Deploy**.",
  "</Visibility>",
  "",
  '<Visibility for="agents">',
  "Call POST /v1/deployments.",
  "</Visibility>",
  "",
  "Outro.",
].join("\n");

describe("forAudience", () => {
  it("keeps the readers' blocks on the page and drops the agents' ones", () => {
    const humans = forAudience(PAGE, "humans");
    expect(humans).toContain("Click **Deploy**.");
    expect(humans).not.toContain("POST /v1/deployments");
    expect(humans).not.toContain("Visibility");
    expect(humans).not.toMatch(/\n{3,}/);
  });

  it("gives AI the agents' blocks and none of the readers' ones", () => {
    const agents = forAudience(PAGE, "agents");
    expect(agents).toContain("Call POST /v1/deployments.");
    expect(agents).not.toContain("Deploy**");
    expect(agents).not.toContain("Visibility");
    expect(agents.startsWith("Intro.")).toBe(true);
    expect(agents.endsWith("Outro.")).toBe(true);
  });

  it("handles inline blocks, single quotes and braces", () => {
    const mdx =
      "Press <Visibility for='humans'>the button</Visibility><Visibility for={\"agents\"}>POST /go</Visibility> now.";
    expect(forAudience(mdx, "humans")).toBe("Press the button now.");
    expect(forAudience(mdx, "agents")).toBe("Press POST /go now.");
  });

  it("resolves nested blocks from the inside out", () => {
    const mdx =
      '<Visibility for="agents">A <Visibility for="humans">B</Visibility> C</Visibility>';
    expect(forAudience(mdx, "agents")).toBe("A  C");
    expect(forAudience(mdx, "humans")).toBe("");
  });

  it("leaves code exactly as written", () => {
    const mdx = [
      'Use `<Visibility for="agents">x</Visibility>` inline.',
      "",
      "```html",
      '<Visibility for="agents">',
      "  Shown in the example.",
      "</Visibility>",
      "```",
      "",
      "````mdx",
      '<Visibility for="humans">nested fence</Visibility>',
      "````",
    ].join("\n");
    expect(forAudience(mdx, "humans")).toBe(mdx);
    expect(forAudience(mdx, "agents")).toBe(mdx);
    expect(hasVisibilityBlocks(mdx)).toBe(false);
  });

  it("shows a block with an unknown audience to both", () => {
    const mdx = '<Visibility for="robots">Both</Visibility>';
    expect(forAudience(mdx, "humans")).toBe("Both");
    expect(forAudience(mdx, "agents")).toBe("Both");
  });

  it("drops self-closing tags and leaves pages without blocks untouched", () => {
    expect(forAudience('A<Visibility for="agents" />B', "humans")).toBe("AB");
    const plain = "No blocks here.\n\n\n\nKept spacing.";
    expect(forAudience(plain, "agents")).toBe(plain);
    expect(hasVisibilityBlocks(PAGE)).toBe(true);
  });
});
