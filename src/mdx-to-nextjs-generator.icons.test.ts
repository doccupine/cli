import fs from "fs-extra";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import { MDXToNextJSGenerator } from "./mdx-to-nextjs-generator.js";

import { fixture, waitUntil } from "./test-utils/generator-fixture.js";

const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a]);
const PNG_BYTES_ALT = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x11, 0x22]);

describe.sequential("MDXToNextJSGenerator icon files", () => {
  it("copies root icon files and wires them through icons.json", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
    await fs.writeFile(path.join(root, "icon.png"), PNG_BYTES);
    await fs.writeFile(path.join(root, "icon-dark.png"), PNG_BYTES_ALT);
    await fs.writeFile(path.join(root, "apple-icon.png"), PNG_BYTES);

    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();

    for (const name of ["icon.png", "icon-dark.png", "apple-icon.png"]) {
      await expect(
        fs.pathExists(path.join(outputDir, "public", name)),
      ).resolves.toBe(true);
    }
    const iconsJson = await fs.readJson(path.join(outputDir, "icons.json"));
    expect(iconsJson.icon).toMatch(/^\/icon\.png\?v=[0-9a-f]{8}$/);
    expect(iconsJson.iconDark).toMatch(/^\/icon-dark\.png\?v=[0-9a-f]{8}$/);
    expect(iconsJson.appleIcon).toMatch(/^\/apple-icon\.png\?v=[0-9a-f]{8}$/);
    const manifest = await fs.readJson(
      path.join(outputDir, ".doccupine-artifacts.json"),
    );
    expect(manifest.iconFiles).toEqual([
      "apple-icon.png",
      "icon-dark.png",
      "icon.png",
    ]);
    const layout = await fs.readFile(
      path.join(outputDir, "app", "layout.tsx"),
      "utf8",
    );
    expect(layout).toContain("icons: siteIcons,");
    const homepage = await fs.readFile(
      path.join(outputDir, "app", "(site)", "page.tsx"),
      "utf8",
    );
    expect(homepage).toContain('from "@/utils/icons"');
  });

  it("skips a dark variant that has no light icon", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
    await fs.writeFile(path.join(root, "icon-dark.png"), PNG_BYTES_ALT);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("icon-dark.png found without icon.png"),
    );
    const iconsJson = await fs.readJson(path.join(outputDir, "icons.json"));
    expect(iconsJson).toEqual({});
    await expect(
      fs.pathExists(path.join(outputDir, "public", "icon-dark.png")),
    ).resolves.toBe(false);
  });

  it("prunes icon copies deleted while the generator was stopped", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
    await fs.writeFile(path.join(root, "icon.png"), PNG_BYTES);
    await fs.outputFile(path.join(root, "public", "asset.txt"), "asset\n");

    const first = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await first.init();
    await expect(
      fs.pathExists(path.join(outputDir, "public", "icon.png")),
    ).resolves.toBe(true);

    await fs.remove(path.join(root, "icon.png"));
    const second = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await second.init();

    await expect(
      fs.pathExists(path.join(outputDir, "public", "icon.png")),
    ).resolves.toBe(false);
    const iconsJson = await fs.readJson(path.join(outputDir, "icons.json"));
    expect(iconsJson).toEqual({});
    const manifest = await fs.readJson(
      path.join(outputDir, ".doccupine-artifacts.json"),
    );
    expect(manifest.iconFiles).toEqual([]);
    // The user's own public assets are untouched by icon pruning.
    await expect(
      fs.readFile(path.join(outputDir, "public", "asset.txt"), "utf8"),
    ).resolves.toBe("asset\n");
  });

  it("rejects a root icon that collides with a public asset", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
    await fs.writeFile(path.join(root, "icon.png"), PNG_BYTES);
    await fs.outputFile(path.join(root, "public", "icon.png"), PNG_BYTES_ALT);

    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);

    await expect(generator.init()).rejects.toThrow(/Conflicting icon sources/);
  });

  it("rejects a public copy over a tracked icon file", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
    await fs.writeFile(path.join(root, "icon.png"), PNG_BYTES);

    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();

    const publicSource = path.join(root, "public", "icon.png");
    await fs.outputFile(publicSource, PNG_BYTES_ALT);
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      generator.handlePublicFileChange(publicSource),
    ).rejects.toThrow(/Conflicting icon sources/);
    // The icon copy is left intact.
    await expect(
      fs.readFile(path.join(outputDir, "public", "icon.png")),
    ).resolves.toEqual(PNG_BYTES);
  });

  it("resyncs icons on watch events and prunes on delete", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
    const iconSource = path.join(root, "icon.png");
    await fs.writeFile(iconSource, PNG_BYTES);

    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    await generator.startWatching();

    const iconsJsonPath = path.join(outputDir, "icons.json");
    const { icon: initialUrl } = await fs.readJson(iconsJsonPath);

    type WatchCoordinatorInternals = {
      rootDirWatcher: { emit(event: string, filePath: string): boolean } | null;
    };
    const coordinator = (
      generator as unknown as { watchCoordinator: WatchCoordinatorInternals }
    ).watchCoordinator;

    await fs.writeFile(iconSource, PNG_BYTES_ALT);
    coordinator.rootDirWatcher?.emit("change", iconSource);
    await waitUntil(async () => {
      const { icon } = await fs.readJson(iconsJsonPath);
      return typeof icon === "string" && icon !== initialUrl;
    });
    await expect(
      fs.readFile(path.join(outputDir, "public", "icon.png")),
    ).resolves.toEqual(PNG_BYTES_ALT);

    await fs.remove(iconSource);
    coordinator.rootDirWatcher?.emit("unlink", iconSource);
    await waitUntil(async () => {
      const iconsJson = await fs.readJson(iconsJsonPath);
      return iconsJson.icon === undefined;
    });
    await waitUntil(
      async () =>
        !(await fs.pathExists(path.join(outputDir, "public", "icon.png"))),
    );
    await generator.stop();
  });

  it("keeps a frontmatter icon as a page-local literal", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
    await fs.outputFile(
      path.join(watchDir, "guide.mdx"),
      `---\ntitle: "Guide"\nicon: "/custom-favicon.png"\nimage: "/og.png"\n---\n# Guide\n`,
    );
    await fs.writeFile(path.join(root, "icon.png"), PNG_BYTES);

    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();

    const page = await fs.readFile(
      path.join(outputDir, "app", "(site)", "guide", "page.tsx"),
      "utf8",
    );
    expect(page).toContain('icons: "/custom-favicon.png",');
    expect(page).not.toContain("siteIcons");
    expect(page).not.toContain('from "@/utils/icons"');
  });
});
