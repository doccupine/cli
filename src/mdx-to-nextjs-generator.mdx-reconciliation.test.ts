import fs from "fs-extra";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import { SecureSourceFs } from "./generator/secure-source-fs.js";
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
