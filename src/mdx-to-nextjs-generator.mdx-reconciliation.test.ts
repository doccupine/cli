import fs from "fs-extra";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import { MDXToNextJSGenerator } from "./mdx-to-nextjs-generator.js";

import { fixture } from "./test-utils/generator-fixture.js";

describe.sequential("MDXToNextJSGenerator MDX reconciliation", () => {
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

  it("rolls back section redirects when a later redirect fails", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.writeFile(path.join(watchDir, "index.mdx"), "# Home\n");
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    await fs.writeFile(
      path.join(watchDir, "alpha.mdx"),
      "---\ntitle: Alpha\nsection: Alpha\n---\nAlpha\n",
    );
    await fs.writeFile(
      path.join(watchDir, "beta.mdx"),
      "---\ntitle: Beta\nsection: Beta\n---\nBeta\n",
    );
    type GeneratorInternals = {
      writeSectionIndexRedirect(slug: string, target: string): Promise<void>;
      generatedRouteManager: { sectionIndexSlugs(): Set<string> };
    };
    const internals = generator as unknown as GeneratorInternals;
    const writeRedirect = internals.writeSectionIndexRedirect.bind(generator);
    let writes = 0;
    vi.spyOn(internals, "writeSectionIndexRedirect").mockImplementation(
      async (slug, target) => {
        writes += 1;
        if (writes === 2) throw new Error("Injected redirect failure");
        await writeRedirect(slug, target);
      },
    );

    await expect(generator.processAllMDXFiles()).rejects.toThrow(
      "Injected redirect failure",
    );

    expect(
      await fs.pathExists(
        path.join(outputDir, "app", "(site)", "alpha", "page.tsx"),
      ),
    ).toBe(false);
    expect(
      await fs.pathExists(
        path.join(outputDir, "app", "(site)", "beta", "page.tsx"),
      ),
    ).toBe(false);
    expect(internals.generatedRouteManager.sectionIndexSlugs()).toEqual(
      new Set(),
    );
  });

  it("restores section redirects when stale cleanup fails", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.writeFile(path.join(watchDir, "index.mdx"), "# Home\n");
    const alphaSource = path.join(watchDir, "alpha.mdx");
    const betaSource = path.join(watchDir, "beta.mdx");
    await fs.writeFile(
      alphaSource,
      "---\ntitle: Alpha\nsection: Alpha\n---\nAlpha\n",
    );
    await fs.writeFile(
      betaSource,
      "---\ntitle: Beta\nsection: Beta\n---\nBeta\n",
    );
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    const alphaRedirect = path.join(
      outputDir,
      "app",
      "(site)",
      "alpha",
      "page.tsx",
    );
    const betaRedirect = path.join(
      outputDir,
      "app",
      "(site)",
      "beta",
      "page.tsx",
    );
    const previousAlpha = await fs.readFile(alphaRedirect, "utf8");
    const previousBeta = await fs.readFile(betaRedirect, "utf8");
    await Promise.all([fs.remove(alphaSource), fs.remove(betaSource)]);
    type RouteManagerInternals = {
      removeSectionIndexPage(
        slug: string,
        removeEmptyDirs: (dir: string, stopDir: string) => Promise<void>,
      ): Promise<void>;
    };
    type GeneratorInternals = {
      generatedRouteManager: RouteManagerInternals;
    };
    const routeManager = (generator as unknown as GeneratorInternals)
      .generatedRouteManager;
    const removeSectionIndexPage =
      routeManager.removeSectionIndexPage.bind(routeManager);
    let cleanupCalls = 0;
    vi.spyOn(routeManager, "removeSectionIndexPage").mockImplementation(
      async (slug, removeEmptyDirs) => {
        cleanupCalls += 1;
        if (cleanupCalls === 2) {
          throw new Error("Injected stale redirect cleanup failure");
        }
        await removeSectionIndexPage(slug, removeEmptyDirs);
      },
    );

    await expect(generator.processAllMDXFiles()).rejects.toThrow(
      "Unable to remove stale section index redirects",
    );

    expect(cleanupCalls).toBeGreaterThanOrEqual(2);
    expect(await fs.readFile(alphaRedirect, "utf8")).toBe(previousAlpha);
    expect(await fs.readFile(betaRedirect, "utf8")).toBe(previousBeta);
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

  it("restores inferred sections when a changed page fails to render", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const sourcePath = path.join(watchDir, "guide.mdx");
    await fs.writeFile(
      sourcePath,
      "---\ntitle: Guide\nsection: Guides\n---\nOLD_BODY\n",
    );
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    const pagePath = path.join(
      outputDir,
      "app",
      "(site)",
      "guides",
      "guide",
      "page.tsx",
    );
    const previousPage = await fs.readFile(pagePath, "utf8");
    await fs.writeFile(
      sourcePath,
      "---\ntitle: Guide\nsection: Tutorials\nimage: &self [*self]\n---\nBROKEN_BODY\n",
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    await generator.handleFileChange("changed", "guide.mdx");

    expect(await fs.readFile(pagePath, "utf8")).toBe(previousPage);
    const layout = await fs.readFile(
      path.join(outputDir, "app", "(site)", "layout.tsx"),
      "utf8",
    );
    expect(layout).toContain('label: "Guides"');
    expect(layout).not.toContain('label: "Tutorials"');
  });

  it("keeps stale routes owned when replacement ownership cannot persist", async () => {
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
    await fs.writeJson(path.join(root, "sections.json"), [
      { label: "Guides", slug: "guides" },
      { label: "Tutorials", slug: "tutorials" },
    ]);
    await fs.writeFile(
      sourcePath,
      "---\ntitle: Guide\nsection: Guides\n---\nOriginal\n",
    );
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    type GeneratorInternals = {
      artifacts: {
        replaceRoutesAndSave(
          kind: string,
          routes: Iterable<{ source: string; slug: string }>,
        ): Promise<void>;
      };
    };
    const artifacts = (generator as unknown as GeneratorInternals).artifacts;
    vi.spyOn(artifacts, "replaceRoutesAndSave").mockRejectedValueOnce(
      new Error("Injected manifest failure"),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    await fs.writeFile(
      sourcePath,
      "---\ntitle: Guide\nsection: Tutorials\n---\nMoved\n",
    );

    await generator.handleFileChange("changed", "guide.mdx");

    expect(await fs.pathExists(previousPage)).toBe(true);
    expect(
      await fs.pathExists(
        path.join(outputDir, "app", "(site)", "tutorials", "guide", "page.tsx"),
      ),
    ).toBe(false);
    let manifest = await fs.readJson(
      path.join(outputDir, ".doccupine-artifacts.json"),
    );
    expect(manifest.routes).toContainEqual(
      expect.objectContaining({
        kind: "mdx",
        source: "guide.mdx",
        slug: "guides/guide",
      }),
    );

    await generator.handleFileChange("changed", "guide.mdx");
    expect(await fs.pathExists(previousPage)).toBe(false);
    manifest = await fs.readJson(
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

  it("retries stale route cleanup after a transient removal failure", async () => {
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
    await fs.writeJson(path.join(root, "sections.json"), [
      { label: "Guides", slug: "guides" },
      { label: "Tutorials", slug: "tutorials" },
    ]);
    await fs.writeFile(
      sourcePath,
      "---\ntitle: Guide\nsection: Guides\n---\nOriginal\n",
    );
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    type GeneratorInternals = {
      generatedRouteManager: { removeOwnedRoute(slug: string): Promise<void> };
    };
    const routeManager = (generator as unknown as GeneratorInternals)
      .generatedRouteManager;
    vi.spyOn(routeManager, "removeOwnedRoute").mockRejectedValueOnce(
      new Error("Injected cleanup failure"),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    await fs.writeFile(
      sourcePath,
      "---\ntitle: Guide\nsection: Tutorials\n---\nMoved\n",
    );

    await generator.handleFileChange("changed", "guide.mdx");

    expect(await fs.pathExists(previousPage)).toBe(true);
    let manifest = await fs.readJson(
      path.join(outputDir, ".doccupine-artifacts.json"),
    );
    expect(manifest.routes).toContainEqual(
      expect.objectContaining({
        kind: "mdx",
        source: "guide.mdx",
        slug: "tutorials/guide",
      }),
    );

    await generator.handleFileChange("changed", "guide.mdx");
    expect(await fs.pathExists(previousPage)).toBe(false);
    manifest = await fs.readJson(
      path.join(outputDir, ".doccupine-artifacts.json"),
    );
    expect(manifest.routes).not.toContainEqual(
      expect.objectContaining({ slug: "guides/guide" }),
    );
  });

  it("restores the previous page when its RSS route cannot be updated", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const sourcePath = path.join(watchDir, "guide.mdx");
    const pageDir = path.join(outputDir, "app", "(site)", "guide");
    const pagePath = path.join(pageDir, "page.tsx");
    await fs.writeFile(sourcePath, "---\ntitle: Guide\n---\nOriginal\n");
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    const originalPage = await fs.readFile(pagePath, "utf8");
    const externalRss = path.join(root, "external-rss");
    await fs.ensureDir(externalRss);
    await fs.writeFile(path.join(externalRss, "route.ts"), "KEEP\n");
    await fs.symlink(
      externalRss,
      path.join(pageDir, "rss.xml"),
      process.platform === "win32" ? "junction" : "dir",
    );
    await fs.writeFile(
      sourcePath,
      '---\ntitle: Guide\n---\nChanged\n<Update label="v2">Feed</Update>\n',
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    await generator.handleFileChange("changed", "guide.mdx");

    expect(await fs.readFile(pagePath, "utf8")).toBe(originalPage);
    expect(await fs.readFile(path.join(externalRss, "route.ts"), "utf8")).toBe(
      "KEEP\n",
    );
    const docsContent = await fs.readJson(
      path.join(outputDir, "services", "mcp", "docs-content.json"),
    );
    expect(docsContent).toContainEqual(
      expect.objectContaining({ uri: "docs://guide", content: "Original\n" }),
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

  it("rolls back MDX pages, ownership, sections, and aggregates together", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const sourcePath = path.join(watchDir, "guide.mdx");
    await fs.writeFile(
      sourcePath,
      "---\ntitle: Guide\nsection: Guides\n---\nOLD_BODY\n",
    );
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    const oldPagePath = path.join(
      outputDir,
      "app",
      "(site)",
      "guides",
      "guide",
      "page.tsx",
    );
    const newPagePath = path.join(
      outputDir,
      "app",
      "(site)",
      "tutorials",
      "guide",
      "page.tsx",
    );
    const previousPage = await fs.readFile(oldPagePath, "utf8");
    const previousLayout = await fs.readFile(
      path.join(outputDir, "app", "(site)", "layout.tsx"),
      "utf8",
    );
    const previousSitemap = await fs.readFile(
      path.join(outputDir, "app", "sitemap.ts"),
      "utf8",
    );
    const previousDocs = await fs.readFile(
      path.join(outputDir, "services", "mcp", "docs-content.json"),
      "utf8",
    );
    await fs.writeFile(
      sourcePath,
      "---\ntitle: Guide\nsection: Tutorials\n---\nNEW_BODY\n",
    );
    vi.spyOn(generator, "updateLlmsFiles").mockRejectedValueOnce(
      new Error("Injected aggregate failure"),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    await generator.handleFileChange("changed", "guide.mdx");

    expect(await fs.readFile(oldPagePath, "utf8")).toBe(previousPage);
    expect(await fs.pathExists(newPagePath)).toBe(false);
    expect(
      await fs.readFile(
        path.join(outputDir, "app", "(site)", "layout.tsx"),
        "utf8",
      ),
    ).toBe(previousLayout);
    expect(
      await fs.readFile(path.join(outputDir, "app", "sitemap.ts"), "utf8"),
    ).toBe(previousSitemap);
    expect(
      await fs.readFile(
        path.join(outputDir, "services", "mcp", "docs-content.json"),
        "utf8",
      ),
    ).toBe(previousDocs);
    const manifest = await fs.readJson(
      path.join(outputDir, ".doccupine-artifacts.json"),
    );
    expect(manifest.routes).toContainEqual(
      expect.objectContaining({ source: "guide.mdx", slug: "guides/guide" }),
    );
  });

  it("keeps a rolled-back deletion in later aggregate refreshes", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const sourcePath = path.join(watchDir, "index.mdx");
    const pagePath = path.join(outputDir, "app", "(site)", "page.tsx");
    await fs.writeFile(
      sourcePath,
      "---\ntitle: Retained Home\n---\nRETAINED_BODY\n",
    );
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    const previousPage = await fs.readFile(pagePath, "utf8");
    const sitemapPath = path.join(outputDir, "app", "sitemap.ts");
    const previousSitemap = await fs.readFile(sitemapPath, "utf8");
    await fs.remove(sourcePath);
    vi.spyOn(generator, "updateLlmsFiles").mockRejectedValueOnce(
      new Error("Injected aggregate failure"),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    await generator.handleFileDelete("index.mdx");
    type GeneratorInternals = {
      refreshSiteAggregates(): Promise<void>;
    };
    await (generator as unknown as GeneratorInternals).refreshSiteAggregates();

    expect(await fs.readFile(pagePath, "utf8")).toBe(previousPage);
    expect(await fs.readFile(sitemapPath, "utf8")).toBe(previousSitemap);
    expect(
      await fs.readFile(
        path.join(outputDir, "app", "(site)", "layout.tsx"),
        "utf8",
      ),
    ).toContain("Retained Home");
    const docsContent = await fs.readJson(
      path.join(outputDir, "services", "mcp", "docs-content.json"),
    );
    expect(docsContent).toContainEqual(
      expect.objectContaining({
        uri: "docs:///",
        content: "RETAINED_BODY\n",
      }),
    );
  });
});
