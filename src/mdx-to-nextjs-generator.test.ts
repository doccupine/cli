import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SecureSourceFs } from "./generator/secure-source-fs.js";
import { MDXToNextJSGenerator } from "./mdx-to-nextjs-generator.js";

const temporaryDirectories: string[] = [];

async function fixture(): Promise<{
  root: string;
  watchDir: string;
  outputDir: string;
}> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "doccupine-generator-"));
  temporaryDirectories.push(root);
  const watchDir = path.join(root, "docs");
  const outputDir = path.join(root, "site");
  await fs.ensureDir(watchDir);
  return { root, watchDir, outputDir };
}

async function waitUntil(check: () => Promise<boolean>): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error("Timed out waiting for watcher output");
}

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(
    temporaryDirectories.splice(0).map((dir) => fs.remove(dir)),
  );
});

describe.sequential("MDXToNextJSGenerator ownership", () => {
  it("does not seed starter docs over an existing MDX source", async () => {
    const { watchDir, outputDir } = await fixture();
    const existingPath = path.join(watchDir, "components.mdx");
    await fs.writeFile(existingPath, "# Existing\n");

    const generator = new MDXToNextJSGenerator(watchDir, outputDir);
    await generator.createStartingDocs();

    expect(await fs.readFile(existingPath, "utf8")).toBe("# Existing\n");
    expect(await fs.pathExists(path.join(watchDir, "index.mdx"))).toBe(false);
  });

  it("rejects external MDX symlinks during scans and watch-style changes", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const sensitivePath = path.join(root, "sensitive.mdx");
    const linkedPath = path.join(watchDir, "leaked.mdx");
    await fs.writeFile(sensitivePath, "SENSITIVE_SOURCE_CONTENT\n");
    await fs.symlink(sensitivePath, linkedPath, "file");
    const generator = new MDXToNextJSGenerator(watchDir, outputDir);

    await expect(generator.getAllMDXFiles()).rejects.toThrow(
      /documentation source.*leaked\.mdx.*symbolic link/i,
    );
    await expect(
      generator.handleFileChange("added", "leaked.mdx"),
    ).rejects.toThrow(/documentation source.*leaked\.mdx.*symbolic link/i);
    expect(await fs.pathExists(path.join(outputDir, "app"))).toBe(false);
  });

  it("rejects a symlinked config before mutating output or source files", async () => {
    const { root } = await fixture();
    const projectRoot = path.join(root, "project");
    const watchDir = path.join(projectRoot, "docs");
    const outputDir = path.join(projectRoot, "site");
    const externalConfig = path.join(root, "external-config.json");
    const existingPage = path.join(outputDir, "app", "existing", "page.tsx");
    await fs.ensureDir(watchDir);
    await fs.outputJson(path.join(outputDir, ".doccupine-generated.json"), {
      generator: "doccupine",
      schemaVersion: 1,
    });
    await fs.outputFile(existingPage, "EXISTING_PAGE\n");
    await fs.writeJson(externalConfig, {
      name: "EXTERNAL_SECRET_MARKER",
      description: "LEAKED_DESCRIPTION",
    });
    await fs.symlink(externalConfig, path.join(projectRoot, "config.json"));
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const generator = new MDXToNextJSGenerator(
      watchDir,
      outputDir,
      [],
      projectRoot,
    );

    await expect(generator.init()).rejects.toThrow(
      /config source.*config\.json.*symbolic link/i,
    );

    expect(await fs.readFile(existingPage, "utf8")).toBe("EXISTING_PAGE\n");
    expect(await fs.readdir(watchDir)).toEqual([]);
  });

  it("does not load sections through a symlinked source", async () => {
    const { root } = await fixture();
    const projectRoot = path.join(root, "project");
    const watchDir = path.join(projectRoot, "docs");
    const externalSections = path.join(root, "external-sections.json");
    await fs.ensureDir(watchDir);
    await fs.writeJson(externalSections, [
      { label: "External", slug: "external", directory: "external" },
    ]);
    await fs.symlink(externalSections, path.join(projectRoot, "sections.json"));
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const generator = new MDXToNextJSGenerator(
      watchDir,
      path.join(projectRoot, "site"),
      [],
      projectRoot,
    );

    await expect(generator.loadSectionsConfig()).resolves.toBeNull();
  });

  it("ignores non-MDX file symlinks during documentation scans", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const linkedTarget = path.join(root, "notes.txt");
    await fs.writeFile(linkedTarget, "not documentation\n");
    await fs.symlink(linkedTarget, path.join(watchDir, "notes.txt"), "file");
    await fs.writeFile(path.join(watchDir, "guide.mdx"), "# Guide\n");
    const generator = new MDXToNextJSGenerator(watchDir, outputDir);

    await expect(generator.getAllMDXFiles()).resolves.toEqual(["guide.mdx"]);
  });

  it("does not write starter docs through a symlinked source directory", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const victimDir = path.join(root, "victim");
    await fs.ensureDir(victimDir);
    await fs.writeFile(path.join(victimDir, "keep.txt"), "UNCHANGED\n");
    await fs.symlink(victimDir, path.join(watchDir, "platform"), "dir");
    const generator = new MDXToNextJSGenerator(watchDir, outputDir);

    await expect(generator.createStartingDocs()).rejects.toThrow(
      /documentation source.*platform.*symbolic link/i,
    );
    expect(await fs.readdir(victimDir)).toEqual(["keep.txt"]);
    expect(await fs.readFile(path.join(victimDir, "keep.txt"), "utf8")).toBe(
      "UNCHANGED\n",
    );
    expect(await fs.pathExists(path.join(watchDir, "index.mdx"))).toBe(false);
  });

  it("seeds starter docs through an unchanged symlinked source root", async () => {
    const { root, outputDir } = await fixture();
    const realWatchDir = path.join(root, "real-docs");
    const linkedWatchDir = path.join(root, "linked-docs");
    await fs.ensureDir(realWatchDir);
    await fs.symlink(realWatchDir, linkedWatchDir, "dir");
    const generator = new MDXToNextJSGenerator(linkedWatchDir, outputDir);

    await generator.createStartingDocs();

    expect(await fs.pathExists(path.join(realWatchDir, "index.mdx"))).toBe(
      true,
    );
  });

  it("pins the documentation root across every starter write", async () => {
    const { root, watchDir } = await fixture();
    const originalDocs = path.join(root, "docs-original");
    const victimDir = path.join(root, "victim");
    await fs.ensureDir(victimDir);
    const sourceFs = new SecureSourceFs(watchDir, root);

    async function* starterFiles() {
      yield ["first.mdx", "FIRST\n"] as const;
      await fs.rename(watchDir, originalDocs);
      await fs.symlink(victimDir, watchDir, "dir");
      yield ["second.mdx", "SECOND\n"] as const;
    }

    await expect(
      sourceFs.writeStarterFilesIfEmpty(starterFiles()),
    ).rejects.toThrow(/source root changed.*starter documents/i);

    expect(
      await fs.readFile(path.join(originalDocs, "first.mdx"), "utf8"),
    ).toBe("FIRST\n");
    expect(await fs.pathExists(path.join(victimDir, "second.mdx"))).toBe(false);
  });

  it.skipIf(process.platform === "win32")(
    "does not overwrite an external starter file when the source root is swapped",
    async () => {
      const { root, watchDir, outputDir } = await fixture();
      const displacedDir = path.join(root, "docs-original");
      const victimDir = path.join(root, "victim");
      const victimIndex = path.join(victimDir, "index.mdx");
      const starterIndex = path.join(watchDir, "index.mdx");
      await fs.outputFile(victimIndex, "UNCHANGED\n");
      const generator = new MDXToNextJSGenerator(watchDir, outputDir);
      const lstat = fs.lstat.bind(fs);
      let swapped = false;
      vi.spyOn(fs, "lstat").mockImplementation(async (candidate: string) => {
        try {
          return await lstat(candidate);
        } catch (error) {
          if (!swapped && path.resolve(candidate) === starterIndex) {
            await fs.rename(watchDir, displacedDir);
            await fs.symlink(victimDir, watchDir, "dir");
            swapped = true;
          }
          throw error;
        }
      });

      await expect(generator.createStartingDocs()).rejects.toThrow(
        /starter path changed/i,
      );

      expect(swapped).toBe(true);
      expect(await fs.readFile(victimIndex, "utf8")).toBe("UNCHANGED\n");
    },
  );

  it.skipIf(process.platform === "win32")(
    "removes an external starter file created during a source-root swap",
    async () => {
      const { root, watchDir, outputDir } = await fixture();
      const displacedDir = path.join(root, "docs-original");
      const victimDir = path.join(root, "victim");
      const victimIndex = path.join(victimDir, "index.mdx");
      const starterIndex = path.join(watchDir, "index.mdx");
      await fs.ensureDir(victimDir);
      const generator = new MDXToNextJSGenerator(watchDir, outputDir);
      const lstat = fs.lstat.bind(fs);
      let swapped = false;
      vi.spyOn(fs, "lstat").mockImplementation(async (candidate: string) => {
        try {
          return await lstat(candidate);
        } catch (error) {
          if (!swapped && path.resolve(candidate) === starterIndex) {
            await fs.rename(watchDir, displacedDir);
            await fs.symlink(victimDir, watchDir, "dir");
            swapped = true;
          }
          throw error;
        }
      });

      await expect(generator.createStartingDocs()).rejects.toThrow(
        /starter path changed/i,
      );

      expect(swapped).toBe(true);
      expect(await fs.pathExists(victimIndex)).toBe(false);
    },
  );

  it("restores required JSON modules when project config is deleted", async () => {
    const { watchDir, outputDir } = await fixture();
    await Promise.all([
      fs.ensureDir(path.join(outputDir, "app")),
      fs.ensureDir(path.join(outputDir, "services", "mcp")),
    ]);
    const generator = new MDXToNextJSGenerator(watchDir, outputDir);

    for (const [name, expected] of [
      ["config.json", "{}\n"],
      ["theme.json", "{}\n"],
      ["links.json", "[]\n"],
      ["navigation.json", "[]\n"],
    ] as const) {
      await fs.writeFile(path.join(outputDir, name), '{"old":true}\n');
      await generator.handleConfigFileDelete(name);
      expect(await fs.readFile(path.join(outputDir, name), "utf8")).toBe(
        expected,
      );
    }
  });

  it("atomically replaces a hard-linked config destination", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const sourcePath = path.join(root, "config.json");
    const destPath = path.join(outputDir, "config.json");
    const externalPeer = path.join(root, "external-config.json");
    await fs.writeFile(sourcePath, '{"name":"safe"}\n');
    await fs.writeFile(externalPeer, '{"name":"keep"}\n');
    await fs.ensureDir(outputDir);
    await fs.link(externalPeer, destPath);
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);

    await generator.copyCustomConfigFiles();

    await expect(fs.readFile(destPath, "utf8")).resolves.toBe(
      '{"name":"safe"}\n',
    );
    await expect(fs.readFile(externalPeer, "utf8")).resolves.toBe(
      '{"name":"keep"}\n',
    );
  });

  it("restores sections.json and rebuilds routes after deletion", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.outputFile(
      path.join(watchDir, "guides", "intro.mdx"),
      "---\ntitle: Intro\n---\nIntro\n",
    );
    const sectionsPath = path.join(root, "sections.json");
    await fs.writeJson(sectionsPath, [
      { label: "Guides", slug: "guides", directory: "guides" },
    ]);
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();

    await fs.remove(sectionsPath);
    await generator.handleConfigFileDelete(sectionsPath);

    expect(
      await fs.readFile(path.join(outputDir, "sections.json"), "utf8"),
    ).toBe("[]\n");
    expect(
      await fs.pathExists(
        path.join(outputDir, "app", "(site)", "guides", "intro", "page.tsx"),
      ),
    ).toBe(true);
  });

  it("preserves a real section page containing the redirect function name", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.outputFile(
      path.join(watchDir, "guides", "intro.mdx"),
      "---\ntitle: Intro\n---\nIntro\n",
    );
    await fs.writeJson(path.join(root, "sections.json"), [
      { label: "Guides", slug: "guides", directory: "guides" },
    ]);
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    await fs.outputFile(
      path.join(watchDir, "guides", "index.mdx"),
      "---\ntitle: Guides\n---\n```tsx\nfunction SectionIndex() {}\n```\n",
    );

    await generator.handleFileChange("added", path.join("guides", "index.mdx"));

    const page = await fs.readFile(
      path.join(outputDir, "app", "(site)", "guides", "page.tsx"),
      "utf8",
    );
    expect(page).toContain("function SectionIndex() {}");
  });

  it("does not preserve a section redirect for a page that failed to render", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.outputFile(
      path.join(watchDir, "guides", "intro.mdx"),
      "---\ntitle: Intro\n---\nIntro\n",
    );
    await fs.writeJson(path.join(root, "sections.json"), [
      { label: "Guides", slug: "guides", directory: "guides" },
    ]);
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    await fs.outputFile(
      path.join(watchDir, "guides", "index.mdx"),
      "---\ntitle: Guides\nimage: &self [*self]\n---\nGuides\n",
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    await generator.handleFileChange("added", "guides/index.mdx");

    expect(
      await fs.pathExists(
        path.join(outputDir, "app", "(site)", "guides", "page.tsx"),
      ),
    ).toBe(false);
    const manifest = await fs.readJson(
      path.join(outputDir, ".doccupine-artifacts.json"),
    );
    expect(manifest.routes).not.toContainEqual(
      expect.objectContaining({ kind: "mdx", source: "guides/index.mdx" }),
    );

    await fs.writeFile(
      path.join(watchDir, "guides", "intro.mdx"),
      "---\ntitle: Updated Intro\n---\nUpdated intro\n",
    );
    await generator.handleFileChange("changed", "guides/intro.mdx");

    expect(
      await fs.pathExists(
        path.join(outputDir, "app", "(site)", "guides", "page.tsx"),
      ),
    ).toBe(false);
    const updatedManifest = await fs.readJson(
      path.join(outputDir, ".doccupine-artifacts.json"),
    );
    expect(updatedManifest.routes).not.toContainEqual(
      expect.objectContaining({ kind: "mdx", source: "guides/index.mdx" }),
    );
  });

  it("retains the last successful page when bulk regeneration fails", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const sourcePath = path.join(watchDir, "guide.mdx");
    const pagePath = path.join(outputDir, "app", "(site)", "guide", "page.tsx");
    await fs.writeFile(sourcePath, "---\ntitle: Guide\n---\nOriginal\n");
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    const originalPage = await fs.readFile(pagePath, "utf8");
    await fs.writeFile(
      sourcePath,
      "---\ntitle: Guide\nimage: &self [*self]\n---\nBroken\n",
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    await generator.processAllMDXFiles();

    expect(await fs.readFile(pagePath, "utf8")).toBe(originalPage);
    const manifest = await fs.readJson(
      path.join(outputDir, ".doccupine-artifacts.json"),
    );
    expect(manifest.routes).toContainEqual(
      expect.objectContaining({
        kind: "mdx",
        source: "guide.mdx",
        slug: "guide",
      }),
    );
    const docsContent = await fs.readJson(
      path.join(outputDir, "services", "mcp", "docs-content.json"),
    );
    expect(docsContent).toContainEqual(
      expect.objectContaining({
        uri: "docs://guide",
        content: "Original\n",
      }),
    );
    expect(
      await fs.readFile(path.join(outputDir, "app", "sitemap.ts"), "utf8"),
    ).toContain('slug: "guide"');
    const llmsFull = await fs.readFile(
      path.join(outputDir, "public", "llms-full.txt"),
      "utf8",
    );
    expect(llmsFull).toContain("Original");
    expect(llmsFull).not.toContain("Broken");
  });

  it("keeps the previous route when a moved replacement fails to render", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const sourcePath = path.join(watchDir, "guide.mdx");
    const previousPage = path.join(
      outputDir,
      "app",
      "(site)",
      "guides",
      "guide",
      "page.tsx",
    );
    const nextPage = path.join(
      outputDir,
      "app",
      "(site)",
      "tutorials",
      "guide",
      "page.tsx",
    );
    await fs.writeFile(
      sourcePath,
      "---\ntitle: Guide\nsection: Guides\n---\nOriginal\n",
    );
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    const originalPage = await fs.readFile(previousPage, "utf8");
    await fs.writeFile(
      sourcePath,
      "---\ntitle: Guide\nsection: Tutorials\nimage: &self [*self]\n---\nBroken\n",
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    await generator.handleFileChange("changed", "guide.mdx");

    expect(await fs.readFile(previousPage, "utf8")).toBe(originalPage);
    expect(await fs.pathExists(nextPage)).toBe(false);
    const manifest = await fs.readJson(
      path.join(outputDir, ".doccupine-artifacts.json"),
    );
    expect(manifest.routes).toContainEqual(
      expect.objectContaining({
        kind: "mdx",
        source: "guide.mdx",
        slug: "guides/guide",
      }),
    );
  });

  it("removes stale output when a same-route source handoff fails", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const pagePath = path.join(outputDir, "app", "(site)", "guide", "page.tsx");
    await fs.writeFile(
      path.join(watchDir, "guide.mdx"),
      "---\ntitle: Guide\n---\nOriginal\n",
    );
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();

    await fs.remove(path.join(watchDir, "guide.mdx"));
    await fs.outputFile(
      path.join(watchDir, "guide", "index.mdx"),
      "---\ntitle: Broken\nimage: &self [*self]\n---\nBroken\n",
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    await generator.processAllMDXFiles();

    expect(await fs.pathExists(pagePath)).toBe(false);
    let manifest = await fs.readJson(
      path.join(outputDir, ".doccupine-artifacts.json"),
    );
    expect(manifest.routes).not.toContainEqual(
      expect.objectContaining({ kind: "mdx", slug: "guide" }),
    );

    await fs.remove(path.join(watchDir, "guide", "index.mdx"));
    await generator.handleFileDelete("guide/index.mdx");
    expect(await fs.pathExists(pagePath)).toBe(false);
    manifest = await fs.readJson(
      path.join(outputDir, ".doccupine-artifacts.json"),
    );
    expect(manifest.routes).not.toContainEqual(
      expect.objectContaining({ kind: "mdx", slug: "guide" }),
    );
  });

  it("does not retain historical ownership after startup clears page output", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const sourcePath = path.join(watchDir, "guide.mdx");
    const pagePath = path.join(outputDir, "app", "(site)", "guide", "page.tsx");
    await fs.writeFile(sourcePath, "---\ntitle: Guide\n---\nOriginal\n");
    await new MDXToNextJSGenerator(watchDir, outputDir, [], root).init();
    expect(await fs.pathExists(pagePath)).toBe(true);
    await fs.writeFile(
      sourcePath,
      "---\ntitle: Guide\nimage: &self [*self]\n---\nBroken\n",
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    await new MDXToNextJSGenerator(watchDir, outputDir, [], root).init();

    expect(await fs.pathExists(pagePath)).toBe(false);
    const manifest = await fs.readJson(
      path.join(outputDir, ".doccupine-artifacts.json"),
    );
    expect(manifest.routes).not.toContainEqual(
      expect.objectContaining({ kind: "mdx", source: "guide.mdx" }),
    );
  });

  it("retains the last successful homepage and aggregate content", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const sourcePath = path.join(watchDir, "index.mdx");
    const pagePath = path.join(outputDir, "app", "(site)", "page.tsx");
    await fs.writeFile(sourcePath, "---\ntitle: Home\n---\nORIGINAL_HOME\n");
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    const originalPage = await fs.readFile(pagePath, "utf8");
    await fs.writeFile(
      sourcePath,
      "---\ntitle: Broken Home\nimage: &self [*self]\n---\nBROKEN_HOME\n",
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    await generator.handleFileChange("changed", "index.mdx");

    expect(await fs.readFile(pagePath, "utf8")).toBe(originalPage);
    const docsContent = await fs.readJson(
      path.join(outputDir, "services", "mcp", "docs-content.json"),
    );
    expect(docsContent).toContainEqual(
      expect.objectContaining({
        uri: "docs:///",
        content: "ORIGINAL_HOME\n",
      }),
    );
    expect(JSON.stringify(docsContent)).not.toContain("BROKEN_HOME");
  });

  it("deletes the recorded frontmatter route and preserves nested pages", async () => {
    const { watchDir, outputDir } = await fixture();
    await fs.outputFile(
      path.join(watchDir, "guide.mdx"),
      "---\ntitle: Guide\nsection: Guides\n---\nParent\n",
    );
    await fs.outputFile(
      path.join(watchDir, "guides", "child.mdx"),
      "---\ntitle: Child\nsection: Guides\n---\nChild\n",
    );

    const generator = new MDXToNextJSGenerator(watchDir, outputDir);
    await generator.init();
    const parentPage = path.join(
      outputDir,
      "app",
      "(site)",
      "guides",
      "guide",
      "page.tsx",
    );
    const childPage = path.join(
      outputDir,
      "app",
      "(site)",
      "guides",
      "child",
      "page.tsx",
    );
    expect(await fs.pathExists(parentPage)).toBe(true);
    expect(await fs.pathExists(childPage)).toBe(true);

    await fs.writeFile(
      path.join(watchDir, "guide.mdx"),
      "---\ntitle: Guide\nsection: Tutorials\n---\nMoved\n",
    );
    await generator.handleFileChange("changed", "guide.mdx");
    const movedPage = path.join(
      outputDir,
      "app",
      "(site)",
      "tutorials",
      "guide",
      "page.tsx",
    );
    expect(await fs.pathExists(parentPage)).toBe(false);
    expect(await fs.pathExists(childPage)).toBe(true);
    expect(await fs.pathExists(movedPage)).toBe(true);

    await fs.remove(path.join(watchDir, "guide.mdx"));
    await generator.handleFileDelete("guide.mdx");

    expect(await fs.pathExists(movedPage)).toBe(false);
    expect(await fs.pathExists(childPage)).toBe(true);
  });

  it("generates the surviving source when deleting a colliding route owner", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const originalSource = path.join(watchDir, "guide.mdx");
    const survivingSource = path.join(watchDir, "guide", "index.mdx");
    const pagePath = path.join(outputDir, "app", "(site)", "guide", "page.tsx");
    await fs.writeFile(
      originalSource,
      "---\ntitle: Original\n---\nORIGINAL_BODY\n",
    );
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    await fs.outputFile(
      survivingSource,
      "---\ntitle: Survivor\n---\nSURVIVOR_BODY\n",
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    await generator.handleFileChange("added", "guide/index.mdx");
    await fs.remove(originalSource);
    await generator.handleFileDelete("guide.mdx");

    expect(await fs.readFile(pagePath, "utf8")).toContain("SURVIVOR_BODY");
    const manifest = await fs.readJson(
      path.join(outputDir, ".doccupine-artifacts.json"),
    );
    expect(manifest.routes).toContainEqual(
      expect.objectContaining({
        kind: "mdx",
        source: "guide/index.mdx",
        slug: "guide",
      }),
    );
  });

  it("retries changed content after deleting its colliding source", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const sourcePath = path.join(watchDir, "guide.mdx");
    const collidingPath = path.join(watchDir, "guide", "index.mdx");
    const pagePath = path.join(outputDir, "app", "(site)", "guide", "page.tsx");
    await fs.writeFile(sourcePath, "---\ntitle: Guide\n---\nORIGINAL_BODY\n");
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    await fs.outputFile(
      collidingPath,
      "---\ntitle: Collision\n---\nCOLLIDING_BODY\n",
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    await generator.handleFileChange("added", "guide/index.mdx");
    await fs.writeFile(
      sourcePath,
      "---\ntitle: Updated Guide\n---\nUPDATED_BODY\n",
    );
    await generator.handleFileChange("changed", "guide.mdx");

    await fs.remove(collidingPath);
    await generator.handleFileDelete("guide/index.mdx");

    expect(await fs.readFile(pagePath, "utf8")).toContain("UPDATED_BODY");
    const docsContent = await fs.readJson(
      path.join(outputDir, "services", "mcp", "docs-content.json"),
    );
    expect(docsContent).toContainEqual(
      expect.objectContaining({
        uri: "docs://guide",
        content: "UPDATED_BODY\n",
      }),
    );
  });

  it("recovers changed content after a bulk collision clears", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const sourcePath = path.join(watchDir, "guide.mdx");
    const collidingPath = path.join(watchDir, "guide", "index.mdx");
    const pagePath = path.join(outputDir, "app", "(site)", "guide", "page.tsx");
    await fs.writeFile(sourcePath, "---\ntitle: Guide\n---\nORIGINAL_BODY\n");
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    await fs.writeFile(
      sourcePath,
      "---\ntitle: Updated Guide\n---\nUPDATED_BODY\n",
    );
    await fs.outputFile(
      collidingPath,
      "---\ntitle: Collision\n---\nCOLLIDING_BODY\n",
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(generator.processAllMDXFiles()).rejects.toThrow(
      /Route collision/,
    );
    await fs.remove(collidingPath);
    await generator.handleFileDelete("guide/index.mdx");

    expect(await fs.readFile(pagePath, "utf8")).toContain("UPDATED_BODY");
    const docsContent = await fs.readJson(
      path.join(outputDir, "services", "mcp", "docs-content.json"),
    );
    expect(docsContent).toContainEqual(
      expect.objectContaining({
        uri: "docs://guide",
        content: "UPDATED_BODY\n",
      }),
    );
  });

  it("lets a successful source replace a conflicting retained snapshot", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const originalSource = path.join(watchDir, "guide.mdx");
    const replacementSource = path.join(watchDir, "guide", "index.mdx");
    const pagePath = path.join(outputDir, "app", "(site)", "guide", "page.tsx");
    await fs.writeFile(
      originalSource,
      "---\ntitle: Original\n---\nORIGINAL_BODY\n",
    );
    await fs.writeJson(path.join(root, "sections.json"), [
      { label: "Docs", slug: "" },
      { label: "Tutorials", slug: "tutorials" },
    ]);
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    await fs.writeFile(
      originalSource,
      "---\ntitle: Broken move\nsection: Tutorials\nimage: &self [*self]\n---\nBROKEN_BODY\n",
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    await generator.handleFileChange("changed", "guide.mdx");
    await fs.outputFile(
      replacementSource,
      "---\ntitle: Replacement\n---\nREPLACEMENT_BODY\n",
    );

    await generator.handleFileChange("added", "guide/index.mdx");

    expect(await fs.readFile(pagePath, "utf8")).toContain("REPLACEMENT_BODY");
    const manifest = await fs.readJson(
      path.join(outputDir, ".doccupine-artifacts.json"),
    );
    expect(
      manifest.routes.filter(
        (route: { kind: string; slug: string }) =>
          route.kind === "mdx" && route.slug === "guide",
      ),
    ).toEqual([
      expect.objectContaining({ source: "guide/index.mdx", slug: "guide" }),
    ]);
    const docsContent = await fs.readJson(
      path.join(outputDir, "services", "mcp", "docs-content.json"),
    );
    expect(
      docsContent.filter(
        (document: { uri: string }) => document.uri === "docs://guide",
      ),
    ).toEqual([expect.objectContaining({ content: "REPLACEMENT_BODY\n" })]);
  });

  it("retries a surviving collision source whose cached route is stale", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const movingSource = path.join(watchDir, "guide.mdx");
    const blockingSource = path.join(watchDir, "tutorials", "guide.mdx");
    const previousPage = path.join(
      outputDir,
      "app",
      "(site)",
      "guide",
      "page.tsx",
    );
    const movedPage = path.join(
      outputDir,
      "app",
      "(site)",
      "tutorials",
      "guide",
      "page.tsx",
    );
    await fs.writeFile(movingSource, "---\ntitle: Moving\n---\nMOVING_BODY\n");
    await fs.outputFile(
      blockingSource,
      "---\ntitle: Blocking\nsection: Tutorials\n---\nBLOCKING_BODY\n",
    );
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    await fs.writeFile(
      movingSource,
      "---\ntitle: Moving\nsection: Tutorials\n---\nMOVED_BODY\n",
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    await generator.handleFileChange("changed", "guide.mdx");

    await fs.remove(blockingSource);
    await generator.handleFileDelete("tutorials/guide.mdx");

    expect(await fs.pathExists(previousPage)).toBe(false);
    expect(await fs.readFile(movedPage, "utf8")).toContain("MOVED_BODY");
    const manifest = await fs.readJson(
      path.join(outputDir, ".doccupine-artifacts.json"),
    );
    expect(manifest.routes).toContainEqual(
      expect.objectContaining({
        kind: "mdx",
        source: "guide.mdx",
        slug: "tutorials/guide",
      }),
    );
  });

  it("never overwrites or cleans up a hand-written OpenAPI route", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const specPath = path.join(root, "openapi.json");
    const operation = {
      operationId: "listUsers",
      summary: "Generated operation",
      tags: ["users"],
      responses: { "200": { description: "OK" } },
    };
    await fs.writeJson(specPath, {
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: { "/users": { get: operation } },
    });
    await fs.outputFile(
      path.join(watchDir, "api-reference", "users", "listusers.mdx"),
      "---\ntitle: Hand Written\n---\nHAND_WRITTEN_SENTINEL\n",
    );

    const generator = new MDXToNextJSGenerator(
      watchDir,
      outputDir,
      [{ name: "Test", file: specPath }],
      root,
    );
    await generator.init();
    const pagePath = path.join(
      outputDir,
      "app",
      "(site)",
      "api-reference",
      "users",
      "listusers",
      "page.tsx",
    );
    expect(await fs.readFile(pagePath, "utf8")).toContain(
      "HAND_WRITTEN_SENTINEL",
    );

    await fs.writeJson(specPath, {
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {},
    });
    await generator.handleOpenApiChange();

    expect(await fs.readFile(pagePath, "utf8")).toContain(
      "HAND_WRITTEN_SENTINEL",
    );
  });

  it("hands a removed MDX route back to OpenAPI across a restart", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const specPath = path.join(root, "openapi.json");
    await fs.writeJson(specPath, {
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {
        "/users": {
          get: {
            operationId: "listUsers",
            summary: "Generated operation",
            tags: ["users"],
            responses: { "200": { description: "OK" } },
          },
        },
      },
    });
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
    const handwrittenSource = path.join(
      watchDir,
      "api-reference",
      "users",
      "listusers.mdx",
    );
    await fs.outputFile(
      handwrittenSource,
      "---\ntitle: Hand Written\n---\nHAND_WRITTEN_SENTINEL\n",
    );
    const specs = [{ name: "Test", file: specPath }];
    const pagePath = path.join(
      outputDir,
      "app",
      "(site)",
      "api-reference",
      "users",
      "listusers",
      "page.tsx",
    );

    await new MDXToNextJSGenerator(watchDir, outputDir, specs, root).init();
    await fs.remove(handwrittenSource);
    await new MDXToNextJSGenerator(watchDir, outputDir, specs, root).init();

    expect(await fs.readFile(pagePath, "utf8")).toContain(
      "Generated operation",
    );
  });

  it("clears persisted OpenAPI ownership after restarting without specs", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const specPath = path.join(root, "openapi.json");
    await fs.writeJson(specPath, {
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {
        "/users": {
          get: {
            operationId: "listUsers",
            summary: "Generated operation",
            tags: ["users"],
            responses: { "200": { description: "OK" } },
          },
        },
      },
    });
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
    await new MDXToNextJSGenerator(
      watchDir,
      outputDir,
      [{ name: "Test", file: specPath }],
      root,
    ).init();
    let manifest = await fs.readJson(
      path.join(outputDir, ".doccupine-artifacts.json"),
    );
    expect(manifest.routes).toContainEqual(
      expect.objectContaining({ kind: "openapi" }),
    );

    await new MDXToNextJSGenerator(watchDir, outputDir, [], root).init();

    manifest = await fs.readJson(
      path.join(outputDir, ".doccupine-artifacts.json"),
    );
    expect(manifest.routes).not.toContainEqual(
      expect.objectContaining({ kind: "openapi" }),
    );
  });

  it("does not publish OpenAPI metadata for a route blocked by broken MDX", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const specPath = path.join(root, "openapi.json");
    await fs.writeJson(specPath, {
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {
        "/users": {
          get: {
            operationId: "listUsers",
            summary: "Generated operation",
            tags: ["users"],
            responses: { "200": { description: "OK" } },
          },
        },
      },
    });
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
    await fs.outputFile(
      path.join(watchDir, "api-reference", "users", "listusers.mdx"),
      "---\ntitle: Broken\nimage: &self [*self]\n---\nBroken\n",
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    const generator = new MDXToNextJSGenerator(
      watchDir,
      outputDir,
      [{ name: "Test", file: specPath }],
      root,
    );

    await generator.init();

    expect(
      await fs.pathExists(
        path.join(
          outputDir,
          "app",
          "(site)",
          "api-reference",
          "users",
          "listusers",
          "page.tsx",
        ),
      ),
    ).toBe(false);
    const layout = await fs.readFile(
      path.join(outputDir, "app", "(site)", "layout.tsx"),
      "utf8",
    );
    expect(layout).not.toContain('slug: "api-reference/users/listusers"');
  });

  it("removes an OpenAPI page claimed by a broken incremental MDX source", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const specPath = path.join(root, "openapi.json");
    await fs.writeJson(specPath, {
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {
        "/users": {
          get: {
            operationId: "listUsers",
            summary: "Generated operation",
            tags: ["users"],
            responses: { "200": { description: "OK" } },
          },
        },
      },
    });
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
    const generator = new MDXToNextJSGenerator(
      watchDir,
      outputDir,
      [{ name: "Test", file: specPath }],
      root,
    );
    await generator.init();
    const pagePath = path.join(
      outputDir,
      "app",
      "(site)",
      "api-reference",
      "users",
      "listusers",
      "page.tsx",
    );
    expect(await fs.pathExists(pagePath)).toBe(true);
    await fs.outputFile(
      path.join(watchDir, "api-reference", "users", "listusers.mdx"),
      "---\ntitle: Broken\nimage: &self [*self]\n---\nBroken\n",
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    await generator.handleFileChange(
      "added",
      "api-reference/users/listusers.mdx",
    );

    expect(await fs.pathExists(pagePath)).toBe(false);
    const manifest = await fs.readJson(
      path.join(outputDir, ".doccupine-artifacts.json"),
    );
    expect(manifest.routes).not.toContainEqual(
      expect.objectContaining({ slug: "api-reference/users/listusers" }),
    );
    const layout = await fs.readFile(
      path.join(outputDir, "app", "(site)", "layout.tsx"),
      "utf8",
    );
    expect(layout).not.toContain('slug: "api-reference/users/listusers"');
  });

  it("does not overwrite retained MDX output with OpenAPI after a failed move", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const specPath = path.join(root, "openapi.json");
    await fs.writeJson(specPath, {
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {
        "/users": {
          get: {
            operationId: "listUsers",
            summary: "Generated operation",
            tags: ["users"],
            responses: { "200": { description: "OK" } },
          },
        },
      },
    });
    const sourcePath = path.join(
      watchDir,
      "api-reference",
      "users",
      "listusers.mdx",
    );
    await fs.outputFile(
      sourcePath,
      "---\ntitle: Handwritten\n---\nHANDWRITTEN_BODY\n",
    );
    const generator = new MDXToNextJSGenerator(
      watchDir,
      outputDir,
      [{ name: "Test", file: specPath }],
      root,
    );
    await generator.init();
    const pagePath = path.join(
      outputDir,
      "app",
      "(site)",
      "api-reference",
      "users",
      "listusers",
      "page.tsx",
    );
    await fs.writeFile(
      sourcePath,
      "---\ntitle: Broken move\nsection: Tutorials\nimage: &self [*self]\n---\nBROKEN_BODY\n",
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    await generator.handleFileChange(
      "changed",
      "api-reference/users/listusers.mdx",
    );

    const page = await fs.readFile(pagePath, "utf8");
    expect(page).toContain("HANDWRITTEN_BODY");
    expect(page).not.toContain("Generated operation");
    const manifest = await fs.readJson(
      path.join(outputDir, ".doccupine-artifacts.json"),
    );
    expect(manifest.routes).toContainEqual(
      expect.objectContaining({
        kind: "mdx",
        slug: "api-reference/users/listusers",
      }),
    );
    expect(manifest.routes).not.toContainEqual(
      expect.objectContaining({
        kind: "openapi",
        slug: "api-reference/users/listusers",
      }),
    );
  });

  it("keeps the active OpenAPI config and watcher target after an invalid replacement", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const specPath = path.join(root, "openapi.json");
    const writeSpec = (summary: string) =>
      fs.writeJson(specPath, {
        openapi: "3.0.0",
        info: { title: "Test", version: "1.0.0" },
        paths: {
          "/users": {
            get: {
              operationId: "listUsers",
              summary,
              tags: ["users"],
              responses: { "200": { description: "OK" } },
            },
          },
        },
      });
    await writeSpec("Initial summary");
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");

    const generator = new MDXToNextJSGenerator(
      watchDir,
      outputDir,
      [{ name: "Test", file: specPath }],
      root,
    );
    await generator.init();
    await fs.writeJson(path.join(root, "doccupine.json"), {
      watchDir: "docs",
      outputDir: "site",
      openapi: "missing.json",
    });
    await generator.handleDoccupineConfigChange();

    await writeSpec("Updated active summary");
    await generator.handleOpenApiChange();
    const pagePath = path.join(
      outputDir,
      "app",
      "(site)",
      "api-reference",
      "users",
      "listusers",
      "page.tsx",
    );
    expect(await fs.readFile(pagePath, "utf8")).toContain(
      "Updated active summary",
    );
  });

  it("rejects a symlinked doccupine.json during hot reload", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    const externalConfig = path.join(root, "external-doccupine.json");
    await fs.writeJson(externalConfig, {
      watchDir: "other-docs",
      outputDir: "other-site",
    });
    await fs.symlink(externalConfig, path.join(root, "doccupine.json"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await generator.handleDoccupineConfigChange();

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("keeping the current configuration"),
      expect.stringContaining("symbolic link"),
    );
  });

  it("rolls back a parsed OpenAPI config when regeneration fails", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const oldSpecPath = path.join(root, "old-openapi.json");
    const candidateSpecPath = path.join(root, "candidate-openapi.json");
    const writeSpec = (specPath: string, resource: string, summary: string) =>
      fs.writeJson(specPath, {
        openapi: "3.0.0",
        info: { title: "Test", version: "1.0.0" },
        paths: {
          [`/${resource}`]: {
            get: {
              operationId: `list${resource}`,
              summary,
              tags: [resource],
              responses: { "200": { description: "OK" } },
            },
          },
        },
      });
    await writeSpec(oldSpecPath, "users", "Old users");
    await writeSpec(candidateSpecPath, "pets", "Candidate pets");
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");

    const generator = new MDXToNextJSGenerator(
      watchDir,
      outputDir,
      [{ name: "Old", file: oldSpecPath }],
      root,
    );
    await generator.init();
    const oldPagePath = path.join(
      outputDir,
      "app",
      "(site)",
      "api-reference",
      "users",
      "listusers",
      "page.tsx",
    );
    const candidatePagePath = path.join(
      outputDir,
      "app",
      "(site)",
      "api-reference",
      "pets",
      "listpets",
      "page.tsx",
    );
    const llmsPath = path.join(outputDir, "public", "llms.txt");
    const oldPage = await fs.readFile(oldPagePath, "utf8");
    const oldLlms = await fs.readFile(llmsPath, "utf8");

    type GeneratorInternals = {
      openApiSpecs: Array<{ name: string; file: string }>;
      syncOpenApiSpecWatcher(): Promise<void>;
    };
    const internals = generator as unknown as GeneratorInternals;
    const syncWatcher = internals.syncOpenApiSpecWatcher.bind(generator);
    const watcherTargets: string[] = [];
    vi.spyOn(internals, "syncOpenApiSpecWatcher").mockImplementation(
      async () => {
        watcherTargets.push(
          internals.openApiSpecs.map((spec) => path.basename(spec.file)).join(),
        );
        await syncWatcher();
      },
    );
    let candidatePageWasWritten = false;
    vi.spyOn(generator, "updateLlmsFiles").mockImplementationOnce(async () => {
      candidatePageWasWritten = await fs.pathExists(candidatePagePath);
      throw new Error("Injected aggregate failure");
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
    await fs.writeJson(path.join(root, "doccupine.json"), {
      watchDir: "docs",
      outputDir: "site",
      openapi: [{ name: "Candidate", file: "candidate-openapi.json" }],
    });

    await generator.handleDoccupineConfigChange();

    expect(candidatePageWasWritten).toBe(true);
    expect(internals.openApiSpecs).toEqual([
      { name: "Old", file: oldSpecPath },
    ]);
    expect(watcherTargets).toEqual([
      "candidate-openapi.json",
      "old-openapi.json",
    ]);
    expect(await fs.pathExists(candidatePagePath)).toBe(false);
    expect(await fs.readFile(oldPagePath, "utf8")).toBe(oldPage);
    expect(await fs.readFile(llmsPath, "utf8")).toBe(oldLlms);

    await writeSpec(oldSpecPath, "users", "Updated old users");
    await generator.handleOpenApiChange();
    expect(await fs.readFile(oldPagePath, "utf8")).toContain(
      "Updated old users",
    );
    await generator.stop();
  });

  it("rejects schema-invalid config reloads before changing generated output", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const specPath = path.join(root, "openapi.json");
    const writeSpec = (summary: string) =>
      fs.writeJson(specPath, {
        openapi: "3.0.0",
        info: { title: "Test", version: "1.0.0" },
        paths: {
          "/users": {
            get: {
              operationId: "listUsers",
              summary,
              tags: ["users"],
              responses: { "200": { description: "OK" } },
            },
          },
        },
      });
    await writeSpec("Initial summary");
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");

    const generator = new MDXToNextJSGenerator(
      watchDir,
      outputDir,
      [{ name: "Test", file: specPath }],
      root,
    );
    await generator.init();
    const pagePath = path.join(
      outputDir,
      "app",
      "(site)",
      "api-reference",
      "users",
      "listusers",
      "page.tsx",
    );
    const llmsPath = path.join(outputDir, "public", "llms.txt");
    const initialPage = await fs.readFile(pagePath, "utf8");
    const initialLlms = await fs.readFile(llmsPath, "utf8");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const invalidConfigs: unknown[] = [
      {},
      {
        watchDir: "docs",
        outputDir: "site",
        openapi: [{ name: "Missing file" }],
      },
      {
        watchDir: "docs",
        outputDir: "docs/generated",
        openapi: specPath,
      },
      { watchDir: "", outputDir: "site", openapi: specPath },
      {
        watchDir: "docs",
        outputDir: "site",
        port: "70000",
        openapi: specPath,
      },
      {
        watchDir: "docs",
        outputDir: "site",
        packageManager: "yarn",
        openapi: specPath,
      },
    ];

    for (const invalidConfig of invalidConfigs) {
      await fs.writeJson(path.join(root, "doccupine.json"), invalidConfig);
      await generator.handleDoccupineConfigChange();
      expect(await fs.readFile(pagePath, "utf8")).toBe(initialPage);
      expect(await fs.readFile(llmsPath, "utf8")).toBe(initialLlms);
    }
    expect(warn).toHaveBeenCalledTimes(invalidConfigs.length);

    await writeSpec("Updated active summary");
    await generator.handleOpenApiChange();
    expect(await fs.readFile(pagePath, "utf8")).toContain(
      "Updated active summary",
    );
  });

  it("keeps the restart hint for valid watch and output directory changes", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    await fs.writeJson(path.join(root, "doccupine.json"), {
      watchDir: "other-docs",
      outputDir: "other-site",
    });
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    await generator.handleDoccupineConfigChange();

    expect(log).toHaveBeenCalledWith(
      expect.stringContaining("watchDir/outputDir changes"),
    );
  });

  it("preserves project-owned public aggregate artifacts on every refresh", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
    const artifacts = [
      ["LLMS.TXT", "llms.txt", "USER_LLMS_INDEX\n"],
      ["Llms-Full.TxT", "llms-full.txt", "USER_LLMS_FULL\n"],
      ["SKILL.MD", "skill.md", "USER_SKILL\n"],
      [
        path.join(".WELL-KNOWN", "MCP.JSON"),
        path.join(".well-known", "mcp.json"),
        '{"user":true}\n',
      ],
    ] as const;
    for (const [sourceRelativePath, , content] of artifacts) {
      await fs.outputFile(
        path.join(root, "public", sourceRelativePath),
        content,
      );
    }

    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    await generator.updateLlmsFiles();

    for (const [, outputRelativePath, content] of artifacts) {
      expect(
        await fs.readFile(
          path.join(outputDir, "public", outputRelativePath),
          "utf8",
        ),
      ).toBe(content);
    }
  });

  it("rejects public symlinks during the initial public copy", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const sensitivePath = path.join(root, "sensitive.txt");
    const publicPath = path.join(root, "public", "leaked.txt");
    await fs.writeFile(sensitivePath, "SENSITIVE_PUBLIC_CONTENT\n");
    await fs.ensureDir(path.dirname(publicPath));
    await fs.symlink(sensitivePath, publicPath, "file");
    await fs.ensureDir(outputDir);
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);

    await expect(generator.copyPublicFiles()).rejects.toThrow(
      /public source.*leaked\.txt.*symbolic link/i,
    );
    expect(
      await fs.pathExists(path.join(outputDir, "public", "leaked.txt")),
    ).toBe(false);
  });

  it("rejects public symlinks during watch-style copies", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const sensitivePath = path.join(root, "sensitive.txt");
    const publicPath = path.join(root, "public", "leaked.txt");
    await fs.writeFile(sensitivePath, "SENSITIVE_PUBLIC_CONTENT\n");
    await fs.ensureDir(path.dirname(publicPath));
    await fs.symlink(sensitivePath, publicPath, "file");
    await fs.ensureDir(outputDir);
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(generator.handlePublicFileChange(publicPath)).rejects.toThrow(
      /public source.*leaked\.txt.*symbolic link/i,
    );
    expect(
      await fs.pathExists(path.join(outputDir, "public", "leaked.txt")),
    ).toBe(false);
  });

  it("atomically replaces a hard-linked public destination", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const sourcePath = path.join(root, "public", "asset.bin");
    const destPath = path.join(outputDir, "public", "asset.bin");
    const externalPeer = path.join(root, "external-peer.bin");
    await fs.outputFile(sourcePath, Buffer.from([0, 1, 2, 255]));
    await fs.outputFile(externalPeer, "keep");
    await fs.ensureDir(path.dirname(destPath));
    await fs.link(externalPeer, destPath);
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);

    await generator.handlePublicFileChange(sourcePath);

    await expect(fs.readFile(destPath)).resolves.toEqual(
      Buffer.from([0, 1, 2, 255]),
    );
    await expect(fs.readFile(externalPeer, "utf8")).resolves.toBe("keep");
  });

  it("prunes public files deleted while the generator was stopped", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const sourcePath = path.join(root, "public", "obsolete.txt");
    const outputPath = path.join(outputDir, "public", "obsolete.txt");
    await fs.outputFile(sourcePath, "obsolete\n");
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");

    const first = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await first.init();
    expect(await fs.readFile(outputPath, "utf8")).toBe("obsolete\n");

    await fs.remove(sourcePath);
    const second = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await second.init();

    expect(await fs.pathExists(outputPath)).toBe(false);
    const manifest = await fs.readJson(
      path.join(outputDir, ".doccupine-artifacts.json"),
    );
    expect(manifest.publicFiles).toEqual([]);
  });

  it("writes normalized analytics configuration to the generated runtime", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
    await fs.writeJson(path.join(root, "analytics.json"), {
      provider: "posthog",
      posthog: {
        key: "phc_test-key",
        host: "  https://posthog.example/  ",
      },
    });

    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();

    expect(await fs.readJson(path.join(outputDir, "analytics.json"))).toEqual({
      provider: "posthog",
      posthog: {
        key: "phc_test-key",
        host: "https://posthog.example",
      },
    });
    expect(
      await fs.readFile(path.join(outputDir, "next.config.ts"), "utf8"),
    ).toContain('destination: "https://posthog.example/:path*"');
  });

  it("reconciles source changes that predate watcher readiness", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const mdxPath = path.join(watchDir, "guide.mdx");
    const publicPath = path.join(root, "public", "asset.txt");
    await fs.outputFile(mdxPath, "---\ntitle: Old\n---\nOld body\n");
    await fs.outputFile(publicPath, "old asset\n");

    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();

    await fs.writeFile(mdxPath, "---\ntitle: New\n---\nNew body\n");
    await fs.remove(publicPath);
    await generator.startWatching();

    const page = await fs.readFile(
      path.join(outputDir, "app", "(site)", "guide", "page.tsx"),
      "utf8",
    );
    expect(page).toContain("New body");
    expect(
      await fs.pathExists(path.join(outputDir, "public", "asset.txt")),
    ).toBe(false);
    await generator.stop();
  });

  it("does not replay unchanged sources when watchers become ready", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
    await fs.writeJson(path.join(root, "config.json"), { name: "Docs" });
    await fs.outputFile(path.join(root, "public", "asset.txt"), "asset\n");
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    const processAll = vi.spyOn(generator, "processAllMDXFiles");
    const configChange = vi.spyOn(generator, "handleConfigFileChange");
    const configDelete = vi.spyOn(generator, "handleConfigFileDelete");
    const publicCopy = vi.spyOn(generator, "copyPublicFiles");

    await generator.startWatching();

    expect(processAll).not.toHaveBeenCalled();
    expect(configChange).not.toHaveBeenCalled();
    expect(configDelete).not.toHaveBeenCalled();
    expect(publicCopy).not.toHaveBeenCalled();
    await generator.stop();
  });

  it("recreates public watching after the source directory is replaced", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const publicDir = path.join(root, "public");
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
    await fs.outputFile(path.join(publicDir, "old.txt"), "old\n");
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    await generator.startWatching();

    await fs.remove(publicDir);
    await waitUntil(() =>
      fs
        .pathExists(path.join(outputDir, "public", "old.txt"))
        .then((exists) => !exists),
    );
    await fs.outputFile(path.join(publicDir, "new.txt"), "new\n");
    await waitUntil(() =>
      fs.pathExists(path.join(outputDir, "public", "new.txt")),
    );
    await fs.writeFile(path.join(publicDir, "new.txt"), "updated\n");
    await waitUntil(async () => {
      try {
        return (
          (await fs.readFile(
            path.join(outputDir, "public", "new.txt"),
            "utf8",
          )) === "updated\n"
        );
      } catch {
        return false;
      }
    });

    await generator.stop();
  });

  it.skipIf(process.platform !== "darwin" && process.platform !== "win32")(
    "preserves case-only public renames on case-insensitive filesystems",
    async () => {
      const { root, watchDir, outputDir } = await fixture();
      const lowerSource = path.join(root, "public", "asset.txt");
      const upperSource = path.join(root, "public", "ASSET.txt");
      await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
      await fs.outputFile(lowerSource, "asset\n");

      const first = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
      await first.init();
      await fs.rename(lowerSource, upperSource);

      const second = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
      await second.init();

      await expect(
        fs.readFile(path.join(outputDir, "public", "ASSET.txt"), "utf8"),
      ).resolves.toBe("asset\n");
      const manifest = await fs.readJson(
        path.join(outputDir, ".doccupine-artifacts.json"),
      );
      expect(manifest.publicFiles).toContain("ASSET.txt");
      expect(manifest.publicFiles).not.toContain("asset.txt");
    },
  );

  it.skipIf(process.platform === "win32")(
    "atomically replaces a symlinked public destination",
    async () => {
      const { root, watchDir, outputDir } = await fixture();
      const sourcePath = path.join(root, "public", "asset.txt");
      const destPath = path.join(outputDir, "public", "asset.txt");
      const externalTarget = path.join(root, "external-target.txt");
      await fs.outputFile(sourcePath, "new");
      await fs.outputFile(externalTarget, "keep");
      await fs.ensureDir(path.dirname(destPath));
      await fs.symlink(externalTarget, destPath, "file");
      const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);

      await generator.handlePublicFileChange(sourcePath);

      await expect(fs.readFile(destPath, "utf8")).resolves.toBe("new");
      await expect(fs.readFile(externalTarget, "utf8")).resolves.toBe("keep");
      expect((await fs.lstat(destPath)).isSymbolicLink()).toBe(false);
    },
  );

  it.skipIf(process.platform === "win32")(
    "rejects a source parent swapped before the source is opened",
    async () => {
      const { root, watchDir, outputDir } = await fixture();
      const publicDir = path.join(root, "public");
      const sourceParent = path.join(publicDir, "assets");
      const displacedParent = path.join(publicDir, "assets-original");
      const externalParent = path.join(root, "external-assets");
      const sourcePath = path.join(sourceParent, "asset.txt");
      await fs.outputFile(sourcePath, "safe");
      await fs.outputFile(path.join(externalParent, "asset.txt"), "secret");
      await fs.ensureDir(outputDir);
      const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
      const realpath = fs.realpath.bind(fs);
      let sourceResolutions = 0;
      vi.spyOn(fs, "realpath").mockImplementation(async (candidate: string) => {
        const resolved = await realpath(candidate);
        if (
          path.resolve(candidate) === sourcePath &&
          sourceResolutions++ === 0
        ) {
          await fs.rename(sourceParent, displacedParent);
          await fs.symlink(externalParent, sourceParent, "dir");
        }
        return resolved;
      });
      vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(
        generator.handlePublicFileChange(sourcePath),
      ).rejects.toThrow(/real path.*outside/i);
      await expect(
        fs.pathExists(path.join(outputDir, "public", "assets", "asset.txt")),
      ).resolves.toBe(false);
    },
  );

  it.skipIf(process.platform === "win32")(
    "keeps reading the opened source if its parent is swapped afterward",
    async () => {
      const { root, watchDir, outputDir } = await fixture();
      const publicDir = path.join(root, "public");
      const sourceParent = path.join(publicDir, "assets");
      const displacedParent = path.join(publicDir, "assets-original");
      const externalParent = path.join(root, "external-assets");
      const sourcePath = path.join(sourceParent, "asset.txt");
      const destPath = path.join(outputDir, "public", "assets", "asset.txt");
      await fs.outputFile(sourcePath, "safe");
      await fs.outputFile(path.join(externalParent, "asset.txt"), "secret");
      await fs.ensureDir(outputDir);
      const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
      const lstat = fs.lstat.bind(fs);
      let sourceStats = 0;
      vi.spyOn(fs, "lstat").mockImplementation(async (candidate: string) => {
        const stat = await lstat(candidate);
        if (path.resolve(candidate) === sourcePath && ++sourceStats === 4) {
          await fs.rename(sourceParent, displacedParent);
          await fs.symlink(externalParent, sourceParent, "dir");
        }
        return stat;
      });

      await generator.handlePublicFileChange(sourcePath);

      await expect(fs.readFile(destPath, "utf8")).resolves.toBe("safe");
      await expect(
        fs.readFile(path.join(externalParent, "asset.txt"), "utf8"),
      ).resolves.toBe("secret");
    },
  );

  it("restores mixed-case managed public overrides after watch deletion", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.outputFile(
      path.join(watchDir, "guide.mdx"),
      "---\ntitle: Guide\n---\nGUIDE_BODY\n",
    );
    await fs.writeJson(path.join(root, "config.json"), {
      name: "Test Docs",
      url: "https://docs.example.com",
    });
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    const artifacts = [
      ["LLMS.TXT", "llms.txt"],
      ["LLMS-FULL.TXT", "llms-full.txt"],
      ["SKILL.MD", "skill.md"],
      ["GUIDE.MD", "guide.md"],
      [
        path.join(".WELL-KNOWN", "MCP.JSON"),
        path.join(".well-known", "mcp.json"),
      ],
    ] as const;
    const generated = new Map<string, string>();
    for (const [, outputRelativePath] of artifacts) {
      generated.set(
        outputRelativePath,
        await fs.readFile(
          path.join(outputDir, "public", outputRelativePath),
          "utf8",
        ),
      );
    }

    for (const [sourceRelativePath, outputRelativePath] of artifacts) {
      const sourcePath = path.join(root, "public", sourceRelativePath);
      await fs.outputFile(sourcePath, `USER:${sourceRelativePath}\n`);
      await generator.handlePublicFileChange(sourcePath);
      expect(
        await fs.readFile(
          path.join(outputDir, "public", outputRelativePath),
          "utf8",
        ),
      ).toBe(`USER:${sourceRelativePath}\n`);
    }
    let manifest = await fs.readJson(
      path.join(outputDir, ".doccupine-artifacts.json"),
    );
    expect(manifest.llmsPageFiles).not.toContain("guide.md");

    for (const [sourceRelativePath, outputRelativePath] of artifacts) {
      const sourcePath = path.join(root, "public", sourceRelativePath);
      await fs.remove(sourcePath);
      await generator.handlePublicFileDelete(sourcePath);
      expect(
        await fs.readFile(
          path.join(outputDir, "public", outputRelativePath),
          "utf8",
        ),
      ).toBe(generated.get(outputRelativePath));
    }
    manifest = await fs.readJson(
      path.join(outputDir, ".doccupine-artifacts.json"),
    );
    expect(manifest.llmsPageFiles).toContain("guide.md");
  });

  it("restores generated public artifacts after watch-style overrides are deleted", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.outputFile(
      path.join(watchDir, "skill.mdx"),
      "---\ntitle: Skill Page\n---\nPAGE_SKILL_BODY\n",
    );
    await fs.outputFile(
      path.join(watchDir, "guide.mdx"),
      "---\ntitle: Guide\n---\nGUIDE_BODY\n",
    );
    const configPath = path.join(root, "config.json");
    await fs.writeJson(configPath, {
      name: "Test Docs",
      url: "https://docs.example.com",
    });
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();

    const relativePaths = [
      "llms.txt",
      "llms-full.txt",
      "skill.md",
      "guide.md",
      path.join(".well-known", "mcp.json"),
    ];
    const generated = new Map<string, string>();
    for (const relativePath of relativePaths) {
      generated.set(
        relativePath,
        await fs.readFile(path.join(outputDir, "public", relativePath), "utf8"),
      );
    }
    expect(generated.get("skill.md")).toContain("## Reading these docs");
    expect(generated.get("skill.md")).not.toContain("PAGE_SKILL_BODY");

    for (const relativePath of relativePaths) {
      const sourcePath = path.join(root, "public", relativePath);
      await fs.outputFile(sourcePath, `USER_OVERRIDE:${relativePath}\n`);
      await generator.handlePublicFileChange(sourcePath);
      expect(
        await fs.readFile(path.join(outputDir, "public", relativePath), "utf8"),
      ).toBe(`USER_OVERRIDE:${relativePath}\n`);
    }
    let manifest = await fs.readJson(
      path.join(outputDir, ".doccupine-artifacts.json"),
    );
    expect(manifest.llmsPageFiles).not.toContain("skill.md");
    expect(manifest.llmsPageFiles).not.toContain("guide.md");

    for (const relativePath of relativePaths) {
      const sourcePath = path.join(root, "public", relativePath);
      await fs.remove(sourcePath);
      await generator.handlePublicFileDelete(sourcePath);
      expect(
        await fs.readFile(path.join(outputDir, "public", relativePath), "utf8"),
      ).toBe(generated.get(relativePath));
    }

    manifest = await fs.readJson(
      path.join(outputDir, ".doccupine-artifacts.json"),
    );
    expect(manifest.llmsPageFiles).not.toContain("skill.md");
    expect(manifest.llmsPageFiles).toContain("guide.md");

    await fs.writeJson(configPath, { name: "Test Docs" });
    await generator.handleConfigFileChange(configPath);
    expect(
      await fs.pathExists(
        path.join(outputDir, "public", ".well-known", "mcp.json"),
      ),
    ).toBe(false);
  });

  it("does not overwrite or delete a colliding project public asset", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.outputFile(
      path.join(watchDir, "guide.mdx"),
      "---\ntitle: Guide\n---\nGenerated body\n",
    );
    await fs.outputFile(
      path.join(root, "public", "guide.md"),
      "USER_OWNED_PUBLIC_ASSET\n",
    );

    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    const publicAsset = path.join(outputDir, "public", "guide.md");
    expect(await fs.readFile(publicAsset, "utf8")).toBe(
      "USER_OWNED_PUBLIC_ASSET\n",
    );

    await fs.remove(path.join(watchDir, "guide.mdx"));
    await generator.handleFileDelete("guide.mdx");
    expect(await fs.readFile(publicAsset, "utf8")).toBe(
      "USER_OWNED_PUBLIC_ASSET\n",
    );
  });
});
