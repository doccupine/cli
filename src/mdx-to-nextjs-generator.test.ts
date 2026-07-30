import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

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

    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [
      { name: "Test", file: specPath },
    ]);
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
