import fs from "fs-extra";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import { SecureSourceFs } from "./generator/secure-source-fs.js";
import { MDXToNextJSGenerator } from "./mdx-to-nextjs-generator.js";

import { fixture } from "./test-utils/generator-fixture.js";

describe.sequential("MDXToNextJSGenerator source safety", () => {
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
});
