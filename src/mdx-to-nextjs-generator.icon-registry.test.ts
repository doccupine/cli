import fs from "fs-extra";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import { MDXToNextJSGenerator } from "./mdx-to-nextjs-generator.js";

import { fixture } from "./test-utils/generator-fixture.js";

const REGISTRY = path.join("components", "layout", "IconRegistry.ts");

function readRegistry(outputDir: string): Promise<string> {
  return fs.readFile(path.join(outputDir, REGISTRY), "utf8");
}

function unknownIconWarnings(warn: { mock: { calls: unknown[][] } }): string {
  return warn.mock.calls.map((call) => String(call[0])).join("\n");
}

describe("MDXToNextJSGenerator icon registry", () => {
  it("bundles exactly the icons the site uses and warns about unknown names", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.outputFile(
      path.join(watchDir, "index.mdx"),
      [
        "---",
        'title: "Home"',
        'navIcon: "book-open"',
        'categoryIcon: "Rocket"',
        "---",
        "# Home",
        "",
        '<Icon name="flag" />',
        '<Card icon="terminal" title="Run">Run it</Card>',
        "",
        "```html",
        '<Icon name="fenced-example" />',
        "```",
        "",
      ].join("\n"),
    );
    await fs.outputFile(
      path.join(watchDir, "guide.mdx"),
      '---\ntitle: "Guide"\nnavIcon: "not-a-real-icon"\n---\n# Guide\n\n<Icon name="Compass" />\n',
    );
    await fs.writeJson(path.join(root, "navigation.json"), [
      {
        label: "Guides",
        icon: "settings",
        links: [{ slug: "guide", title: "Guide", icon: "also-missing" }],
      },
    ]);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();

    const registry = await readRegistry(outputDir);
    for (const name of [
      "BookOpen",
      "Rocket",
      "Flag",
      "Terminal",
      "Compass",
      "Settings",
      "ChevronRight",
      "ChevronDown",
      "Copy",
      "Check",
    ]) {
      expect(registry).toContain(`  ${name},`);
    }
    expect(registry).not.toContain("FencedExample");
    expect(registry).not.toContain("NotARealIcon");
    expect(registry).not.toContain("AlsoMissing");

    const warnings = unknownIconWarnings(warn);
    expect(warnings).toContain('"not-a-real-icon" in guide.mdx (navIcon)');
    expect(warnings).toContain('"also-missing" in navigation.json');
    expect(warnings).not.toContain("fenced-example");

    const icon = await fs.readFile(
      path.join(outputDir, "components", "layout", "Icon.tsx"),
      "utf8",
    );
    expect(icon).toContain('from "@/components/layout/IconRegistry"');
    expect(icon).not.toContain("import { icons }");
  });

  it("rewrites the registry when MDX pages or navigation.json change", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const guidePath = path.join(watchDir, "guide.mdx");
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
    await fs.outputFile(guidePath, "# Guide\n");
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    expect(await readRegistry(outputDir)).not.toContain("  Flag,");

    await fs.writeFile(guidePath, '# Guide\n\n<Icon name="flag" />\n');
    await generator.handleFileChange("changed", "guide.mdx");
    expect(await readRegistry(outputDir)).toContain("  Flag,");

    await fs.remove(guidePath);
    await generator.handleFileDelete("guide.mdx");
    expect(await readRegistry(outputDir)).not.toContain("  Flag,");

    const navigationPath = path.join(root, "navigation.json");
    await fs.writeJson(navigationPath, [
      { label: "Docs", icon: "book-open", links: [] },
    ]);
    await generator.handleConfigFileChange(navigationPath);
    expect(await readRegistry(outputDir)).toContain("  BookOpen,");

    await fs.remove(navigationPath);
    await generator.handleConfigFileDelete(navigationPath);
    expect(await readRegistry(outputDir)).not.toContain("  BookOpen,");
  });

  it("leaves an unchanged registry untouched on a rerun", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.outputFile(
      path.join(watchDir, "index.mdx"),
      '# Home\n\n<Icon name="flag" />\n',
    );
    await new MDXToNextJSGenerator(watchDir, outputDir, [], root).init();
    const before = await fs.stat(path.join(outputDir, REGISTRY));

    await new Promise((resolve) => setTimeout(resolve, 20));
    await new MDXToNextJSGenerator(watchDir, outputDir, [], root).init();
    const after = await fs.stat(path.join(outputDir, REGISTRY));
    expect(after.mtimeMs).toBe(before.mtimeMs);
    expect(await readRegistry(outputDir)).toContain("  Flag,");
  });

  it("ships the starter docs without unknown-icon warnings", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await new MDXToNextJSGenerator(watchDir, outputDir, [], root).init();

    expect(unknownIconWarnings(warn)).not.toContain("Unknown Lucide icon");
    expect(await readRegistry(outputDir)).toContain("  Flag,");
  });
});
