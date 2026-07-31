import fs from "fs-extra";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import { SecureSourceFs } from "./generator/secure-source-fs.js";
import { MDXToNextJSGenerator } from "./mdx-to-nextjs-generator.js";

import { fixture } from "./test-utils/generator-fixture.js";

describe.sequential("MDXToNextJSGenerator MDX route recovery", () => {
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

  it("does not commit inferred sections from a colliding pass", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const sourcePath = path.join(watchDir, "guide.mdx");
    const collidingPath = path.join(watchDir, "tutorials", "guide.mdx");
    await fs.writeFile(
      sourcePath,
      "---\ntitle: Guide\nsection: Guides\n---\nGUIDE_BODY\n",
    );
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    type GeneratorInternals = {
      sectionsConfig: Array<{ label: string; slug: string }> | null;
    };
    const internals = generator as unknown as GeneratorInternals;
    await fs.writeFile(
      sourcePath,
      "---\ntitle: Guide\nsection: Tutorials\n---\nMOVED_BODY\n",
    );
    await fs.outputFile(
      collidingPath,
      "---\ntitle: Collision\nsection: Tutorials\n---\nCOLLISION_BODY\n",
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    await generator.handleFileChange("changed", "guide.mdx");

    expect(internals.sectionsConfig).toEqual([
      { label: "Guides", slug: "guides" },
    ]);
    expect(
      await fs.readFile(
        path.join(outputDir, "app", "(site)", "layout.tsx"),
        "utf8",
      ),
    ).toContain('label: "Guides"');

    await fs.remove(collidingPath);
    await generator.handleFileDelete("tutorials/guide.mdx");
    expect(internals.sectionsConfig).toEqual([
      { label: "Tutorials", slug: "tutorials" },
    ]);
  });

  it("generates a blocked collision source when its owner moves routes", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const movingSource = path.join(watchDir, "guide.mdx");
    const blockedSource = path.join(watchDir, "guide", "index.mdx");
    await fs.writeJson(path.join(root, "sections.json"), [
      { label: "Docs", slug: "" },
      { label: "Tutorials", slug: "tutorials" },
    ]);
    await fs.writeFile(
      movingSource,
      "---\ntitle: Original\n---\nORIGINAL_BODY\n",
    );
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    await fs.outputFile(
      blockedSource,
      "---\ntitle: Replacement\n---\nREPLACEMENT_BODY\n",
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    await generator.handleFileChange("added", "guide/index.mdx");
    await fs.writeFile(
      movingSource,
      "---\ntitle: Moved\nsection: Tutorials\n---\nMOVED_BODY\n",
    );

    await generator.handleFileChange("changed", "guide.mdx");

    expect(
      await fs.readFile(
        path.join(outputDir, "app", "(site)", "guide", "page.tsx"),
        "utf8",
      ),
    ).toContain("REPLACEMENT_BODY");
    expect(
      await fs.readFile(
        path.join(outputDir, "app", "(site)", "tutorials", "guide", "page.tsx"),
        "utf8",
      ),
    ).toContain("MOVED_BODY");
    const manifest = await fs.readJson(
      path.join(outputDir, ".doccupine-artifacts.json"),
    );
    expect(manifest.routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "mdx",
          source: "guide/index.mdx",
          slug: "guide",
        }),
        expect.objectContaining({
          kind: "mdx",
          source: "guide.mdx",
          slug: "tutorials/guide",
        }),
      ]),
    );
  });

  it("replays unrelated MDX changes after a route collision clears", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const movingSource = path.join(watchDir, "guide.mdx");
    const collidingSource = path.join(watchDir, "guide", "index.mdx");
    const unrelatedSource = path.join(watchDir, "other.mdx");
    await fs.writeJson(path.join(root, "sections.json"), [
      { label: "Docs", slug: "" },
      { label: "Tutorials", slug: "tutorials" },
    ]);
    await fs.writeFile(movingSource, "---\ntitle: Guide\n---\nGuide\n");
    await fs.writeFile(unrelatedSource, "---\ntitle: Other\n---\nOLD_OTHER\n");
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    await fs.outputFile(
      collidingSource,
      "---\ntitle: Replacement\n---\nReplacement\n",
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    await generator.handleFileChange("added", "guide/index.mdx");
    await fs.writeFile(unrelatedSource, "---\ntitle: Other\n---\nNEW_OTHER\n");
    await generator.handleFileChange("changed", "other.mdx");
    await fs.writeFile(
      movingSource,
      "---\ntitle: Guide\nsection: Tutorials\n---\nMoved\n",
    );

    await generator.handleFileChange("changed", "guide.mdx");

    expect(
      await fs.readFile(
        path.join(outputDir, "app", "(site)", "other", "page.tsx"),
        "utf8",
      ),
    ).toContain("NEW_OTHER");
    const docsContent = await fs.readJson(
      path.join(outputDir, "services", "mcp", "docs-content.json"),
    );
    expect(docsContent).toContainEqual(
      expect.objectContaining({ uri: "docs://other", content: "NEW_OTHER\n" }),
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

  it("uses one captured source version for metadata and rendering", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const sourcePath = path.join(watchDir, "guide.mdx");
    await fs.writeJson(path.join(root, "sections.json"), [
      { label: "Guides", slug: "guides" },
      { label: "Tutorials", slug: "tutorials" },
    ]);
    await fs.writeFile(
      sourcePath,
      "---\ntitle: Initial\nsection: Guides\n---\nInitial\n",
    );
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    type GeneratorInternals = { sourceFs: SecureSourceFs };
    const sourceFs = (generator as unknown as GeneratorInternals).sourceFs;
    const readSource = sourceFs.readMdxSourceFile.bind(sourceFs);
    let guideReads = 0;
    const readSpy = vi
      .spyOn(sourceFs, "readMdxSourceFile")
      .mockImplementation(async (filePath) => {
        const captured = await readSource(filePath);
        if (filePath.replace(/\\/g, "/").endsWith("guide.mdx")) {
          guideReads += 1;
          if (guideReads === 1) {
            await fs.writeFile(
              sourcePath,
              "---\ntitle: Later\nsection: Tutorials\n---\nLATER_BODY\n",
            );
          }
        }
        return captured;
      });
    await fs.writeFile(
      sourcePath,
      "---\ntitle: Captured\nsection: Guides\n---\nCAPTURED_BODY\n",
    );

    await generator.handleFileChange("changed", "guide.mdx");

    expect(guideReads).toBe(1);
    expect(
      await fs.readFile(
        path.join(outputDir, "app", "(site)", "guides", "guide", "page.tsx"),
        "utf8",
      ),
    ).toContain("CAPTURED_BODY");
    const manifest = await fs.readJson(
      path.join(outputDir, ".doccupine-artifacts.json"),
    );
    expect(manifest.routes).toContainEqual(
      expect.objectContaining({ source: "guide.mdx", slug: "guides/guide" }),
    );

    readSpy.mockRestore();
    await generator.handleFileChange("changed", "guide.mdx");
    expect(
      await fs.readFile(
        path.join(outputDir, "app", "(site)", "tutorials", "guide", "page.tsx"),
        "utf8",
      ),
    ).toContain("LATER_BODY");
  });

  it("keeps the successful MDX state when delete snapshot capture fails", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const sourcePath = path.join(watchDir, "guide.mdx");
    await fs.writeFile(sourcePath, "---\ntitle: Guide\n---\nLAST_GOOD_BODY\n");
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    type GeneratorInternals = {
      mdxReconciliationCoordinator: {
        mdxPassBuilder: { capture(): Promise<unknown> };
        successfulPages(): Array<{ path: string }>;
        readAggregateMdxSource(filePath: string): Promise<{ content: string }>;
      };
    };
    const coordinator = (generator as unknown as GeneratorInternals)
      .mdxReconciliationCoordinator;
    vi.spyOn(coordinator.mdxPassBuilder, "capture").mockRejectedValueOnce(
      new Error("Injected snapshot failure"),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    await fs.remove(sourcePath);

    await generator.handleFileDelete("guide.mdx");

    expect(coordinator.successfulPages()).toContainEqual(
      expect.objectContaining({ path: "guide.mdx" }),
    );
    expect(
      (await coordinator.readAggregateMdxSource("guide.mdx")).content,
    ).toContain("LAST_GOOD_BODY");
    expect(
      await fs.readFile(
        path.join(outputDir, "app", "(site)", "guide", "page.tsx"),
        "utf8",
      ),
    ).toContain("LAST_GOOD_BODY");
  });

  it("keeps the active sections when a changed source disappears from its snapshot", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.writeFile(
      path.join(watchDir, "guide.mdx"),
      "---\ntitle: Guide\nsection: Guides\n---\nGUIDE_BODY\n",
    );
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    type GeneratorInternals = {
      mdxReconciliationCoordinator: {
        mdxPassBuilder: { capture(): Promise<unknown> };
      };
      sectionsConfig: Array<{ label: string; slug: string }> | null;
    };
    const internals = generator as unknown as GeneratorInternals;
    const previousSections = internals.sectionsConfig;
    vi.spyOn(
      internals.mdxReconciliationCoordinator.mdxPassBuilder,
      "capture",
    ).mockResolvedValueOnce({
      files: [],
      pages: [],
      sources: new Map(),
      sections: [{ label: "Candidate", slug: "candidate" }],
    });
    vi.spyOn(console, "error").mockImplementation(() => {});

    await generator.handleFileChange("changed", "guide.mdx");

    expect(internals.sectionsConfig).toEqual(previousSections);
  });

  it("refreshes inferred sections before validating changed routes", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const movingSource = path.join(watchDir, "nested.mdx");
    await fs.writeFile(
      movingSource,
      "---\ntitle: Moving\nsection: Guides\n---\nOLD_BODY\n",
    );
    await fs.outputFile(
      path.join(watchDir, "nested", "index.mdx"),
      "---\ntitle: Nested\n---\nNESTED_BODY\n",
    );
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    await fs.writeFile(
      movingSource,
      "---\ntitle: Moving\nsection: Tutorials\n---\nNEW_BODY\n",
    );

    await generator.handleFileChange("changed", "nested.mdx");

    expect(
      await fs.readFile(
        path.join(
          outputDir,
          "app",
          "(site)",
          "tutorials",
          "nested",
          "page.tsx",
        ),
        "utf8",
      ),
    ).toContain("NEW_BODY");
    expect(
      await fs.readFile(
        path.join(outputDir, "app", "(site)", "nested", "page.tsx"),
        "utf8",
      ),
    ).toContain("NESTED_BODY");
  });
});
