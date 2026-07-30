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
