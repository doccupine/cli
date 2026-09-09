import fs from "fs-extra";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import { MDXToNextJSGenerator } from "./mdx-to-nextjs-generator.js";
import { VariantCollisionError } from "./lib/variants.js";

import { fixture } from "./test-utils/generator-fixture.js";

const LANGUAGES = [
  { code: "en", label: "English", default: true },
  { code: "de", label: "Deutsch" },
];

const VERSIONS = [
  { label: "v2.0", default: true },
  { slug: "v1", label: "v1.0" },
];

function page(title: string, body: string, extra = ""): string {
  return `---\ntitle: ${title}\n${extra}---\n${body}\n`;
}

async function readOutput(outputDir: string, ...segments: string[]) {
  return fs.readFile(path.join(outputDir, ...segments), "utf8");
}

async function siteLayout(outputDir: string) {
  return readOutput(outputDir, "app", "(site)", "layout.tsx");
}

describe("MDXToNextJSGenerator languages and versions", () => {
  it("emits nothing variant-related for a site without the config files", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.outputFile(path.join(watchDir, "index.mdx"), page("Home", "HOME"));
    await fs.outputFile(
      path.join(watchDir, "de", "guide.mdx"),
      page("Guide", "UNDECLARED_FOLDER"),
    );
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);

    await generator.init();

    const layout = await siteLayout(outputDir);
    expect(layout).not.toContain("locale:");
    expect(layout).not.toContain("version:");
    expect(layout).not.toContain("doccupineVariantSections");
    expect(layout).not.toContain("switchers=");
    expect(layout).not.toContain("VariantSwitchers");
    const rootLayout = await readOutput(outputDir, "app", "layout.tsx");
    expect(rootLayout).toContain('<html lang="en"');
    expect(rootLayout).not.toContain("r.lang=");
    expect(await readOutput(outputDir, "languages.json")).toBe("[]\n");
    expect(await readOutput(outputDir, "versions.json")).toBe("[]\n");
    // An undeclared folder is an ordinary docs folder.
    expect(
      await readOutput(outputDir, "app", "(site)", "de", "guide", "page.tsx"),
    ).toContain("UNDECLARED_FOLDER");

    const docsContent = JSON.parse(
      await readOutput(outputDir, "services", "mcp", "docs-content.json"),
    ) as Record<string, unknown>[];
    for (const entry of docsContent) {
      expect(Object.keys(entry)).toEqual(["uri", "name", "path", "content"]);
    }
    const manifest = JSON.parse(
      await readOutput(outputDir, ".doccupine-artifacts.json"),
    ) as Record<string, unknown>;
    expect(Object.keys(manifest)).toEqual([
      "schemaVersion",
      "routes",
      "llmsPageFiles",
      "publicFiles",
      "iconFiles",
    ]);
    const sitemap = await readOutput(outputDir, "app", "sitemap.ts");
    expect(sitemap).not.toContain("alternates");
  });

  it("treats empty config arrays like missing files", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.outputFile(path.join(watchDir, "index.mdx"), page("Home", "HOME"));
    await fs.writeJson(path.join(root, "languages.json"), []);
    await fs.writeJson(path.join(root, "versions.json"), []);
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);

    await generator.init();

    expect(await siteLayout(outputDir)).not.toContain("locale:");
    expect(await readOutput(outputDir, "app", "layout.tsx")).not.toContain(
      "r.lang=",
    );
  });

  it("routes a language folder to its URL prefix and tags every page", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.writeJson(path.join(root, "languages.json"), LANGUAGES);
    await fs.outputFile(path.join(watchDir, "index.mdx"), page("Home", "HOME"));
    await fs.outputFile(
      path.join(watchDir, "guide.mdx"),
      page("Guide", "EN_GUIDE"),
    );
    await fs.outputFile(
      path.join(watchDir, "de", "guide.mdx"),
      page("Anleitung", "DE_GUIDE"),
    );
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);

    await generator.init();

    expect(
      await readOutput(outputDir, "app", "(site)", "de", "guide", "page.tsx"),
    ).toContain("DE_GUIDE");
    const layout = await siteLayout(outputDir);
    expect(layout).toContain('slug: "de/guide",');
    expect(layout).toContain('locale: "de",');
    expect(layout).toContain('locale: "en",');
    expect(layout).not.toContain("version:");
    // The switchers render in the sidebar footer, so the layout only has to
    // hand SectionNavProvider the full page list they navigate through.
    expect(layout).not.toContain("switchers=");
    expect(layout).not.toContain("VariantSwitchers");
    expect(layout).toContain("allPages={pages}");
    // No sections: the sidebar still goes through SectionNavProvider so it
    // is scoped per language, without a section bar.
    expect(layout).toContain("hasSectionBar={false}");
    expect(layout).not.toContain("<SectionBar");

    const manifest = JSON.parse(
      await readOutput(outputDir, ".doccupine-artifacts.json"),
    ) as { routes: { source: string; slug: string }[] };
    expect(manifest.routes).toContainEqual({
      kind: "mdx",
      source: "de/guide.mdx",
      slug: "de/guide",
    });
    const docsContent = JSON.parse(
      await readOutput(outputDir, "services", "mcp", "docs-content.json"),
    ) as { uri: string; locale?: string; version?: string }[];
    expect(docsContent.find((d) => d.uri === "docs://de/guide")).toMatchObject({
      locale: "de",
    });
    expect(docsContent.find((d) => d.uri === "docs://guide")).toMatchObject({
      locale: "en",
    });
    expect(docsContent.every((d) => d.version === undefined)).toBe(true);

    const rootLayout = await readOutput(outputDir, "app", "layout.tsx");
    expect(rootLayout).toContain('<html lang="en"');
    expect(rootLayout).toContain(
      'var p=location.pathname.split("/")[1];r.lang=["de"].indexOf(p)>=0?p:"en";',
    );
  });

  it("keeps a section index inside a language from overwriting the default one", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.writeJson(path.join(root, "languages.json"), LANGUAGES);
    await fs.writeJson(path.join(root, "sections.json"), [
      { label: "Docs", slug: "" },
      { label: "API", slug: "api" },
    ]);
    await fs.outputFile(path.join(watchDir, "index.mdx"), page("Home", "HOME"));
    await fs.outputFile(
      path.join(watchDir, "api", "index.mdx"),
      page("API", "EN_API_INDEX"),
    );
    await fs.outputFile(
      path.join(watchDir, "api", "users.mdx"),
      page("Users", "EN_USERS"),
    );
    await fs.outputFile(
      path.join(watchDir, "de", "api", "index.mdx"),
      page("API", "DE_API_INDEX"),
    );
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);

    await generator.init();

    expect(
      await readOutput(outputDir, "app", "(site)", "api", "page.tsx"),
    ).toContain("EN_API_INDEX");
    const dePage = await readOutput(
      outputDir,
      "app",
      "(site)",
      "de",
      "api",
      "page.tsx",
    );
    expect(dePage).toContain("DE_API_INDEX");
    expect(dePage).toContain('canonical: "/de/api"');
    const layout = await siteLayout(outputDir);
    expect(layout).toContain('slug: "de/api",');
    expect(layout).toContain('section: "api",');
    expect(layout).toContain("const doccupineVariantSections");
    expect(layout).toContain('"": ["", "api"],');
    expect(layout).toContain('de: ["api"],');
  });

  it("applies a section directory relative to the variant root", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.writeJson(path.join(root, "languages.json"), LANGUAGES);
    await fs.writeJson(path.join(root, "sections.json"), [
      { label: "Docs", slug: "" },
      { label: "API", slug: "api", directory: "reference" },
    ]);
    await fs.outputFile(path.join(watchDir, "index.mdx"), page("Home", "HOME"));
    await fs.outputFile(
      path.join(watchDir, "de", "reference", "users.mdx"),
      page("Benutzer", "DE_USERS"),
    );
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);

    await generator.init();

    expect(
      await readOutput(
        outputDir,
        "app",
        "(site)",
        "de",
        "api",
        "users",
        "page.tsx",
      ),
    ).toContain("DE_USERS");
  });

  it("redirects a variant home and its section indexes unless a real page exists", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.writeJson(path.join(root, "languages.json"), LANGUAGES);
    await fs.writeJson(path.join(root, "sections.json"), [
      { label: "Docs", slug: "" },
      { label: "API", slug: "api" },
    ]);
    await fs.outputFile(path.join(watchDir, "index.mdx"), page("Home", "HOME"));
    await fs.outputFile(
      path.join(watchDir, "de", "api", "users.mdx"),
      page("Benutzer", "DE_USERS"),
    );
    await fs.outputFile(
      path.join(watchDir, "de", "guide.mdx"),
      page("Anleitung", "DE_GUIDE", "order: 1\n"),
    );
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);

    await generator.init();

    const home = await readOutput(outputDir, "app", "(site)", "de", "page.tsx");
    expect(home).toContain('redirect("/de/guide")');
    expect(
      await readOutput(outputDir, "app", "(site)", "de", "api", "page.tsx"),
    ).toContain('redirect("/de/api/users")');

    await fs.outputFile(
      path.join(watchDir, "de", "index.mdx"),
      page("Start", "DE_HOME"),
    );
    await generator.handleFileChange("added", path.join("de", "index.mdx"));

    const realHome = await readOutput(
      outputDir,
      "app",
      "(site)",
      "de",
      "page.tsx",
    );
    expect(realHome).toContain("DE_HOME");
    expect(realHome).not.toContain("redirect(");
  });

  it("aborts on a language code that collides with a section or a bad layout", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.writeJson(path.join(root, "languages.json"), LANGUAGES);
    await fs.writeJson(path.join(root, "sections.json"), [
      { label: "Docs", slug: "" },
      { label: "Deutsch", slug: "de" },
    ]);
    await fs.outputFile(path.join(watchDir, "index.mdx"), page("Home", "HOME"));
    await expect(
      new MDXToNextJSGenerator(watchDir, outputDir, [], root).init(),
    ).rejects.toBeInstanceOf(VariantCollisionError);

    await fs.remove(path.join(root, "sections.json"));
    await fs.outputFile(
      path.join(watchDir, "en", "guide.mdx"),
      page("Guide", "MISPLACED"),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      new MDXToNextJSGenerator(watchDir, outputDir, [], root).init(),
    ).rejects.toThrow(
      '"en" is the default language and lives at the docs root',
    );

    await fs.remove(path.join(watchDir, "en"));
    await fs.writeJson(path.join(root, "versions.json"), VERSIONS);
    await fs.outputFile(
      path.join(watchDir, "v1", "de", "guide.mdx"),
      page("Guide", "WRONG_ORDER"),
    );
    await expect(
      new MDXToNextJSGenerator(watchDir, outputDir, [], root).init(),
    ).rejects.toThrow('expected "de/v1/..."');
  });

  it("rejects an invalid languages.json instead of publishing unscoped pages", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.writeJson(path.join(root, "languages.json"), [
      { code: "en", label: "English" },
    ]);
    await fs.outputFile(path.join(watchDir, "index.mdx"), page("Home", "HOME"));
    await expect(
      new MDXToNextJSGenerator(watchDir, outputDir, [], root).init(),
    ).rejects.toThrow('exactly one entry with "default": true');
  });

  it("removes a language's routes, mirrors, and aggregates when it goes away", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const languagesPath = path.join(root, "languages.json");
    await fs.writeJson(languagesPath, LANGUAGES);
    await fs.outputFile(path.join(watchDir, "index.mdx"), page("Home", "HOME"));
    await fs.outputFile(
      path.join(watchDir, "de", "guide.mdx"),
      page("Anleitung", "DE_GUIDE"),
    );
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    expect(
      await fs.pathExists(path.join(outputDir, "public", "de", "llms.txt")),
    ).toBe(true);
    expect(
      await fs.pathExists(
        path.join(outputDir, "app", "(site)", "de", "page.tsx"),
      ),
    ).toBe(true);

    await fs.remove(path.join(watchDir, "de"));
    await generator.handleFileDelete(path.join("de", "guide.mdx"));

    expect(
      await fs.pathExists(path.join(outputDir, "app", "(site)", "de")),
    ).toBe(false);
    expect(
      await fs.pathExists(path.join(outputDir, "public", "de", "guide.md")),
    ).toBe(false);
    // The language is still declared, so its (empty) index stays.
    expect(
      await fs.pathExists(path.join(outputDir, "public", "de", "llms.txt")),
    ).toBe(true);

    await fs.remove(languagesPath);
    await generator.handleConfigFileDelete(languagesPath);

    expect(await fs.pathExists(path.join(outputDir, "public", "de"))).toBe(
      false,
    );
    const manifest = JSON.parse(
      await readOutput(outputDir, ".doccupine-artifacts.json"),
    ) as Record<string, unknown>;
    expect(manifest.llmsVariantFiles).toBeUndefined();
    expect(await readOutput(outputDir, "languages.json")).toBe("[]\n");
    expect(await siteLayout(outputDir)).not.toContain("locale:");
  });

  it("writes RSS feeds and hreflang alternates for translated pages", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.writeJson(path.join(root, "languages.json"), LANGUAGES);
    await fs.writeJson(path.join(root, "config.json"), {
      url: "https://docs.example.com",
    });
    await fs.outputFile(path.join(watchDir, "index.mdx"), page("Home", "HOME"));
    const changelog = (label: string) =>
      page(
        "Changelog",
        `<Update label="${label}" description="First">\nInitial\n</Update>`,
        "rss: true\n",
      );
    await fs.outputFile(path.join(watchDir, "changelog.mdx"), changelog("1.0"));
    await fs.outputFile(
      path.join(watchDir, "de", "changelog.mdx"),
      changelog("1.0 (de)"),
    );
    await fs.outputFile(
      path.join(watchDir, "only-en.mdx"),
      page("Only English", "ONLY_EN"),
    );
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);

    await generator.init();

    expect(
      await fs.pathExists(
        path.join(
          outputDir,
          "app",
          "(site)",
          "de",
          "changelog",
          "rss.xml",
          "route.ts",
        ),
      ),
    ).toBe(true);
    const dePage = await readOutput(
      outputDir,
      "app",
      "(site)",
      "de",
      "changelog",
      "page.tsx",
    );
    expect(dePage).toContain('"/de/changelog/rss.xml"');

    const sitemap = await readOutput(outputDir, "app", "sitemap.ts");
    expect(sitemap).toContain("alternates?: Record<string, string>;");
    expect(sitemap).toContain(
      'alternates: {\n      en: "changelog",\n      de: "de/changelog",\n      "x-default": "changelog",\n    },',
    );
    expect(sitemap).toContain("languageAlternates(base, entry.alternates)");
    const onlyEnEntry = sitemap.slice(sitemap.indexOf('slug: "only-en"'));
    expect(onlyEnEntry.slice(0, onlyEnEntry.indexOf("}"))).not.toContain(
      "alternates",
    );
  });

  it("marks translated content with its language and re-renders siblings on change", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.writeJson(path.join(root, "languages.json"), LANGUAGES);
    await fs.writeJson(path.join(root, "sections.json"), [
      { label: "Docs", slug: "" },
      { label: "API", slug: "api" },
    ]);
    await fs.outputFile(path.join(watchDir, "index.mdx"), page("Home", "HOME"));
    await fs.outputFile(
      path.join(watchDir, "guide.mdx"),
      page("Guide", "EN_GUIDE"),
    );
    await fs.outputFile(
      path.join(watchDir, "api", "index.mdx"),
      page("API", "EN_API"),
    );
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();

    const enGuidePath = path.join(
      outputDir,
      "app",
      "(site)",
      "guide",
      "page.tsx",
    );
    const enGuide = await fs.readFile(enGuidePath, "utf8");
    expect(enGuide).toContain('lang="en"');
    expect(enGuide).toContain('locale: "en",');
    expect(enGuide).not.toContain("languages:");
    const home = await readOutput(outputDir, "app", "(site)", "page.tsx");
    expect(home).toContain('sourcePath="index.mdx" lang="en"');
    expect(home).not.toContain("languages:");
    expect(
      await readOutput(outputDir, "app", "(site)", "api", "page.tsx"),
    ).toContain('lang="en"');

    // Adding the German guide changes the English guide's hreflang set, so
    // the watcher re-renders the English page too.
    await fs.outputFile(
      path.join(watchDir, "de", "guide.mdx"),
      page("Anleitung", "DE_GUIDE"),
    );
    await generator.handleFileChange("added", path.join("de", "guide.mdx"));

    const deGuide = await readOutput(
      outputDir,
      "app",
      "(site)",
      "de",
      "guide",
      "page.tsx",
    );
    expect(deGuide).toContain('lang="de"');
    expect(deGuide).toContain('locale: "de",');
    expect(deGuide).toContain(
      'languages: { en: "/guide", de: "/de/guide", "x-default": "/guide" },',
    );
    expect(await fs.readFile(enGuidePath, "utf8")).toContain(
      'languages: { en: "/guide", de: "/de/guide", "x-default": "/guide" },',
    );

    await fs.outputFile(
      path.join(watchDir, "de", "index.mdx"),
      page("Start", "DE_HOME"),
    );
    await generator.handleFileChange("added", path.join("de", "index.mdx"));
    expect(await readOutput(outputDir, "app", "(site)", "page.tsx")).toContain(
      'languages: { en: "/", de: "/de", "x-default": "/" },',
    );

    await fs.remove(path.join(watchDir, "de", "guide.mdx"));
    await generator.handleFileDelete(path.join("de", "guide.mdx"));
    expect(await fs.readFile(enGuidePath, "utf8")).not.toContain("languages:");
  });

  it("publishes versions under their prefix, per language, with their own llms files", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.writeJson(path.join(root, "languages.json"), LANGUAGES);
    await fs.writeJson(path.join(root, "versions.json"), VERSIONS);
    await fs.writeJson(path.join(root, "config.json"), {
      url: "https://docs.example.com",
    });
    await fs.outputFile(path.join(watchDir, "index.mdx"), page("Home", "HOME"));
    await fs.outputFile(
      path.join(watchDir, "guide.mdx"),
      page("Guide", "EN_LATEST"),
    );
    await fs.outputFile(
      path.join(watchDir, "v1", "guide.mdx"),
      page("Guide", "EN_V1"),
    );
    await fs.outputFile(
      path.join(watchDir, "de", "v1", "guide.mdx"),
      page("Anleitung", "DE_V1"),
    );
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);

    await generator.init();

    expect(
      await readOutput(outputDir, "app", "(site)", "v1", "guide", "page.tsx"),
    ).toContain("EN_V1");
    expect(
      await readOutput(
        outputDir,
        "app",
        "(site)",
        "de",
        "v1",
        "guide",
        "page.tsx",
      ),
    ).toContain("DE_V1");
    expect(
      await readOutput(outputDir, "app", "(site)", "v1", "page.tsx"),
    ).toContain('redirect("/v1/guide")');
    const layout = await siteLayout(outputDir);
    expect(layout).toContain('slug: "v1/guide",');
    expect(layout).toContain('version: "v1",');
    expect(layout).toContain('version: "",');

    const rootIndex = await readOutput(outputDir, "public", "llms.txt");
    expect(rootIndex).toContain("## Other languages and versions");
    expect(rootIndex).toContain(
      "- [English (v1.0)](https://docs.example.com/v1/llms.txt)",
    );
    expect(rootIndex).toContain(
      "- [Deutsch (v1.0)](https://docs.example.com/de/v1/llms.txt)",
    );
    expect(rootIndex).not.toContain("EN_V1");
    const v1Index = await readOutput(outputDir, "public", "v1", "llms.txt");
    expect(v1Index).toContain(
      "Full corpus in one file: https://docs.example.com/v1/llms-full.txt",
    );
    expect(v1Index).toContain("https://docs.example.com/v1/guide.md");
    expect(v1Index).not.toContain("https://docs.example.com/guide.md");
    expect(
      await readOutput(outputDir, "public", "de", "v1", "llms-full.txt"),
    ).toContain("DE_V1");
    const skill = await readOutput(outputDir, "public", "skill.md");
    expect(skill).not.toContain("v1/guide");

    const docsContent = JSON.parse(
      await readOutput(outputDir, "services", "mcp", "docs-content.json"),
    ) as { uri: string; locale?: string; version?: string }[];
    expect(
      docsContent.find((d) => d.uri === "docs://de/v1/guide"),
    ).toMatchObject({ locale: "de", version: "v1" });
    expect(docsContent.find((d) => d.uri === "docs://guide")).toMatchObject({
      locale: "en",
      version: "",
    });
  });

  it("refuses a version slug that collides with a language code", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.writeJson(path.join(root, "languages.json"), LANGUAGES);
    await fs.writeJson(path.join(root, "versions.json"), [
      { label: "Latest", default: true },
      { slug: "de", label: "Deutsch?" },
    ]);
    await fs.outputFile(path.join(watchDir, "index.mdx"), page("Home", "HOME"));

    await expect(
      new MDXToNextJSGenerator(watchDir, outputDir, [], root).init(),
    ).rejects.toThrow('versions.json: version slug "de" collides with');
  });

  it("uses the default language for the html lang attribute", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.writeJson(path.join(root, "languages.json"), [
      { code: "fr", label: "Français", default: true },
      { code: "en", label: "English" },
    ]);
    await fs.outputFile(
      path.join(watchDir, "index.mdx"),
      page("Accueil", "HOME"),
    );
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);

    await generator.init();

    const rootLayout = await readOutput(outputDir, "app", "layout.tsx");
    expect(rootLayout).toContain('<html lang="fr"');
    expect(rootLayout).toContain('r.lang=["en"].indexOf(p)>=0?p:"fr";');
  });

  it("reloads the variant files in watch mode and keeps the last valid config", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const languagesPath = path.join(root, "languages.json");
    await fs.outputFile(path.join(watchDir, "index.mdx"), page("Home", "HOME"));
    await fs.outputFile(
      path.join(watchDir, "de", "guide.mdx"),
      page("Anleitung", "DE_GUIDE"),
    );
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    expect(await siteLayout(outputDir)).not.toContain("locale:");

    const processAll = vi.spyOn(generator, "processAllMDXFiles");
    await fs.writeJson(languagesPath, LANGUAGES);
    await generator.handleConfigFileChange(languagesPath);

    expect(processAll).toHaveBeenCalledTimes(1);
    expect(await siteLayout(outputDir)).toContain('locale: "de",');
    expect(await readOutput(outputDir, "app", "layout.tsx")).toContain(
      "r.lang=",
    );
    expect(await readOutput(outputDir, "languages.json")).toContain('"de"');

    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    await fs.writeFile(languagesPath, "[{ not json");
    await generator.handleConfigFileChange(languagesPath);

    expect(consoleError).toHaveBeenCalled();
    expect(processAll).toHaveBeenCalledTimes(1);
    expect(await siteLayout(outputDir)).toContain('locale: "de",');

    await fs.remove(languagesPath);
    await generator.handleConfigFileDelete(languagesPath);

    expect(processAll).toHaveBeenCalledTimes(2);
    expect(await siteLayout(outputDir)).not.toContain("locale:");
    expect(await readOutput(outputDir, "app", "layout.tsx")).not.toContain(
      "r.lang=",
    );
  });
});
