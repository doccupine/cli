import fs from "fs-extra";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ICON_REGISTRY_FILE } from "./lib/icon-registry.js";
import { appStructure, modernOverrides } from "./lib/structures.js";
import { MDXToNextJSGenerator } from "./mdx-to-nextjs-generator.js";
import { fixture } from "./test-utils/generator-fixture.js";

// These tests swap the modern design's Callout styles for a marker file that
// also draws an icon classic never uses, and restore the real one afterwards.
const OVERRIDDEN = "components/layout/Callout.styles.ts";
const REAL_MODERN_CALLOUT = modernOverrides[OVERRIDDEN];
const MODERN_CALLOUT = `"use client";\n// modern callout\nexport const marker = <Icon name="anchor" />;\n`;

function readOutput(outputDir: string, file: string): Promise<string> {
  return fs.readFile(path.join(outputDir, file), "utf8");
}

describe("MDXToNextJSGenerator site templates", () => {
  afterEach(() => {
    modernOverrides[OVERRIDDEN] = REAL_MODERN_CALLOUT;
  });

  it("writes the modern design when config.json names no template", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
    modernOverrides[OVERRIDDEN] = MODERN_CALLOUT;
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();

    expect(await readOutput(outputDir, OVERRIDDEN)).toBe(MODERN_CALLOUT);
    expect(
      await readOutput(outputDir, "components/layout/designTokens.ts"),
    ).not.toContain("export const SIDEBAR_WIDTH = 280;");
    expect(await readOutput(outputDir, ICON_REGISTRY_FILE)).toContain(
      "  Anchor,",
    );
  });

  it("writes the classic design when config.json asks for it", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
    await fs.writeJson(path.join(root, "config.json"), { template: "classic" });
    modernOverrides[OVERRIDDEN] = MODERN_CALLOUT;
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();

    expect(await readOutput(outputDir, OVERRIDDEN)).toBe(
      appStructure[OVERRIDDEN],
    );
    expect(
      await readOutput(outputDir, "components/layout/designTokens.ts"),
    ).toContain("export const SIDEBAR_WIDTH = 280;");
    expect(await readOutput(outputDir, ICON_REGISTRY_FILE)).not.toContain(
      "  Anchor,",
    );
  });

  it("writes the chosen design's files and registers its icons", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
    await fs.writeJson(path.join(root, "config.json"), { template: "modern" });
    modernOverrides[OVERRIDDEN] = MODERN_CALLOUT;
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();

    expect(await readOutput(outputDir, OVERRIDDEN)).toBe(MODERN_CALLOUT);
    expect(await readOutput(outputDir, ICON_REGISTRY_FILE)).toContain(
      "  Anchor,",
    );
  });

  it("warns about an unknown template and falls back to the default", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
    await fs.writeJson(path.join(root, "config.json"), { template: "fancy" });
    modernOverrides[OVERRIDDEN] = MODERN_CALLOUT;
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();

    expect(await readOutput(outputDir, OVERRIDDEN)).toBe(MODERN_CALLOUT);
    expect(
      consoleWarn.mock.calls.some((call) =>
        String(call[0]).includes('"template" must be one of'),
      ),
    ).toBe(true);
  });

  it("switches designs in watch mode when config.json changes", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const configPath = path.join(root, "config.json");
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
    await fs.writeJson(configPath, { name: "Docs", template: "classic" });
    modernOverrides[OVERRIDDEN] = MODERN_CALLOUT;
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    expect(await readOutput(outputDir, OVERRIDDEN)).toBe(
      appStructure[OVERRIDDEN],
    );

    const updateRootLayout = vi.spyOn(generator, "updateRootLayout");
    const untouched = path.join(outputDir, "components/layout/Card.tsx");
    const untouchedMtime = (await fs.stat(untouched)).mtimeMs;

    // A change that keeps the design rewrites nothing design-related.
    await fs.writeJson(configPath, {
      name: "Docs",
      description: "More",
      template: "classic",
    });
    await generator.handleConfigFileChange(configPath);
    expect(updateRootLayout).not.toHaveBeenCalled();

    await fs.writeJson(configPath, { name: "Docs", template: "modern" });
    await generator.handleConfigFileChange(configPath);
    expect(await readOutput(outputDir, OVERRIDDEN)).toBe(MODERN_CALLOUT);
    expect(await readOutput(outputDir, ICON_REGISTRY_FILE)).toContain(
      "  Anchor,",
    );
    expect(updateRootLayout).toHaveBeenCalledTimes(1);
    expect((await fs.stat(untouched)).mtimeMs).toBe(untouchedMtime);

    // And back to classic.
    await fs.writeJson(configPath, { name: "Docs", template: "classic" });
    await generator.handleConfigFileChange(configPath);
    expect(await readOutput(outputDir, OVERRIDDEN)).toBe(
      appStructure[OVERRIDDEN],
    );
    expect(await readOutput(outputDir, ICON_REGISTRY_FILE)).not.toContain(
      "  Anchor,",
    );
    expect(updateRootLayout).toHaveBeenCalledTimes(2);

    // Deleting config.json returns to the default design, modern.
    await fs.remove(configPath);
    await generator.handleConfigFileDelete(configPath);
    expect(await readOutput(outputDir, OVERRIDDEN)).toBe(MODERN_CALLOUT);
    expect(await readOutput(outputDir, ICON_REGISTRY_FILE)).toContain(
      "  Anchor,",
    );
    expect(updateRootLayout).toHaveBeenCalledTimes(3);
  });
});
