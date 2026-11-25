import fs from "fs-extra";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { MDXToNextJSGenerator } from "./mdx-to-nextjs-generator.js";
import { actionBarTemplate } from "./templates/components/layout/ActionBar.js";
import { docsTemplate } from "./templates/components/Docs.js";
import { modernActionBarTemplate } from "./templates/modern/components/layout/ActionBar.js";
import { searchServiceTemplate } from "./templates/services/search.js";
import { mcpToolsTemplate } from "./templates/services/mcp/tools.js";

import { fixture } from "./test-utils/generator-fixture.js";

const HUMANS = "HUMANS_ONLY_TEXT";
const AGENTS = "AGENTS_ONLY_TEXT";

const GUIDE = [
  "---",
  "title: Guide",
  "---",
  "# Guide",
  "",
  "SHARED_TEXT",
  "",
  '<Visibility for="humans">',
  HUMANS,
  "</Visibility>",
  "",
  '<Visibility for="agents">',
  AGENTS,
  "</Visibility>",
  "",
].join("\n");

async function read(outputDir: string, ...segments: string[]) {
  return fs.readFile(path.join(outputDir, ...segments), "utf8");
}

describe("<Visibility> in every generated audience", () => {
  it("splits one page between the rendered site, search, and what AI reads", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.outputFile(
      path.join(watchDir, "index.mdx"),
      "---\ntitle: Home\n---\n# Home\n",
    );
    await fs.outputFile(path.join(watchDir, "guide.mdx"), GUIDE);
    await new MDXToNextJSGenerator(watchDir, outputDir, [], root).init();

    // The rendered page: the readers' version as `content`, the agents'
    // version only as the "Copy content" text.
    const pageFile = await read(
      outputDir,
      "app",
      "(site)",
      "guide",
      "page.tsx",
    );
    const content = /const content = `([\s\S]*?)`;/.exec(pageFile)?.[1] ?? "";
    const agentContent =
      /const agentContent = `([\s\S]*?)`;/.exec(pageFile)?.[1] ?? "";
    expect(content).toContain(HUMANS);
    expect(content).not.toContain(AGENTS);
    expect(content).not.toContain("<Visibility");
    expect(agentContent).toContain(AGENTS);
    expect(agentContent).not.toContain(HUMANS);
    expect(pageFile).toContain("agentContent={agentContent}");

    // llms-full.txt and the page's .md copy.
    for (const file of [
      await read(outputDir, "public", "llms-full.txt"),
      await read(outputDir, "public", "guide.md"),
    ]) {
      expect(file).toContain("SHARED_TEXT");
      expect(file).toContain(AGENTS);
      expect(file).not.toContain(HUMANS);
      expect(file).not.toContain("<Visibility");
    }

    // The MCP server and the AI chat read `content`; the search reads
    // `searchContent`, which only pages with blocks carry.
    const docs = JSON.parse(
      await read(outputDir, "services", "mcp", "docs-content.json"),
    ) as { uri: string; content: string; searchContent?: string }[];
    const guide = docs.find((doc) => doc.uri === "docs://guide");
    expect(guide?.content).toContain(AGENTS);
    expect(guide?.content).not.toContain(HUMANS);
    expect(guide?.searchContent).toContain(HUMANS);
    expect(guide?.searchContent).not.toContain(AGENTS);
    expect(docs.find((doc) => doc.uri === "docs:///")).not.toHaveProperty(
      "searchContent",
    );

    // The home page has no blocks: no second copy of its content.
    const home = await read(outputDir, "app", "(site)", "page.tsx");
    expect(home).not.toContain("agentContent");
  });

  it("wires the runtime consumers to the right version", () => {
    // Search follows the rendered page.
    expect(searchServiceTemplate).toContain(
      "const source = doc.searchContent ?? doc.content;",
    );
    // get_doc hands agents their version only (the chat chunks and the
    // docs:// resources read `content`).
    expect(mcpToolsTemplate).toContain(
      "const { searchContent: _searchContent, ...resource } = doc;",
    );
    expect(mcpToolsTemplate).toContain("const cleanContent = doc.content");
    // "Copy content" copies what AI reads, in both designs.
    expect(docsTemplate).toContain("copyContent={agentContent}");
    for (const template of [actionBarTemplate, modernActionBarTemplate]) {
      expect(template).toContain(
        "await navigator.clipboard.writeText(copyContent ?? content);",
      );
    }
  });
});
