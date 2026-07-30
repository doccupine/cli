import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

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
