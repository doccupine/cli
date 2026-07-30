import chokidar, { FSWatcher } from "chokidar";
import fs from "fs-extra";
import { constants } from "node:fs";
import { open, type FileHandle } from "node:fs/promises";
import path from "path";

import chalk from "chalk";

import {
  appStructure,
  obsoleteFiles,
  startingDocsStructure,
} from "./lib/structures.js";
import { rootLayoutTemplate, siteLayoutTemplate } from "./lib/layout.js";
import {
  normalizeOpenApiConfig,
  validateConfig,
} from "./lib/config-manager.js";
import { GeneratedArtifacts } from "./lib/generated-artifacts.js";
import {
  claimOutputDirectory,
  isPathInside,
  resolveOutputPath,
  resolveWithin,
} from "./lib/output-safety.js";
import {
  OpenApiRegistry,
  DEFAULT_API_BASE_SLUG,
  buildEndpointDoc,
  slugifySegment,
} from "./lib/openapi.js";
import {
  generateSlug,
  getFullSlug,
  escapeTemplateContent,
  toJsStringLiteral,
  safeMatter,
  writeFileAtomic,
} from "./lib/utils.js";
import {
  generateMetadataBlock,
  generateRuntimeOnlyMetadataBlock,
  generateJsonLdScript,
} from "./lib/metadata.js";
import { parseUpdateBlocks } from "./lib/rss.js";
import { nextConfigTemplate } from "./templates/next.config.js";
import { pnpmWorkspaceTemplate } from "./templates/pnpmWorkspace.js";
import { proxyTemplate } from "./templates/proxy.js";
import { robotsTemplate } from "./templates/app/robots.js";
import { rssRouteTemplate } from "./templates/app/rssRoute.js";
import { sitemapTemplate, type SitemapEntry } from "./templates/app/sitemap.js";
import { llmsIndexTemplate } from "./templates/llms/llmsIndex.js";
import {
  llmsFullTemplate,
  type PageWithBody,
} from "./templates/llms/llmsFull.js";
import { llmsPageTemplate } from "./templates/llms/llmsPage.js";
import { siteDocsSlug, skillMdTemplate } from "./templates/llms/skillMd.js";
import type {
  DoccupineConfig,
  MDXFile,
  PageMeta,
  SectionConfig,
  FontConfig,
  AnalyticsConfig,
  NormalizedOpenApiSpec,
} from "./lib/types.js";
import type { OperationDescriptor } from "./lib/openapi-types.js";

const PUBLIC_AGGREGATE_PATHS = new Set([
  "llms.txt",
  "llms-full.txt",
  "skill.md",
  ".well-known/mcp.json",
]);

function normalizePublicArtifactPath(relativePath: string): string {
  return relativePath.replace(/\\/g, "/").toLowerCase();
}

function isPublicAggregate(relativePath: string): boolean {
  return PUBLIC_AGGREGATE_PATHS.has(normalizePublicArtifactPath(relativePath));
}

function isManagedPublicArtifact(relativePath: string): boolean {
  const normalized = normalizePublicArtifactPath(relativePath);
  return PUBLIC_AGGREGATE_PATHS.has(normalized) || normalized.endsWith(".md");
}

function errorCode(error: unknown): string | undefined {
  return error && typeof error === "object" && "code" in error
    ? String(error.code)
    : undefined;
}

function sameFileIdentity(left: fs.Stats, right: fs.Stats): boolean {
  return left.dev === right.dev && left.ino === right.ino;
}

export class MDXToNextJSGenerator {
  private watchDir: string;
  private outputDir: string;
  private rootDir: string;
  private watcher: FSWatcher | null = null;
  private configWatcher: FSWatcher | null = null;
  private fontWatcher: FSWatcher | null = null;
  private publicWatcher: FSWatcher | null = null;
  private rootDirWatcher: FSWatcher | null = null;
  private analyticsWatcher: FSWatcher | null = null;
  private openApiWatcher: FSWatcher | null = null;
  private doccupineConfigWatcher: FSWatcher | null = null;
  private doccupineConfigFile = "doccupine.json";
  private configFiles = [
    "theme.json",
    "navigation.json",
    "config.json",
    "links.json",
    "sections.json",
  ];
  private fontConfigFile = "fonts.json";
  private analyticsConfigFile = "analytics.json";
  private analyticsConfig: AnalyticsConfig | null = null;
  private sectionsConfig: SectionConfig[] | null = null;
  /** Guards against recursive reprocessing when maybeUpdateSections() triggers processAllMDXFiles() */
  private isReprocessing = false;
  /** OpenAPI specs (build config) that drive the generated API reference. */
  private openApiSpecs: NormalizedOpenApiSpec[];
  private apiBaseSlug = DEFAULT_API_BASE_SLUG;
  private apiRegistry = new OpenApiRegistry();
  private artifacts: GeneratedArtifacts;
  /** Section slugs whose index redirect we wrote this session, for cleanup. */
  private generatedSectionIndexSlugs = new Set<string>();
  /** Serializes watcher mutations so aggregate files never race one another. */
  private mutationQueue: Promise<void> = Promise.resolve();

  constructor(
    watchDir: string,
    outputDir: string,
    openApiSpecs: NormalizedOpenApiSpec[] = [],
    rootDir: string = process.cwd(),
  ) {
    this.watchDir = path.resolve(watchDir);
    this.outputDir = path.resolve(outputDir);
    this.rootDir = path.resolve(rootDir);
    this.openApiSpecs = openApiSpecs;
    this.artifacts = new GeneratedArtifacts(this.outputDir);
  }

  private outputPath(...segments: string[]): string {
    return resolveOutputPath(this.outputDir, ...segments);
  }

  private publicOutputFilePath(relativePath: string): string {
    const parent = path.dirname(relativePath);
    const outputParent =
      parent === "."
        ? this.outputPath("public")
        : this.outputPath("public", parent);
    return resolveWithin(outputParent, path.basename(relativePath));
  }

  private sourcePathError(label: string, sourcePath: string, detail: string) {
    return new Error(
      `Refusing to use ${label} at ${sourcePath}: ${detail}. Replace it with a real file or directory inside the source root.`,
    );
  }

  private async realSourceRoot(
    root: string,
    label: string,
    rejectRootSymlink: boolean,
  ): Promise<string> {
    let rootStat: fs.Stats;
    try {
      rootStat = await fs.lstat(root);
    } catch (error) {
      if (errorCode(error) === "ENOENT") {
        throw this.sourcePathError(
          label,
          root,
          "the source root does not exist",
        );
      }
      throw error;
    }
    if (rootStat.isSymbolicLink() && rejectRootSymlink) {
      throw this.sourcePathError(
        label,
        root,
        "the source root is a symbolic link",
      );
    }

    const realRoot = await fs.realpath(root);
    if (!(await fs.stat(realRoot)).isDirectory()) {
      throw this.sourcePathError(
        label,
        root,
        "the source root is not a directory",
      );
    }
    return realRoot;
  }

  private async readSafeSourceFile(
    root: string,
    sourcePath: string,
    label: string,
    rejectRootSymlink: boolean,
  ): Promise<{ data: Buffer; stat: fs.Stats }> {
    const resolvedRoot = path.resolve(root);
    const resolvedSource = path.resolve(sourcePath);
    if (!isPathInside(resolvedRoot, resolvedSource)) {
      throw this.sourcePathError(
        label,
        resolvedSource,
        `the path is outside ${resolvedRoot}`,
      );
    }

    const realRoot = await this.realSourceRoot(
      resolvedRoot,
      label,
      rejectRootSymlink,
    );
    const relativePath = path.relative(resolvedRoot, resolvedSource);
    const components = relativePath.split(path.sep).filter(Boolean);
    let currentPath = resolvedRoot;
    for (const [index, component] of components.entries()) {
      currentPath = path.join(currentPath, component);
      let stat: fs.Stats;
      try {
        stat = await fs.lstat(currentPath);
      } catch (error) {
        if (errorCode(error) === "ENOENT") {
          throw this.sourcePathError(
            label,
            currentPath,
            "the path does not exist",
          );
        }
        throw error;
      }
      if (stat.isSymbolicLink()) {
        throw this.sourcePathError(
          label,
          currentPath,
          "the path is a symbolic link",
        );
      }
      if (index < components.length - 1 && !stat.isDirectory()) {
        throw this.sourcePathError(
          label,
          currentPath,
          "a path component is not a directory",
        );
      }
    }

    const sourceStat = await fs.lstat(resolvedSource);
    if (!sourceStat.isFile()) {
      throw this.sourcePathError(
        label,
        resolvedSource,
        "expected a regular file",
      );
    }
    const realSource = await fs.realpath(resolvedSource);
    if (!isPathInside(realRoot, realSource)) {
      throw this.sourcePathError(
        label,
        resolvedSource,
        `the real path ${realSource} is outside ${realRoot}`,
      );
    }

    const noFollow =
      typeof constants.O_NOFOLLOW === "number" ? constants.O_NOFOLLOW : 0;
    let handle: FileHandle;
    try {
      handle = await open(resolvedSource, constants.O_RDONLY | noFollow);
    } catch (error) {
      if (errorCode(error) === "ELOOP") {
        throw this.sourcePathError(
          label,
          resolvedSource,
          "the final path became a symbolic link while it was being opened",
        );
      }
      throw error;
    }

    try {
      const openedStat = await handle.stat();
      if (!openedStat.isFile()) {
        throw this.sourcePathError(
          label,
          resolvedSource,
          "the opened source is not a regular file",
        );
      }

      let currentStat: fs.Stats;
      let currentRealSource: string;
      let currentRealStat: fs.Stats;
      try {
        currentStat = await fs.lstat(resolvedSource);
        currentRealSource = await fs.realpath(resolvedSource);
        currentRealStat = await fs.lstat(currentRealSource);
      } catch {
        throw this.sourcePathError(
          label,
          resolvedSource,
          "the path changed while it was being opened",
        );
      }

      if (!isPathInside(realRoot, currentRealSource)) {
        throw this.sourcePathError(
          label,
          resolvedSource,
          `the real path ${currentRealSource} is outside ${realRoot}`,
        );
      }
      if (
        currentStat.isSymbolicLink() ||
        !currentStat.isFile() ||
        !currentRealStat.isFile() ||
        !sameFileIdentity(sourceStat, openedStat) ||
        !sameFileIdentity(openedStat, currentStat) ||
        !sameFileIdentity(openedStat, currentRealStat)
      ) {
        throw this.sourcePathError(
          label,
          resolvedSource,
          "the source identity changed while it was being opened",
        );
      }

      return { data: await handle.readFile(), stat: openedStat };
    } finally {
      await handle.close();
    }
  }

  private async readMdxSourceFile(
    filePath: string,
  ): Promise<{ content: string; stat: fs.Stats }> {
    if (!filePath.toLowerCase().endsWith(".mdx")) {
      throw this.sourcePathError(
        "documentation source",
        filePath,
        "expected an .mdx file",
      );
    }
    const { data, stat } = await this.readSafeSourceFile(
      this.watchDir,
      path.resolve(this.watchDir, filePath),
      "documentation source",
      false,
    );
    return { content: data.toString("utf8"), stat };
  }

  private async ensureSafeStarterPath(relativePath: string): Promise<string> {
    const resolvedRoot = path.resolve(this.watchDir);
    const targetPath = path.resolve(resolvedRoot, relativePath);
    if (!isPathInside(resolvedRoot, targetPath)) {
      throw this.sourcePathError(
        "documentation source",
        targetPath,
        `the starter path is outside ${resolvedRoot}`,
      );
    }

    const realRoot = await this.realSourceRoot(
      resolvedRoot,
      "documentation source",
      false,
    );
    const parentRelativePath = path.relative(
      resolvedRoot,
      path.dirname(targetPath),
    );
    let currentPath = resolvedRoot;
    for (const component of parentRelativePath
      .split(path.sep)
      .filter(Boolean)) {
      currentPath = path.join(currentPath, component);
      try {
        await fs.mkdir(currentPath);
      } catch (error) {
        if (errorCode(error) !== "EEXIST") throw error;
      }
      const stat = await fs.lstat(currentPath);
      if (stat.isSymbolicLink() || !stat.isDirectory()) {
        throw this.sourcePathError(
          "documentation source",
          currentPath,
          "a starter directory component is not a real directory",
        );
      }
      const realPath = await fs.realpath(currentPath);
      if (!isPathInside(realRoot, realPath)) {
        throw this.sourcePathError(
          "documentation source",
          currentPath,
          `the real path ${realPath} is outside ${realRoot}`,
        );
      }
    }

    try {
      const stat = await fs.lstat(targetPath);
      const detail = stat.isSymbolicLink()
        ? "the starter file is a symbolic link"
        : "the starter file appeared after the empty-source check";
      throw this.sourcePathError("documentation source", targetPath, detail);
    } catch (error) {
      if (errorCode(error) !== "ENOENT") throw error;
    }
    return targetPath;
  }

  private async copyRegularPublicFile(
    publicDir: string,
    sourcePath: string,
    destPath: string,
  ): Promise<void> {
    const { data } = await this.readSafeSourceFile(
      publicDir,
      sourcePath,
      "public source",
      true,
    );
    await writeFileAtomic(destPath, data);
  }

  private async copyRootSourceFile(
    sourcePath: string,
    destPath: string,
    label: string,
  ): Promise<void> {
    const { data } = await this.readSafeSourceFile(
      this.rootDir,
      sourcePath,
      label,
      false,
    );
    await writeFileAtomic(destPath, data);
  }

  private enqueueMutation(label: string, task: () => Promise<void>): void {
    this.mutationQueue = this.mutationQueue.then(task).catch((error) => {
      console.error(chalk.red(`❌ ${label}:`), error);
    });
  }

  async init() {
    console.log(chalk.blue("🚀 Initializing MDX to Next.js generator..."));

    await fs.ensureDir(this.watchDir);
    await claimOutputDirectory(this.outputDir);
    await this.artifacts.load();

    this.sectionsConfig = await this.resolveSections();
    this.analyticsConfig = await this.loadAnalyticsConfig();

    if (this.analyticsConfig) {
      console.log(
        chalk.blue(`📊 Analytics enabled: ${this.analyticsConfig.provider}`),
      );
    }

    // Parse OpenAPI spec(s) before generating structure so the synthetic
    // endpoint pages flow into the very first layout/sitemap/llms pass.
    await this.loadOpenApiRegistry();

    await this.createNextJSStructure();
    await this.createStartingDocs();
    await this.copyCustomConfigFiles();
    await this.copyFontConfig();
    await this.copyAnalyticsConfig();
    await this.copyPublicFiles();

    // createStartingDocs() may have written the sample docs - which carry
    // section frontmatter - after the initial resolveSections() ran against an
    // empty watch dir. Re-resolve now that every MDX file is on disk so the
    // build applies the correct sections in a single O(n) pass, instead of
    // rediscovering them per file (the old O(n²) behavior).
    this.sectionsConfig = await this.resolveSections();
    if (this.sectionsConfig) {
      console.log(
        chalk.blue(
          `📑 Found ${this.sectionsConfig.length} section(s): ${this.sectionsConfig.map((s) => s.label).join(", ")}`,
        ),
      );
    }

    // Write the endpoint pages + request allowlist before the MDX pass so its
    // aggregate refresh (nav/sitemap/llms) already sees them on disk and in the
    // registry.
    await this.writeApiPages();

    await this.processAllMDXFiles();

    console.log(chalk.green("✅ Initial setup complete!"));
    console.log(chalk.cyan("💡 To start the Next.js dev server:"));
    console.log(
      chalk.white(`   cd ${path.relative(process.cwd(), this.outputDir)}`),
    );
    console.log(
      chalk.white("   install dependencies, then run the dev script"),
    );
  }

  async createNextJSStructure() {
    // Clear the generated app/ directory first so a fresh run never inherits
    // stale routes from a previous version (e.g. pages left at their old paths
    // after a route-group move would collide with the newly generated ones).
    // Everything under app/ is regenerated below and by processAllMDXFiles /
    // generateSectionIndexPages, so nothing here is user-authored. Config JSONs
    // and other generated dirs live outside app/ and are untouched.
    await fs.remove(this.outputPath("app"));

    // Drop files that earlier CLI versions generated but no longer exist in
    // the template set, so upgraded projects don't keep stale copies.
    await Promise.all(
      obsoleteFiles.map((file) => fs.remove(this.outputPath(file))),
    );

    const structure: Record<string, string | Promise<string>> = {
      ...appStructure,
      "next.config.ts": nextConfigTemplate(this.analyticsConfig),
      "pnpm-workspace.yaml": pnpmWorkspaceTemplate,
      "proxy.ts": proxyTemplate(this.analyticsConfig),
      "analytics.json": `{}\n`,
      "config.json": `{}\n`,
      "links.json": `[]\n`,
      "navigation.json": `[]\n`,
      "sections.json": `[]\n`,
      "theme.json": `{}\n`,
      "app/robots.ts": robotsTemplate,
      "app/layout.tsx": this.generateRootLayout(),
      "app/(site)/layout.tsx": this.generateSiteLayout(),
    };

    for (const [filePath, content] of Object.entries(structure)) {
      const fullPath = this.outputPath(filePath);
      await fs.ensureDir(path.dirname(fullPath));
      await writeFileAtomic(fullPath, String(await content));
    }

    await this.updateSitemap();
    await this.updateLlmsFiles();
  }

  async createStartingDocs() {
    // Seed only a genuinely empty documentation source. Checking index.mdx
    // alone could overwrite an existing components.mdx or nested page.
    if ((await this.getAllMDXFiles()).length > 0) return;

    for (const [filePath, content] of Object.entries(startingDocsStructure)) {
      const fullPath = await this.ensureSafeStarterPath(filePath);
      await writeFileAtomic(fullPath, String(content));
    }
  }

  async copyCustomConfigFiles() {
    console.log(chalk.blue(`🔍 Checking for config files in: ${this.rootDir}`));

    for (const configFile of this.configFiles) {
      const sourcePath = path.join(this.rootDir, configFile);
      const destPath = this.outputPath(configFile);

      console.log(chalk.gray(`  Checking ${configFile}...`));

      if (await fs.pathExists(sourcePath)) {
        await this.copyRootSourceFile(sourcePath, destPath, "config source");
        console.log(chalk.green(`  ✓ Copied ${configFile} to Next.js app`));
      } else {
        console.log(chalk.gray(`  ✗ ${configFile} not found, skipping`));
      }
    }
  }

  async copyFontConfig() {
    console.log(chalk.blue(`🔍 Checking for font configuration...`));

    const sourcePath = path.join(this.rootDir, this.fontConfigFile);
    const destPath = this.outputPath(this.fontConfigFile);

    if (await fs.pathExists(sourcePath)) {
      await this.copyRootSourceFile(sourcePath, destPath, "font source");
      console.log(
        chalk.green(`  ✓ Copied ${this.fontConfigFile} to Next.js app`),
      );
    } else {
      console.log(chalk.gray(`  ✗ ${this.fontConfigFile} not found, skipping`));
    }
  }

  async loadFontConfig(): Promise<FontConfig | null> {
    const fontPath = path.join(this.rootDir, this.fontConfigFile);

    try {
      if (await fs.pathExists(fontPath)) {
        const fontContent = await fs.readFile(fontPath, "utf8");
        return JSON.parse(fontContent) as FontConfig;
      }
    } catch (error) {
      console.warn(
        chalk.yellow(`⚠️ Error reading ${this.fontConfigFile}`),
        error,
      );
    }

    return null;
  }

  async loadAnalyticsConfig(): Promise<AnalyticsConfig | null> {
    const analyticsPath = path.join(this.rootDir, this.analyticsConfigFile);

    try {
      if (await fs.pathExists(analyticsPath)) {
        const content = await fs.readFile(analyticsPath, "utf8");
        const parsed = JSON.parse(content);
        if (parsed?.provider === "posthog" && parsed.posthog?.key) {
          return parsed as AnalyticsConfig;
        }
      }
    } catch (error) {
      console.warn(
        chalk.yellow(`⚠️ Error reading ${this.analyticsConfigFile}`),
        error,
      );
    }

    return null;
  }

  async copyAnalyticsConfig() {
    console.log(chalk.blue(`🔍 Checking for analytics configuration...`));

    const sourcePath = path.join(this.rootDir, this.analyticsConfigFile);
    const destPath = this.outputPath(this.analyticsConfigFile);

    if (await fs.pathExists(sourcePath)) {
      await this.copyRootSourceFile(sourcePath, destPath, "analytics source");
      console.log(
        chalk.green(`  ✓ Copied ${this.analyticsConfigFile} to Next.js app`),
      );
    } else {
      console.log(
        chalk.gray(`  ✗ ${this.analyticsConfigFile} not found, skipping`),
      );
    }
  }

  async loadSectionsConfig(): Promise<SectionConfig[] | null> {
    const sectionsPath = path.join(this.rootDir, "sections.json");

    try {
      if (await fs.pathExists(sectionsPath)) {
        const content = await fs.readFile(sectionsPath, "utf8");
        const parsed = JSON.parse(content) as unknown;
        if (Array.isArray(parsed) && parsed.length > 0) {
          const seenLabels = new Set<string>();
          const seenSlugs = new Set<string>();
          return parsed.map((entry, index) => {
            if (!entry || typeof entry !== "object") {
              throw new Error(
                `sections.json entry ${index + 1} must be an object`,
              );
            }
            const candidate = entry as Record<string, unknown>;
            const label =
              typeof candidate.label === "string" ? candidate.label.trim() : "";
            const slug =
              typeof candidate.slug === "string" ? candidate.slug.trim() : "";
            if (!label) {
              throw new Error(
                `sections.json entry ${index + 1} needs a non-empty label`,
              );
            }
            if (
              slug !== "" &&
              (slug !== slugifySegment(slug) ||
                slug.includes("/") ||
                slug === "." ||
                slug === "..")
            ) {
              throw new Error(
                `Unsafe section slug "${slug}"; use a lowercase URL segment such as "${slugifySegment(slug)}"`,
              );
            }
            if (seenLabels.has(label) || seenSlugs.has(slug)) {
              throw new Error(
                `Duplicate section label or slug at entry ${index + 1}`,
              );
            }
            seenLabels.add(label);
            seenSlugs.add(slug);

            let directory: string | undefined;
            if (candidate.directory !== undefined) {
              if (typeof candidate.directory !== "string") {
                throw new Error(
                  `sections.json directory at entry ${index + 1} must be a string`,
                );
              }
              directory = candidate.directory
                .replace(/\\/g, "/")
                .replace(/^\/+|\/+$/g, "");
              const parts = directory.split("/");
              if (
                !directory ||
                parts.some(
                  (part) =>
                    part === "." ||
                    part === ".." ||
                    part !== slugifySegment(part),
                )
              ) {
                throw new Error(
                  `Unsafe section directory "${candidate.directory}"`,
                );
              }
            }

            return { label, slug, ...(directory ? { directory } : {}) };
          });
        }
      }
    } catch (error) {
      console.warn(chalk.yellow("⚠️ Error reading sections.json"), error);
    }

    return null;
  }

  async discoverSectionsFromFrontmatter(): Promise<SectionConfig[] | null> {
    const files = await this.getAllMDXFiles();
    const sectionMap = new Map<string, { label: string; order: number }>();
    let hasUnsectionedPages = false;
    let defaultSectionLabel = "Docs";

    for (const file of files) {
      const { content } = await this.readMdxSourceFile(file);
      const { data: frontmatter } = safeMatter(content, file);

      if (
        typeof frontmatter.section === "string" &&
        frontmatter.section.trim()
      ) {
        const label = frontmatter.section.trim();
        const order =
          typeof frontmatter.sectionOrder === "number"
            ? frontmatter.sectionOrder
            : 0;
        const existing = sectionMap.get(label);
        if (!existing || order < existing.order) {
          sectionMap.set(label, { label, order });
        }
      } else {
        hasUnsectionedPages = true;
      }

      if (
        (file === "index.mdx" || file === "./index.mdx") &&
        typeof frontmatter.sectionLabel === "string" &&
        frontmatter.sectionLabel.trim()
      ) {
        defaultSectionLabel = frontmatter.sectionLabel.trim();
      }
    }

    if (sectionMap.size === 0) return null;

    const sorted = [...sectionMap.values()].sort((a, b) => a.order - b.order);

    const sections: SectionConfig[] = [];

    // Implicit root entry for pages without a section field
    if (hasUnsectionedPages) {
      sections.push({ label: defaultSectionLabel, slug: "" });
    }

    const usedSlugs = new Set<string>(sections.map((section) => section.slug));
    for (const s of sorted) {
      const slug = slugifySegment(s.label);
      if (usedSlugs.has(slug)) {
        throw new Error(
          `Section labels resolve to the same slug "${slug}". Rename one section or define sections.json explicitly.`,
        );
      }
      usedSlugs.add(slug);
      sections.push({
        label: s.label,
        slug,
      });
    }

    return sections;
  }

  async resolveSections(): Promise<SectionConfig[] | null> {
    const fromFile = await this.loadSectionsConfig();
    const base = fromFile ?? (await this.discoverSectionsFromFrontmatter());
    return this.withApiReferenceSection(base);
  }

  /**
   * Promotes the generated OpenAPI endpoints into a dedicated "API Reference"
   * section so they get their own top-level nav, separate from hand-written
   * docs. When the site had no sections, a root "Documentation" section is added
   * for the existing pages so both appear in the section switcher.
   */
  private withApiReferenceSection(
    sections: SectionConfig[] | null,
  ): SectionConfig[] | null {
    if (this.apiRegistry.isEmpty) return sections;
    const apiSection: SectionConfig = {
      label: "API Reference",
      slug: this.apiBaseSlug,
    };
    if (!sections || sections.length === 0) {
      return [{ label: "Documentation", slug: "" }, apiSection];
    }
    if (sections.some((s) => s.slug === this.apiBaseSlug)) return sections;
    return [...sections, apiSection];
  }

  private async reloadSections(): Promise<void> {
    console.log(chalk.cyan("📑 Sections configuration changed"));
    this.sectionsConfig = await this.resolveSections();
    await this.processAllMDXFiles();
  }

  private async maybeUpdateSections(): Promise<void> {
    if (this.isReprocessing) return;

    // Skip if sections.json exists (explicit config takes priority)
    const fromFile = await this.loadSectionsConfig();
    if (fromFile) return;

    const newSections = this.withApiReferenceSection(
      await this.discoverSectionsFromFrontmatter(),
    );
    const changed =
      JSON.stringify(newSections) !== JSON.stringify(this.sectionsConfig);

    if (changed) {
      console.log(
        chalk.cyan(
          newSections
            ? `📑 Sections updated from frontmatter: ${newSections.map((s) => s.label).join(", ")}`
            : "📑 Sections cleared (no section frontmatter found)",
        ),
      );
      this.sectionsConfig = newSections;
      this.isReprocessing = true;
      try {
        // processAllMDXFiles() already refreshes section index pages via its
        // aggregate pass, so no separate generateSectionIndexPages() here.
        await this.processAllMDXFiles();
      } finally {
        this.isReprocessing = false;
      }
    }
  }

  private determineSectionForFile(
    filePath: string,
    frontmatter: Record<string, any>,
  ): { sectionSlug: string; pageSlug: string } {
    if (!this.sectionsConfig || this.sectionsConfig.length === 0) {
      return { sectionSlug: "", pageSlug: generateSlug(filePath) };
    }

    const normalizedPath = filePath.replace(/\\/g, "/");

    const firstDir = normalizedPath.includes("/")
      ? normalizedPath.split("/")[0]
      : "";

    // Explicit directory matching (entries with a directory field)
    for (const section of this.sectionsConfig) {
      if (!section.directory) continue;
      const dirPrefix = section.directory + "/";
      if (normalizedPath.startsWith(dirPrefix)) {
        return {
          sectionSlug: section.slug,
          pageSlug: generateSlug(normalizedPath.slice(dirPrefix.length)),
        };
      }
    }

    // Directory matches section slug (auto-detect)
    if (firstDir) {
      const match = this.sectionsConfig.find((s) => s.slug === firstDir);
      if (match) {
        const pathForSlug = normalizedPath.slice(firstDir.length + 1);
        return {
          sectionSlug: match.slug,
          pageSlug: generateSlug(pathForSlug),
        };
      }
    }

    // Frontmatter section field
    if (frontmatter.section) {
      const label = frontmatter.section as string;
      const match = this.sectionsConfig.find((s) => s.label === label);
      if (match) {
        // Strip the directory if it matches the section slug
        let pathForSlug = filePath;
        if (firstDir && firstDir === match.slug) {
          pathForSlug = normalizedPath.slice(firstDir.length + 1);
        }

        return {
          sectionSlug: match.slug,
          pageSlug: generateSlug(pathForSlug),
        };
      }
    }

    // No section match - page stays at root
    return {
      sectionSlug: "",
      pageSlug: generateSlug(filePath),
    };
  }

  async handleConfigFileChange(filePath: string) {
    const fileName = path.basename(filePath);

    if (this.configFiles.includes(fileName)) {
      const sourcePath = path.join(this.rootDir, fileName);
      const destPath = this.outputPath(fileName);

      try {
        await this.copyRootSourceFile(sourcePath, destPath, "config source");
        console.log(chalk.green(`📋 Updated ${fileName} in Next.js app`));

        if (fileName === "sections.json") {
          await this.reloadSections();
        }

        if (fileName === "config.json") {
          await this.updateSitemap();
          await this.updateRobots();
          await this.updateLlmsFiles();
        }
      } catch (error) {
        console.error(chalk.red(`❌ Error copying ${fileName}:`), error);
      }
    }
  }

  async handleConfigFileDelete(filePath: string) {
    const fileName = path.basename(filePath);

    if (this.configFiles.includes(fileName)) {
      const destPath = this.outputPath(fileName);

      try {
        const arrayDefaults = new Set([
          "links.json",
          "navigation.json",
          "sections.json",
        ]);
        await writeFileAtomic(
          destPath,
          arrayDefaults.has(fileName) ? `[]\n` : `{}\n`,
        );
        console.log(
          chalk.yellow(`🗑️ Reset ${fileName} to its generated default`),
        );

        if (fileName === "sections.json") {
          await this.reloadSections();
        }

        if (fileName === "config.json") {
          await this.updateSitemap();
          await this.updateRobots();
          await this.updateLlmsFiles();
        }
      } catch (error) {
        console.error(chalk.red(`❌ Error removing ${fileName}:`), error);
      }
    }
  }

  async handleFontConfigChange() {
    console.log(chalk.cyan(`🔤 Font configuration changed`));

    const sourcePath = path.join(this.rootDir, this.fontConfigFile);
    const destPath = this.outputPath(this.fontConfigFile);

    try {
      await this.copyRootSourceFile(sourcePath, destPath, "font source");
      console.log(
        chalk.green(`📋 Updated ${this.fontConfigFile} in Next.js app`),
      );

      await this.updateRootLayout();
      console.log(chalk.green(`✅ Layout updated with new font configuration`));
    } catch (error) {
      console.error(chalk.red(`❌ Error updating font configuration:`), error);
    }
  }

  async handleFontConfigDelete() {
    console.log(chalk.red(`🗑️ Font configuration deleted`));

    const destPath = this.outputPath(this.fontConfigFile);

    try {
      if (await fs.pathExists(destPath)) {
        await fs.remove(destPath);
        console.log(
          chalk.yellow(`🗑️ Removed ${this.fontConfigFile} from Next.js app`),
        );

        await this.updateRootLayout();
        console.log(
          chalk.green(`✅ Layout updated without font configuration`),
        );
      }
    } catch (error) {
      console.error(chalk.red(`❌ Error removing font configuration:`), error);
    }
  }

  async handleAnalyticsConfigChange() {
    console.log(chalk.cyan(`📊 Analytics configuration changed`));

    const sourcePath = path.join(this.rootDir, this.analyticsConfigFile);
    const destPath = this.outputPath(this.analyticsConfigFile);

    try {
      await this.copyRootSourceFile(sourcePath, destPath, "analytics source");
      console.log(
        chalk.green(`📋 Updated ${this.analyticsConfigFile} in Next.js app`),
      );

      this.analyticsConfig = await this.loadAnalyticsConfig();

      // Regenerate dynamic templates that depend on analytics config
      await writeFileAtomic(
        this.outputPath("next.config.ts"),
        nextConfigTemplate(this.analyticsConfig),
      );
      await writeFileAtomic(
        this.outputPath("proxy.ts"),
        proxyTemplate(this.analyticsConfig),
      );
      await this.updateRootLayout();

      console.log(chalk.green(`✅ Analytics configuration updated`));

      if (this.analyticsConfig) {
        console.log(
          chalk.yellow(
            `⚠️ Next.js dev server restart may be required for analytics proxy changes`,
          ),
        );
      }
    } catch (error) {
      console.error(
        chalk.red(`❌ Error updating analytics configuration:`),
        error,
      );
    }
  }

  async handleAnalyticsConfigDelete() {
    console.log(chalk.red(`🗑️ Analytics configuration deleted`));

    const destPath = this.outputPath(this.analyticsConfigFile);

    try {
      // Write empty analytics.json so runtime imports don't break
      await writeFileAtomic(destPath, `{}\n`);

      this.analyticsConfig = null;

      // Regenerate dynamic templates without analytics
      await writeFileAtomic(
        this.outputPath("next.config.ts"),
        nextConfigTemplate(null),
      );
      await writeFileAtomic(this.outputPath("proxy.ts"), proxyTemplate(null));
      await this.updateRootLayout();

      console.log(chalk.green(`✅ Analytics removed from Next.js app`));
    } catch (error) {
      console.error(
        chalk.red(`❌ Error removing analytics configuration:`),
        error,
      );
    }
  }

  async copyPublicFiles() {
    const publicDir = path.join(this.rootDir, "public");

    console.log(chalk.blue(`🔍 Checking for public directory...`));

    let publicStat: fs.Stats;
    try {
      publicStat = await fs.lstat(publicDir);
    } catch (error) {
      if (errorCode(error) !== "ENOENT") throw error;
      console.log(chalk.gray(`  ✗ public directory not found, skipping`));
      return;
    }
    if (publicStat.isSymbolicLink() || !publicStat.isDirectory()) {
      throw this.sourcePathError(
        "public source",
        publicDir,
        "the public source root must be a real directory",
      );
    }

    const realPublicDir = await this.realSourceRoot(
      publicDir,
      "public source",
      true,
    );
    const files: string[] = [];
    const scanDir = async (directory: string, relativePath = "") => {
      const entries = await fs.readdir(directory, { withFileTypes: true });
      for (const entry of entries) {
        const sourcePath = path.join(directory, entry.name);
        const entryRelativePath = path.join(relativePath, entry.name);
        const stat = await fs.lstat(sourcePath);
        if (stat.isSymbolicLink()) {
          throw this.sourcePathError(
            "public source",
            sourcePath,
            "the path is a symbolic link",
          );
        }
        const realPath = await fs.realpath(sourcePath);
        if (!isPathInside(realPublicDir, realPath)) {
          throw this.sourcePathError(
            "public source",
            sourcePath,
            `the real path ${realPath} is outside ${realPublicDir}`,
          );
        }
        if (stat.isDirectory()) {
          await scanDir(sourcePath, entryRelativePath);
        } else if (stat.isFile()) {
          files.push(entryRelativePath);
        } else {
          throw this.sourcePathError(
            "public source",
            sourcePath,
            "expected a regular file or directory",
          );
        }
      }
    };

    await scanDir(publicDir);
    for (const relativePath of files) {
      await this.copyRegularPublicFile(
        publicDir,
        path.join(publicDir, relativePath),
        this.publicOutputFilePath(relativePath),
      );
    }
    console.log(chalk.green(`  ✓ Copied public directory to Next.js app`));
  }

  async handlePublicFileChange(filePath: string) {
    const publicDir = path.join(this.rootDir, "public");
    const relativePath = path.relative(publicDir, filePath);
    const destRelativePath = isPublicAggregate(relativePath)
      ? normalizePublicArtifactPath(relativePath)
      : relativePath;
    const destPath = this.publicOutputFilePath(destRelativePath);

    try {
      await this.copyRegularPublicFile(publicDir, filePath, destPath);
      console.log(
        chalk.green(`📋 Updated public/${relativePath} in Next.js app`),
      );
      if (isManagedPublicArtifact(relativePath)) {
        await this.updateLlmsFiles();
      }
    } catch (error) {
      console.error(
        chalk.red(`❌ Error copying public/${relativePath}:`),
        error,
      );
      throw error;
    }
  }

  async handlePublicFileDelete(filePath: string) {
    const publicDir = path.join(this.rootDir, "public");
    const relativePath = path.relative(publicDir, filePath);
    const destRelativePath = isPublicAggregate(relativePath)
      ? normalizePublicArtifactPath(relativePath)
      : relativePath;
    const destPath = this.outputPath("public", destRelativePath);

    try {
      // A rapid replace can queue an unlink after the replacement already
      // exists. Copy the current source instead of deleting its fresh mirror.
      if (await fs.pathExists(filePath)) {
        await this.handlePublicFileChange(filePath);
        return;
      }
      if (await fs.pathExists(destPath)) {
        await fs.remove(destPath);
        console.log(
          chalk.yellow(`🗑️ Removed public/${relativePath} from Next.js app`),
        );
      }
      if (isManagedPublicArtifact(relativePath)) {
        await this.updateLlmsFiles();
      }
    } catch (error) {
      console.error(
        chalk.red(`❌ Error removing public/${relativePath}:`),
        error,
      );
    }
  }

  async startWatching() {
    console.log(chalk.yellow(`👀 Watching for changes in: ${this.watchDir}`));

    this.watcher = chokidar.watch(this.watchDir, {
      persistent: true,
      ignoreInitial: true,
      followSymlinks: false,
      ignored: (filePath: string, stats?: fs.Stats) => {
        const isFile = stats?.isFile() ?? path.extname(filePath) !== "";
        const fileName = path.basename(filePath);

        if (this.configFiles.includes(fileName)) {
          return true;
        }

        if (isFile && !filePath.endsWith(".mdx")) {
          return true;
        }
        return false;
      },
    });

    this.watcher
      .on("add", (filePath: string) => {
        const relativePath = path.relative(this.watchDir, filePath);
        this.enqueueMutation("Error processing added MDX file", () =>
          this.handleFileChange("added", relativePath),
        );
      })
      .on("change", (filePath: string) => {
        const relativePath = path.relative(this.watchDir, filePath);
        this.enqueueMutation("Error processing changed MDX file", () =>
          this.handleFileChange("changed", relativePath),
        );
      })
      .on("unlink", (filePath: string) => {
        const relativePath = path.relative(this.watchDir, filePath);
        this.enqueueMutation("Error processing deleted MDX file", () =>
          this.handleFileDelete(relativePath),
        );
      })
      .on("ready", () => {
        console.log(
          chalk.green("📁 Initial scan complete. Ready for changes..."),
        );
      })
      .on("error", (error: unknown) => {
        console.error(chalk.red("❌ Watcher error:"), error);
      });

    const configPaths = this.configFiles.map((f) => path.join(this.rootDir, f));

    this.configWatcher = chokidar.watch(configPaths, {
      persistent: true,
      ignoreInitial: true,
    });

    this.configWatcher
      .on("add", (filePath: string) => {
        console.log(
          chalk.cyan(`📝 Config file added: ${path.basename(filePath)}`),
        );
        this.enqueueMutation("Error applying config file", () =>
          this.handleConfigFileChange(filePath),
        );
      })
      .on("change", (filePath: string) => {
        console.log(
          chalk.cyan(`📝 Config file changed: ${path.basename(filePath)}`),
        );
        this.enqueueMutation("Error applying config file", () =>
          this.handleConfigFileChange(filePath),
        );
      })
      .on("unlink", (filePath: string) => {
        console.log(
          chalk.red(`🗑️ Config file deleted: ${path.basename(filePath)}`),
        );
        this.enqueueMutation("Error deleting config file", () =>
          this.handleConfigFileDelete(filePath),
        );
      })
      .on("error", (error: unknown) => {
        console.error(chalk.red("❌ Config watcher error:"), error);
      });

    const fontPath = path.join(this.rootDir, this.fontConfigFile);

    this.fontWatcher = chokidar.watch(fontPath, {
      persistent: true,
      ignoreInitial: true,
    });

    this.fontWatcher
      .on("add", () => {
        console.log(chalk.cyan(`🔤 Font configuration added`));
        this.enqueueMutation("Error applying font configuration", () =>
          this.handleFontConfigChange(),
        );
      })
      .on("change", () => {
        this.enqueueMutation("Error applying font configuration", () =>
          this.handleFontConfigChange(),
        );
      })
      .on("unlink", () => {
        this.enqueueMutation("Error deleting font configuration", () =>
          this.handleFontConfigDelete(),
        );
      })
      .on("error", (error: unknown) => {
        console.error(chalk.red("❌ Font watcher error:"), error);
      });

    const analyticsPath = path.join(this.rootDir, this.analyticsConfigFile);

    this.analyticsWatcher = chokidar.watch(analyticsPath, {
      persistent: true,
      ignoreInitial: true,
    });

    this.analyticsWatcher
      .on("add", () => {
        console.log(chalk.cyan(`📊 Analytics configuration added`));
        this.enqueueMutation("Error applying analytics configuration", () =>
          this.handleAnalyticsConfigChange(),
        );
      })
      .on("change", () => {
        this.enqueueMutation("Error applying analytics configuration", () =>
          this.handleAnalyticsConfigChange(),
        );
      })
      .on("unlink", () => {
        this.enqueueMutation("Error deleting analytics configuration", () =>
          this.handleAnalyticsConfigDelete(),
        );
      })
      .on("error", (error: unknown) => {
        console.error(chalk.red("❌ Analytics watcher error:"), error);
      });

    await this.syncOpenApiSpecWatcher();

    const doccupineConfigPath = path.join(
      this.rootDir,
      this.doccupineConfigFile,
    );

    this.doccupineConfigWatcher = chokidar.watch(doccupineConfigPath, {
      persistent: true,
      ignoreInitial: true,
    });

    this.doccupineConfigWatcher
      .on("add", () =>
        this.enqueueMutation("Error applying doccupine.json", () =>
          this.handleDoccupineConfigChange(),
        ),
      )
      .on("change", () =>
        this.enqueueMutation("Error applying doccupine.json", () =>
          this.handleDoccupineConfigChange(),
        ),
      )
      .on("error", (error: unknown) => {
        console.error(chalk.red("❌ doccupine.json watcher error:"), error);
      });

    const publicDir = path.join(this.rootDir, "public");

    if (await fs.pathExists(publicDir)) {
      this.setupPublicWatcher();
    }

    // Watch rootDir for public directory creation
    this.rootDirWatcher = chokidar.watch(this.rootDir, {
      persistent: true,
      ignoreInitial: true,
      depth: 0,
    });

    this.rootDirWatcher
      .on("addDir", (dirPath: string) => {
        if (
          path.basename(dirPath) === "public" &&
          path.dirname(dirPath) === this.rootDir &&
          !this.publicWatcher
        ) {
          this.enqueueMutation(
            "Error initializing public directory",
            async () => {
              console.log(chalk.cyan("📁 Public directory created"));
              await this.copyPublicFiles();
              this.setupPublicWatcher();
            },
          );
        }
      })
      .on("error", (error: unknown) => {
        console.error(chalk.red("❌ Root dir watcher error:"), error);
      });
  }

  private setupPublicWatcher() {
    if (this.publicWatcher) {
      return;
    }

    const publicDir = path.join(this.rootDir, "public");

    this.publicWatcher = chokidar.watch(publicDir, {
      persistent: true,
      ignoreInitial: true,
      followSymlinks: false,
    });

    this.publicWatcher
      .on("add", (filePath: string) => {
        console.log(
          chalk.cyan(
            `📁 Public file added: ${path.relative(publicDir, filePath)}`,
          ),
        );
        this.enqueueMutation("Error copying public file", () =>
          this.handlePublicFileChange(filePath),
        );
      })
      .on("change", (filePath: string) => {
        console.log(
          chalk.cyan(
            `📁 Public file changed: ${path.relative(publicDir, filePath)}`,
          ),
        );
        this.enqueueMutation("Error copying public file", () =>
          this.handlePublicFileChange(filePath),
        );
      })
      .on("unlink", (filePath: string) => {
        console.log(
          chalk.red(
            `🗑️ Public file deleted: ${path.relative(publicDir, filePath)}`,
          ),
        );
        this.enqueueMutation("Error deleting public file", () =>
          this.handlePublicFileDelete(filePath),
        );
      })
      .on("error", (error: unknown) => {
        console.error(chalk.red("❌ Public watcher error:"), error);
      });
  }

  private async parseMDXFile(file: string): Promise<PageMeta> {
    const { content, stat } = await this.readMdxSourceFile(file);
    const { data: frontmatter } = safeMatter(content, file);

    const { sectionSlug, pageSlug } = this.determineSectionForFile(
      file,
      frontmatter,
    );
    const fullSlug = getFullSlug(pageSlug, sectionSlug);

    let lastModified: string | undefined;
    const authoredLastModified = frontmatter.updated ?? frontmatter.date;
    if (authoredLastModified) {
      const parsed = new Date(authoredLastModified);
      if (!Number.isNaN(parsed.getTime())) {
        lastModified = parsed.toISOString();
      }
    }
    if (!lastModified) {
      lastModified = stat.mtime.toISOString();
    }

    // A hand-written page that embeds an endpoint via `openapi:` frontmatter
    // gets the same method badge in the sidebar as a generated endpoint page.
    let httpMethod: string | undefined;
    if (frontmatter.openapi) {
      const op = this.apiRegistry.lookup(String(frontmatter.openapi));
      if (op) httpMethod = op.method.toUpperCase();
    }

    return {
      slug: fullSlug,
      title: frontmatter.title || "Untitled",
      description: frontmatter.description || "",
      date: frontmatter.date || null,
      category: frontmatter.category || "",
      path: file,
      categoryOrder: frontmatter.categoryOrder || 0,
      order: frontmatter.order || 0,
      section: sectionSlug,
      // Sidebar icons (Lucide names). Kept separate from `icon`, which is
      // reserved for the favicon/OG metadata. Only emitted when set so the
      // generated page literal stays lean.
      ...(frontmatter.navIcon ? { navIcon: String(frontmatter.navIcon) } : {}),
      ...(frontmatter.categoryIcon
        ? { categoryIcon: String(frontmatter.categoryIcon) }
        : {}),
      ...(httpMethod ? { httpMethod } : {}),
      lastModified,
    };
  }

  private async buildRealPagesMeta(): Promise<PageMeta[]> {
    const files = await this.getAllMDXFiles();
    const real = await Promise.all(
      files.map((file) => this.parseMDXFile(file)),
    );
    const bySlug = new Map<string, string>();
    for (const page of real) {
      const existing = bySlug.get(page.slug);
      if (existing) {
        throw new Error(
          `Route collision at "/${page.slug}": both "${existing}" and "${page.path}" generate the same page.`,
        );
      }
      bySlug.set(page.slug, page.path);
    }
    return real;
  }

  private async buildAllPagesMeta(): Promise<PageMeta[]> {
    const real = await this.buildRealPagesMeta();
    if (this.apiRegistry.isEmpty) return real;

    // Inject synthetic OpenAPI endpoint pages here - the single funnel every
    // aggregate (nav, sitemap, llms) flows through - so they cannot be dropped
    // by the .mdx-only disk scan. Hand-written pages win on any slug collision.
    const realSlugs = new Set(real.map((page) => page.slug));
    const synthetic = this.apiRegistry.syntheticPages().filter((page) => {
      if (realSlugs.has(page.slug)) {
        console.log(
          chalk.yellow(
            `⚠️ API page ${page.slug} is shadowed by a hand-written page; skipping`,
          ),
        );
        return false;
      }
      return true;
    });
    return [...real, ...synthetic];
  }

  private async removeOwnedRoute(slug: string): Promise<void> {
    if (!slug) return;
    const siteDir = this.outputPath("app", "(site)");
    const routeDir = resolveOutputPath(siteDir, slug);
    await Promise.all([
      fs.remove(resolveOutputPath(siteDir, slug, "page.tsx")),
      fs.remove(resolveOutputPath(siteDir, slug, "rss.xml")),
    ]);
    await this.removeEmptyDirsUpTo(routeDir, siteDir);
  }

  private async removeStaleMdxRoutes(realPages: PageMeta[]): Promise<void> {
    const nextBySource = new Map(
      realPages
        .filter((page) => page.slug !== "")
        .map((page) => [page.path.replace(/\\/g, "/"), page.slug]),
    );
    const nextSlugs = new Set(nextBySource.values());

    for (const previous of this.artifacts.routesFor("mdx")) {
      if (nextBySource.get(previous.source) === previous.slug) continue;
      if (nextSlugs.has(previous.slug)) continue;
      await this.removeOwnedRoute(previous.slug);
    }
  }

  /**
   * Writes the generated page(s) for a single MDX file: the doc page and, for a
   * section-index file, the section landing page. Deliberately does NOT run the
   * site-wide aggregations (pages index, layout, sitemap, llms, section
   * redirects) - the caller batches those so a bulk build runs them once at the
   * end instead of once per file (which is what made large builds O(n²)).
   */
  private async writePageForFile(filePath: string): Promise<void> {
    const { content } = await this.readMdxSourceFile(filePath);
    const { data: frontmatter, content: mdxContent } = safeMatter(
      content,
      filePath,
    );

    const { sectionSlug, pageSlug } = this.determineSectionForFile(
      filePath,
      frontmatter,
    );
    const fullSlug = getFullSlug(pageSlug, sectionSlug);

    const isIndex = filePath === "index.mdx" || filePath === "./index.mdx";
    const isSectionIndex =
      this.sectionsConfig && pageSlug === "" && sectionSlug !== "";

    if (isIndex) {
      // The homepage is emitted by updatePagesIndex() in the aggregate pass, so
      // there is no per-file page to write here.
      console.log(chalk.blue("🏠 Updating homepage with index.mdx content"));
    } else {
      const mdxFile: MDXFile = {
        path: filePath,
        content: mdxContent,
        frontmatter,
        slug: fullSlug,
      };

      // `openapi: <METHOD> <path>` (or an operationId) in frontmatter renders
      // that operation's playground inline with the author's prose. An unknown
      // reference is logged and the page still renders its prose (graceful).
      let apiOperation: OperationDescriptor | undefined;
      if (frontmatter.openapi) {
        apiOperation = this.apiRegistry.lookup(String(frontmatter.openapi));
        if (!apiOperation) {
          console.error(
            chalk.red(
              `❌ openapi frontmatter "${frontmatter.openapi}" in ${filePath} not found in any spec`,
            ),
          );
        }
      }

      await this.generatePageFromMDX(
        mdxFile,
        apiOperation ? { apiOperation } : undefined,
      );
    }

    if (isSectionIndex) {
      await this.updateSectionIndex(
        sectionSlug,
        frontmatter,
        mdxContent,
        filePath,
      );
    }
  }

  /**
   * Regenerates every file that depends on the full set of pages (pages index,
   * root/site layout, sitemap, llms files, section redirects). Parses all MDX
   * exactly once and threads the result through each generator, so one refresh
   * is a single scan rather than one scan per generator.
   */
  private async refreshSiteAggregates(
    resolvedPages?: PageMeta[],
  ): Promise<void> {
    const pages = resolvedPages ?? (await this.buildAllPagesMeta());
    await this.updatePagesIndex();
    await this.updateRootLayout(pages);
    await this.updateSitemap(pages);
    await this.updateLlmsFiles(pages);
    await this.generateSectionIndexPages(pages);
  }

  async handleFileChange(action: string, filePath: string) {
    console.log(chalk.cyan(`📝 File ${action}: ${filePath}`));

    await this.readMdxSourceFile(filePath);

    try {
      // Validate the complete route set before writing this page so a collision
      // cannot transiently overwrite another route during watch mode.
      const normalizedSource = filePath.replace(/\\/g, "/");
      const previousSlug = this.artifacts.routeFor("mdx", normalizedSource);
      const realPages = await this.buildRealPagesMeta();
      const currentPage = realPages.find(
        (page) => page.path.replace(/\\/g, "/") === normalizedSource,
      );
      if (previousSlug && previousSlug !== currentPage?.slug)
        await this.removeStaleMdxRoutes(realPages);

      await this.writePageForFile(filePath);
      this.artifacts.replaceRoutes(
        "mdx",
        realPages
          .filter((page) => page.slug !== "")
          .map((page) => ({ source: page.path, slug: page.slug })),
      );
      await this.artifacts.save();

      if (!this.apiRegistry.isEmpty) await this.writeApiPages();
      const pages = await this.buildAllPagesMeta();
      await this.refreshSiteAggregates(pages);

      console.log(chalk.green(`✅ Generated page for: ${filePath}`));

      await this.maybeUpdateSections();
    } catch (error) {
      console.error(chalk.red(`❌ Error processing ${filePath}:`), error);
    }
  }

  async handleFileDelete(filePath: string) {
    console.log(chalk.red(`🗑️ File deleted: ${filePath}`));

    try {
      if (filePath === "index.mdx" || filePath === "./index.mdx") {
        console.log(chalk.blue("🏠 Updating homepage - index.mdx deleted"));
      } else {
        const normalizedSource = filePath.replace(/\\/g, "/");
        const ownedSlug = this.artifacts.routeFor("mdx", normalizedSource);
        if (ownedSlug) await this.removeOwnedRoute(ownedSlug);
        this.artifacts.removeRoute("mdx", normalizedSource);
        await this.artifacts.save();
      }

      if (!this.apiRegistry.isEmpty) await this.writeApiPages();
      await this.refreshSiteAggregates();

      console.log(chalk.green(`✅ Removed page for: ${filePath}`));

      await this.maybeUpdateSections();
    } catch (error) {
      console.error(
        chalk.red(`❌ Error removing page for ${filePath}:`),
        error,
      );
    }
  }

  async processAllMDXFiles() {
    const files = await this.getAllMDXFiles();
    // Fail before writing any page when two source files resolve to one route.
    const realPages = await this.buildRealPagesMeta();
    await this.removeStaleMdxRoutes(realPages);

    // Write each page first (the only genuinely per-file work), then run the
    // site-wide aggregations a single time. Doing the aggregations per file
    // re-scanned and re-parsed every MDX file on each iteration, which made a
    // full build O(n²); batching them makes it O(n). A single bad file is
    // logged and skipped so it never aborts the whole build.
    for (const file of files) {
      console.log(chalk.cyan(`📝 Processing: ${file}`));
      try {
        await this.writePageForFile(file);
      } catch (error) {
        console.error(chalk.red(`❌ Error processing ${file}:`), error);
      }
    }

    this.artifacts.replaceRoutes(
      "mdx",
      realPages
        .filter((page) => page.slug !== "")
        .map((page) => ({ source: page.path, slug: page.slug })),
    );
    await this.artifacts.save();

    const pages = await this.buildAllPagesMeta();
    await this.refreshSiteAggregates(pages);
  }

  async getAllMDXFiles(): Promise<string[]> {
    const files: string[] = [];
    const realWatchDir = await this.realSourceRoot(
      this.watchDir,
      "documentation source",
      false,
    );

    const scanDir = async (dir: string, relativePath = "") => {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.join(relativePath, entry.name);
        const stat = await fs.lstat(fullPath);

        if (stat.isSymbolicLink()) {
          let linksToDirectory = false;
          try {
            linksToDirectory = (await fs.stat(fullPath)).isDirectory();
          } catch (error) {
            if (errorCode(error) !== "ENOENT") throw error;
          }
          if (entry.name.endsWith(".mdx") || linksToDirectory) {
            throw this.sourcePathError(
              "documentation source",
              fullPath,
              "the path is a symbolic link",
            );
          }
          continue;
        }
        const realPath = await fs.realpath(fullPath);
        if (!isPathInside(realWatchDir, realPath)) {
          throw this.sourcePathError(
            "documentation source",
            fullPath,
            `the real path ${realPath} is outside ${realWatchDir}`,
          );
        }

        if (stat.isDirectory()) {
          await scanDir(fullPath, relPath);
        } else if (stat.isFile() && entry.name.endsWith(".mdx")) {
          files.push(relPath);
        } else if (!stat.isFile() && entry.name.endsWith(".mdx")) {
          throw this.sourcePathError(
            "documentation source",
            fullPath,
            "expected a regular .mdx file",
          );
        }
      }
    };

    await scanDir(this.watchDir);
    return files;
  }

  async generateRootLayout(): Promise<string> {
    const fontConfig = await this.loadFontConfig();
    const analyticsEnabled = this.analyticsConfig !== null;
    return rootLayoutTemplate(fontConfig, analyticsEnabled);
  }

  async generateSiteLayout(pages?: PageMeta[]): Promise<string> {
    const resolvedPages = pages ?? (await this.buildAllPagesMeta());
    return siteLayoutTemplate(resolvedPages, this.sectionsConfig);
  }

  async generateSectionIndexPages(pages?: PageMeta[]) {
    const nextSlugs = new Set<string>();

    if (this.sectionsConfig && this.sectionsConfig.length > 0) {
      const resolvedPages = pages ?? (await this.buildAllPagesMeta());

      for (const section of this.sectionsConfig) {
        if (section.slug === "") continue;

        // Check if a page already exists at the section root
        const hasIndex = resolvedPages.some((p) => p.slug === section.slug);
        if (hasIndex) continue;

        // Find the first page in this section
        const sectionPages = resolvedPages
          .filter((p) => p.section === section.slug)
          .sort((a, b) => {
            if (a.categoryOrder !== b.categoryOrder)
              return a.categoryOrder - b.categoryOrder;
            return a.order - b.order;
          });

        if (sectionPages.length === 0) continue;

        const firstPage = sectionPages[0];
        const redirectContent = `import { redirect } from "next/navigation";

export default function SectionIndex() {
  redirect("/${firstPage.slug}");
}
`;

        const pagePath = resolveOutputPath(
          this.outputDir,
          "app",
          "(site)",
          section.slug,
          "page.tsx",
        );
        await fs.ensureDir(path.dirname(pagePath));
        await writeFileAtomic(pagePath, redirectContent);
        nextSlugs.add(section.slug);
        console.log(
          chalk.blue(
            `🔀 Generated section index redirect: /${section.slug} -> /${firstPage.slug}`,
          ),
        );
      }
    }

    await this.cleanupStaleSectionIndexPages(nextSlugs);
  }

  /**
   * Removes section index redirects written earlier in this session whose
   * section has since disappeared (e.g. the API Reference section after the
   * `openapi` config is removed mid-watch). Only files that still contain the
   * generated redirect are deleted, so a hand-written page that has taken
   * over the slug is never touched. Fresh processes start clean anyway -
   * init() wipes app/ - so in-session tracking is enough.
   */
  private async cleanupStaleSectionIndexPages(
    nextSlugs: Set<string>,
  ): Promise<void> {
    for (const stale of this.generatedSectionIndexSlugs) {
      if (nextSlugs.has(stale)) continue;
      const pagePath = resolveOutputPath(
        this.outputDir,
        "app",
        "(site)",
        stale,
        "page.tsx",
      );
      try {
        if (!(await fs.pathExists(pagePath))) continue;
        const content = await fs.readFile(pagePath, "utf8");
        if (!content.includes("function SectionIndex()")) continue;
        await fs.remove(pagePath);
        await this.removeEmptyDirsUpTo(
          path.dirname(pagePath),
          this.outputPath("app", "(site)"),
        );
        console.log(
          chalk.blue(`🧹 Removed stale section index redirect: /${stale}`),
        );
      } catch {
        // ignore
      }
    }
    this.generatedSectionIndexSlugs = nextSlugs;
  }

  /** Best-effort removal of now-empty directories up to (not incl.) stopDir. */
  private async removeEmptyDirsUpTo(
    dir: string,
    stopDir: string,
  ): Promise<void> {
    const stop = path.resolve(stopDir);
    let current = path.resolve(dir);
    while (current !== stop && current.startsWith(stop + path.sep)) {
      try {
        const entries = await fs.readdir(current);
        if (entries.length > 0) return;
        await fs.remove(current);
      } catch {
        return;
      }
      current = path.dirname(current);
    }
  }

  async generatePageFromMDX(
    mdxFile: MDXFile,
    options?: { apiOperation?: OperationDescriptor },
  ) {
    const fm = mdxFile.frontmatter;
    const apiOperation = options?.apiOperation;

    // Pages containing <Update> blocks publish a subscribable changelog: an
    // RSS feed at {page-url}/rss.xml. Synthetic OpenAPI pages never contain
    // Update blocks, so skip the parse for them.
    const isSynthetic = mdxFile.path.startsWith("@openapi/");
    const updates = isSynthetic ? [] : parseUpdateBlocks(mdxFile.content);
    const hasFeed = updates.length > 0;
    const feedPath = `/${mdxFile.slug}/rss.xml`;

    const metadataBlock = generateMetadataBlock({
      title: fm.title,
      titleFallback: "Generated with Doccupine",
      name: fm.name,
      titleOrder: "page-first",
      description: fm.description,
      icon: fm.icon,
      image: fm.image,
      canonicalPath: mdxFile.slug,
      rssPath: hasFeed ? feedPath : undefined,
    });

    const jsonLd = generateJsonLdScript({
      kind: "article",
      canonicalPath: mdxFile.slug,
      title: fm.title,
      description: fm.description,
      date: typeof fm.date === "string" ? fm.date : undefined,
      updated:
        typeof fm.updated === "string"
          ? fm.updated
          : typeof fm.date === "string"
            ? fm.date
            : undefined,
      image: fm.image,
    });

    // For an OpenAPI-backed page, embed the operation descriptor as a JS string
    // literal parsed at load. Serializing to JSON then re-`JSON.parse`ing is
    // total escaping for arbitrary JSON - unlike `escapeTemplateContent`, which
    // only guards backticks/`${`/backslashes for the MDX prose literal.
    const apiImport = apiOperation
      ? `\nimport { ApiPlayground } from "@/components/layout/ApiPlayground";`
      : "";
    // The descriptor JSON always exceeds the 80-col print width, so emit the
    // call pre-wrapped in the exact shape Prettier produces (argument on its own
    // line with a trailing comma, single-quoted so the JSON's own double quotes
    // need no escaping). Keeps generated endpoint pages Prettier-stable without
    // running a formatter at build time.
    const apiConst = apiOperation
      ? (() => {
          const arg = toJsStringLiteral(JSON.stringify(apiOperation));
          const inline = `const operation = JSON.parse(${arg});`;
          const decl =
            inline.length <= 80
              ? inline
              : `const operation = JSON.parse(\n  ${arg},\n);`;
          return `\n${decl}\n`;
        })()
      : "";
    // The playground renders as a child of <Docs> so it sits inside the docs
    // content column (a sibling would escape the layout and overlap the nav).
    // Synthetic endpoint pages pass no `sourcePath`: it only namespaces Mermaid
    // diagrams (which endpoint docs never contain), and its long `@openapi/...`
    // value would push the opening tag past 80 cols and make Prettier rewrap it.
    const sourcePathLiteral = JSON.stringify(mdxFile.path);
    // `rss: true` frontmatter opts the page into an RSS button in the action
    // bar (only when a feed actually exists). The playground branch keeps its
    // fixed JSX shape - a feed on an inline-playground page stays reachable
    // via autodiscovery. The buttoned form usually exceeds the 80-col print
    // width, so pre-wrap it in the shape Prettier produces (attributes on
    // their own lines) relative to its 6-space insertion indent.
    const showRssButton = hasFeed && fm.rss === true && !apiOperation;
    const docsAttrs = [
      `content={content}`,
      `sourcePath={${sourcePathLiteral}}`,
      ...(showRssButton ? [`rssHref={${JSON.stringify(feedPath)}}`] : []),
    ];
    const inlineDocs = `<Docs ${docsAttrs.join(" ")} />`;
    const docsElement = apiOperation
      ? `<Docs content={content}>
        <ApiPlayground operation={operation} />
      </Docs>`
      : inlineDocs.length + 6 <= 80
        ? inlineDocs
        : `<Docs\n${docsAttrs.map((attr) => `        ${attr}`).join("\n")}\n      />`;

    const pageContent = `import { Metadata } from "next";
import { Docs } from "@/components/Docs";
import { config } from "@/utils/config";${apiImport}

const content = \`${escapeTemplateContent(mdxFile.content)}\`;
${apiConst}
${metadataBlock}

// Doc pages have no per-request data: theme resolves client-side via the
// "dark" class on <html> (set before paint by the theme-init blocking
// script). Static rendering lets every response come from the edge cache.
export const dynamic = "force-static";
export const revalidate = false;

export default function Page() {
  ${jsonLd.declarations}

  return (
    <>
      ${jsonLd.element}
      ${docsElement}
    </>
  );
}
`;

    const pagePath = resolveOutputPath(
      this.outputDir,
      "app",
      "(site)",
      mdxFile.slug,
      "page.tsx",
    );
    await fs.ensureDir(path.dirname(pagePath));
    await writeFileAtomic(pagePath, pageContent);

    // The feed route lives inside the page's directory, so a deleted page
    // takes its feed along (handleFileDelete removes the whole dir) and the
    // else-branch prunes the route when a regenerated page no longer has
    // Update blocks. Cross-run staleness is covered by the app/ wipe in
    // createNextJSStructure.
    if (!isSynthetic) {
      const rssDir = resolveOutputPath(path.dirname(pagePath), "rss.xml");
      if (hasFeed) {
        await fs.ensureDir(rssDir);
        await writeFileAtomic(
          resolveOutputPath(path.dirname(pagePath), "rss.xml", "route.ts"),
          rssRouteTemplate({
            pagePath: mdxFile.slug,
            title: typeof fm.title === "string" ? fm.title : null,
            description:
              typeof fm.description === "string" ? fm.description : null,
            items: updates.map((update) => ({
              title: update.label,
              anchor: update.anchor,
              description: update.description,
            })),
          }),
        );
      } else {
        await fs.remove(rssDir);
      }
    }
  }

  /** Parses the configured OpenAPI spec(s) into the shared registry. */
  private async loadOpenApiRegistry(): Promise<void> {
    if (this.openApiSpecs.length === 0) return;
    await this.apiRegistry.load(
      this.openApiSpecs,
      this.rootDir,
      this.apiBaseSlug,
    );
    if (!this.apiRegistry.isEmpty) {
      console.log(
        chalk.blue(
          `📘 Loaded ${this.apiRegistry.all.length} API endpoint(s) from ${this.openApiSpecs.length} spec(s)`,
        ),
      );
    }
  }

  /**
   * Generates one page per OpenAPI operation, (re)writes the request-execution
   * allowlist consumed by the playground proxy + component, and removes endpoint
   * pages that no longer exist in the spec. Safe to call when there are no specs
   * - it still emits an empty allowlist and prunes any previously generated
   * pages (e.g. after the `openapi` config is removed).
   */
  private async writeApiPages(): Promise<void> {
    const realSlugs = new Set(
      (await this.buildRealPagesMeta()).map((page) => page.slug),
    );
    const nextRoutes = new Map<string, string>();

    const indexPage = this.apiRegistry
      .syntheticPages()
      .find((page) => page.slug === this.apiBaseSlug);
    if (indexPage && !realSlugs.has(indexPage.slug)) {
      try {
        await this.generatePageFromMDX({
          path: indexPage.path,
          content: this.apiRegistry.bodyForSlug(indexPage.slug) ?? "",
          frontmatter: {
            title: indexPage.title,
            description: indexPage.description,
          },
          slug: indexPage.slug,
        });
        nextRoutes.set(`@openapi/${indexPage.slug}`, indexPage.slug);
      } catch (error) {
        console.error(
          chalk.red(`❌ Error generating API index ${indexPage.slug}:`),
          error,
        );
      }
    }

    for (const op of this.apiRegistry.all) {
      const methodUpper = op.method.toUpperCase();
      const mdxFile: MDXFile = {
        path: `@openapi/${op.specName}/${op.method}${op.path}`,
        content: buildEndpointDoc(op),
        frontmatter: {
          title: op.summary ?? `${methodUpper} ${op.path}`,
          description: op.summary ?? "",
        },
        slug: op.slug,
      };
      if (realSlugs.has(op.slug)) {
        console.log(
          chalk.yellow(
            `⚠️ API page ${op.slug} is shadowed by a hand-written page; skipping`,
          ),
        );
        continue;
      }
      try {
        await this.generatePageFromMDX(mdxFile, { apiOperation: op });
        nextRoutes.set(`@openapi/${op.slug}`, op.slug);
      } catch (error) {
        console.error(
          chalk.red(`❌ Error generating API page ${op.slug}:`),
          error,
        );
      }
    }

    await this.writeApiAllowlist();
    await this.cleanupStaleApiPages(nextRoutes, realSlugs);

    if (this.apiRegistry.all.length > 0) {
      console.log(
        chalk.green(`🧩 Generated ${nextRoutes.size} API reference page(s)`),
      );
    }
  }

  /** Writes the request-execution allowlist (overwrites the shipped stub). */
  private async writeApiAllowlist(): Promise<void> {
    const target = this.outputPath(
      "services",
      "openapi",
      "playground-allowlist.json",
    );
    await fs.ensureDir(path.dirname(target));
    await writeFileAtomic(
      target,
      `${JSON.stringify(this.apiRegistry.allowlist(), null, 2)}\n`,
    );
  }

  /** Removes endpoint page directories that are no longer in the spec. */
  private async cleanupStaleApiPages(
    nextRoutes: Map<string, string>,
    realSlugs: Set<string>,
  ): Promise<void> {
    const nextSlugs = new Set(nextRoutes.values());
    for (const previous of this.artifacts.routesFor("openapi")) {
      if (nextRoutes.has(previous.source) || nextSlugs.has(previous.slug))
        continue;
      // A hand-written page may have taken ownership of this route since the
      // previous OpenAPI pass. Never remove an output now claimed by MDX.
      if (realSlugs.has(previous.slug)) continue;
      try {
        await this.removeOwnedRoute(previous.slug);
      } catch {
        // ignore
      }
    }

    this.artifacts.replaceRoutes(
      "openapi",
      [...nextRoutes].map(([source, slug]) => ({ source, slug })),
    );
    await this.artifacts.save();
  }

  /**
   * (Re)points the spec-file watcher at the currently configured spec paths.
   * Called at startup and whenever doccupine.json changes the `openapi` set,
   * so specs added mid-session are watched without a restart.
   */
  private async syncOpenApiSpecWatcher(): Promise<void> {
    if (this.openApiWatcher) {
      await this.openApiWatcher.close();
      this.openApiWatcher = null;
    }
    if (this.openApiSpecs.length === 0) return;

    const specPaths = this.openApiSpecs.map((spec) =>
      path.resolve(this.rootDir, spec.file),
    );

    this.openApiWatcher = chokidar.watch(specPaths, {
      persistent: true,
      ignoreInitial: true,
    });

    this.openApiWatcher
      .on("add", () =>
        this.enqueueMutation("Error rebuilding API reference", () =>
          this.handleOpenApiChange(),
        ),
      )
      .on("change", () =>
        this.enqueueMutation("Error rebuilding API reference", () =>
          this.handleOpenApiChange(),
        ),
      )
      .on("unlink", () =>
        this.enqueueMutation("Error rebuilding API reference", () =>
          this.handleOpenApiChange(),
        ),
      )
      .on("error", (error: unknown) => {
        console.error(chalk.red("❌ OpenAPI watcher error:"), error);
      });
  }

  /**
   * Reparses the spec(s) and rewrites everything derived from them: the
   * endpoint pages and allowlist, the sections (the "API Reference" section
   * appears and disappears with the registry), and the site aggregates.
   */
  private async rebuildApiReference(): Promise<void> {
    await this.apiRegistry.load(
      this.openApiSpecs,
      this.rootDir,
      this.apiBaseSlug,
    );
    this.sectionsConfig = await this.resolveSections();
    await this.writeApiPages();
    await this.refreshSiteAggregates();
  }

  /** Reparses the spec(s) and regenerates the API reference on a watch event. */
  async handleOpenApiChange() {
    console.log(
      chalk.cyan("📘 OpenAPI spec changed - regenerating API reference"),
    );
    try {
      await this.rebuildApiReference();
      console.log(chalk.green("✅ API reference updated"));
    } catch (error) {
      console.error(chalk.red("❌ Error updating API reference:"), error);
    }
  }

  /**
   * Applies `openapi` edits in doccupine.json without a restart: reloads the
   * registry, regenerates or prunes the endpoint pages and allowlist,
   * refreshes nav/sitemap/llms, and re-points the spec-file watcher. Other
   * fields (watchDir, outputDir, port) cannot be hot-applied, so a change
   * there only logs a restart hint. Invalid or missing JSON (e.g. a
   * half-written editor save) keeps the current configuration.
   */
  async handleDoccupineConfigChange() {
    const configPath = path.join(this.rootDir, this.doccupineConfigFile);
    let config: DoccupineConfig;
    try {
      config = validateConfig(
        JSON.parse(await fs.readFile(configPath, "utf8")),
        this.rootDir,
      );
    } catch (error) {
      console.warn(
        chalk.yellow(
          "⚠️ doccupine.json is missing or invalid - keeping the current configuration",
        ),
        error instanceof Error ? error.message : error,
      );
      return;
    }

    if (
      (config.watchDir &&
        path.resolve(this.rootDir, config.watchDir) !== this.watchDir) ||
      (config.outputDir &&
        path.resolve(this.rootDir, config.outputDir) !== this.outputDir)
    ) {
      console.log(
        chalk.yellow(
          "⚠️ watchDir/outputDir changes in doccupine.json need a restart to apply",
        ),
      );
    }

    const nextSpecs = normalizeOpenApiConfig(config.openapi);
    if (JSON.stringify(nextSpecs) === JSON.stringify(this.openApiSpecs)) {
      return;
    }

    console.log(
      chalk.cyan("📘 OpenAPI configuration changed - updating API reference"),
    );
    let nextRegistry: OpenApiRegistry;
    try {
      // Validate the complete candidate before changing the active spec list or
      // its watcher. A half-written/invalid replacement keeps both the current
      // generated reference and its live watcher intact.
      nextRegistry = new OpenApiRegistry();
      await nextRegistry.load(nextSpecs, this.rootDir, this.apiBaseSlug);
    } catch (error) {
      console.error(chalk.red("❌ Error updating API reference:"), error);
      return;
    }

    const previousRegistry = this.apiRegistry;
    const previousSpecs = this.openApiSpecs;
    const previousSections = this.sectionsConfig;
    try {
      this.apiRegistry = nextRegistry;
      this.openApiSpecs = nextSpecs;
      await this.syncOpenApiSpecWatcher();
      this.sectionsConfig = await this.resolveSections();
      await this.writeApiPages();
      await this.refreshSiteAggregates();
      console.log(chalk.green("✅ API reference updated"));
    } catch (error) {
      console.error(chalk.red("❌ Error updating API reference:"), error);
      this.apiRegistry = previousRegistry;
      this.openApiSpecs = previousSpecs;
      this.sectionsConfig = previousSections;
      try {
        await this.syncOpenApiSpecWatcher();
      } catch (rollbackError) {
        console.error(
          chalk.red("❌ Error restoring the previous OpenAPI watcher:"),
          rollbackError,
        );
      }
      try {
        await this.writeApiPages();
        await this.refreshSiteAggregates();
      } catch (rollbackError) {
        console.error(
          chalk.red("❌ Error restoring previous API reference output:"),
          rollbackError,
        );
      }
    }
  }

  async updatePagesIndex() {
    const files = await this.getAllMDXFiles();
    let indexMDX: {
      content: string;
      title: string;
      description: string;
      icon?: string;
      image?: string;
      name?: string;
      date?: string;
      updated?: string;
      openapi?: string;
      rss?: boolean;
    } | null = null;

    for (const file of files) {
      if (file === "index.mdx" || file === "./index.mdx") {
        const { content } = await this.readMdxSourceFile(file);
        const { data: frontmatter, content: mdxContent } = safeMatter(
          content,
          file,
        );

        indexMDX = {
          content: mdxContent,
          title: frontmatter.title || "Welcome",
          description: frontmatter.description || "",
          icon: frontmatter.icon,
          image: frontmatter.image,
          name: frontmatter.name,
          date:
            typeof frontmatter.date === "string" ? frontmatter.date : undefined,
          updated:
            typeof frontmatter.updated === "string"
              ? frontmatter.updated
              : undefined,
          openapi:
            typeof frontmatter.openapi === "string"
              ? frontmatter.openapi
              : undefined,
          rss: frontmatter.rss === true,
        };
        break;
      }
    }

    // The homepage publishes the same subscribable changelog as any other
    // page (see generatePageFromMDX): <Update> blocks feed the site-root
    // /rss.xml, and `rss: true` frontmatter opts into the RSS button.
    const updates = indexMDX ? parseUpdateBlocks(indexMDX.content) : [];
    const hasFeed = updates.length > 0;
    const feedPath = "/rss.xml";

    const metadataBlock = indexMDX
      ? generateMetadataBlock({
          title: indexMDX.title,
          titleFallback: "Welcome",
          name: indexMDX.name,
          titleOrder: "name-first",
          description: indexMDX.description || undefined,
          icon: indexMDX.icon,
          image: indexMDX.image,
          canonicalPath: "",
          rssPath: hasFeed ? feedPath : undefined,
        })
      : generateRuntimeOnlyMetadataBlock();

    const homeJsonLd = generateJsonLdScript({
      kind: "homepage",
      canonicalPath: "",
      title: indexMDX?.title,
      description: indexMDX?.description || undefined,
      date: indexMDX?.date,
      updated: indexMDX?.updated ?? indexMDX?.date,
      image: indexMDX?.image,
    });

    // The homepage supports the same `openapi: <METHOD> <path>` frontmatter as
    // any other page: look the operation up and embed its playground inline.
    let apiOperation: OperationDescriptor | undefined;
    if (indexMDX?.openapi) {
      apiOperation = this.apiRegistry.lookup(indexMDX.openapi);
      if (!apiOperation) {
        console.error(
          chalk.red(
            `❌ openapi frontmatter "${indexMDX.openapi}" in index.mdx not found in any spec`,
          ),
        );
      }
    }
    const apiImport = apiOperation
      ? `\nimport { ApiPlayground } from "@/components/layout/ApiPlayground";`
      : "";
    const apiConst = apiOperation
      ? `\nconst operation = JSON.parse(${JSON.stringify(
          JSON.stringify(apiOperation),
        )});\n`
      : "";
    // Same gating as generatePageFromMDX: the playground branch keeps its
    // fixed JSX shape, so a feed on a playground homepage stays reachable via
    // autodiscovery. The buttoned inline form stays within the 80-col print
    // width at its 6-space insertion indent, so it is Prettier-stable as is.
    const showRssButton = hasFeed && indexMDX?.rss === true && !apiOperation;
    const docsElement = apiOperation
      ? `<Docs content={content} sourcePath="index.mdx">
        <ApiPlayground operation={operation} />
      </Docs>`
      : showRssButton
        ? `<Docs content={content} sourcePath="index.mdx" rssHref={"/rss.xml"} />`
        : `<Docs content={content} sourcePath="index.mdx" />`;

    const indexContent = `import { Metadata } from "next";
import { Docs } from "@/components/Docs";
import { config } from "@/utils/config";${apiImport}

${indexMDX ? `const content = \`${escapeTemplateContent(indexMDX.content)}\`;` : `const content = null;`}
${apiConst}
${metadataBlock}

export const dynamic = "force-static";
export const revalidate = false;

export default function Home() {
  ${homeJsonLd.declarations}

  return (
    <>
      ${homeJsonLd.element}
      ${docsElement}
    </>
  );
}
`;

    const homePath = this.outputPath("app", "(site)", "page.tsx");
    await fs.ensureDir(path.dirname(homePath));
    await writeFileAtomic(homePath, indexContent);

    // Same lifecycle as the per-page feeds in generatePageFromMDX: write the
    // root feed route while the homepage has Update blocks, prune it when
    // they go away or index.mdx is deleted (this runs on every aggregate
    // refresh, including the delete path).
    const rssDir = this.outputPath("app", "(site)", "rss.xml");
    if (hasFeed && indexMDX) {
      await fs.ensureDir(rssDir);
      await writeFileAtomic(
        this.outputPath("app", "(site)", "rss.xml", "route.ts"),
        rssRouteTemplate({
          pagePath: "",
          title: indexMDX.title,
          description: indexMDX.description || null,
          items: updates.map((update) => ({
            title: update.label,
            anchor: update.anchor,
            description: update.description,
          })),
        }),
      );
    } else {
      await fs.remove(rssDir);
    }
  }

  async updateSectionIndex(
    sectionSlug: string,
    frontmatter: Record<string, any>,
    mdxContent: string,
    sourcePath?: string,
  ) {
    // This overwrites the page generatePageFromMDX just wrote for the same
    // slug (section landings compose their metadata name-first), so the RSS
    // state must be re-derived here or the overwrite silently drops the
    // button and autodiscovery - the feed route survives either way since it
    // lives in a sibling rss.xml/ dir.
    const updates = parseUpdateBlocks(mdxContent);
    const hasFeed = updates.length > 0;
    const feedPath = `/${sectionSlug}/rss.xml`;
    const showRssButton = hasFeed && frontmatter.rss === true;

    const metadataBlock = generateMetadataBlock({
      title: frontmatter.title,
      titleFallback: "Section",
      name: frontmatter.name,
      titleOrder: "name-first",
      description: frontmatter.description || undefined,
      icon: frontmatter.icon,
      image: frontmatter.image,
      canonicalPath: sectionSlug,
      rssPath: hasFeed ? feedPath : undefined,
    });

    const sectionJsonLd = generateJsonLdScript({
      kind: "article",
      canonicalPath: sectionSlug,
      title: frontmatter.title,
      description: frontmatter.description,
      date: typeof frontmatter.date === "string" ? frontmatter.date : undefined,
      updated:
        typeof frontmatter.updated === "string"
          ? frontmatter.updated
          : typeof frontmatter.date === "string"
            ? frontmatter.date
            : undefined,
      image: frontmatter.image,
    });

    // Same Prettier pre-wrap contract as generatePageFromMDX: the buttoned
    // form usually pushes the line past the 80-col print width, so emit it
    // with attributes on their own lines relative to the 6-space indent.
    const docsAttrs = [
      `content={content}`,
      `sourcePath={${JSON.stringify(sourcePath ?? `${sectionSlug}/index.mdx`)}}`,
      ...(showRssButton ? [`rssHref={${JSON.stringify(feedPath)}}`] : []),
    ];
    const inlineDocs = `<Docs ${docsAttrs.join(" ")} />`;
    const docsElement =
      inlineDocs.length + 6 <= 80
        ? inlineDocs
        : `<Docs\n${docsAttrs.map((attr) => `        ${attr}`).join("\n")}\n      />`;

    const indexContent = `import { Metadata } from "next";
import { Docs } from "@/components/Docs";
import { config } from "@/utils/config";

const content = \`${escapeTemplateContent(mdxContent)}\`;

${metadataBlock}

export const dynamic = "force-static";
export const revalidate = false;

export default function Page() {
  ${sectionJsonLd.declarations}

  return (
    <>
      ${sectionJsonLd.element}
      ${docsElement}
    </>
  );
}
`;

    const pagePath = resolveOutputPath(
      this.outputDir,
      "app",
      "(site)",
      sectionSlug,
      "page.tsx",
    );
    await fs.ensureDir(path.dirname(pagePath));
    await writeFileAtomic(pagePath, indexContent);
  }

  async updateRootLayout(pages?: PageMeta[]) {
    await writeFileAtomic(
      this.outputPath("app", "layout.tsx"),
      await this.generateRootLayout(),
    );
    const siteLayoutPath = this.outputPath("app", "(site)", "layout.tsx");
    await fs.ensureDir(path.dirname(siteLayoutPath));
    await writeFileAtomic(siteLayoutPath, await this.generateSiteLayout(pages));
  }

  async loadSiteUrl(): Promise<string | null> {
    const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (fromEnv) return fromEnv.replace(/\/$/, "");

    const configPath = path.join(this.rootDir, "config.json");

    try {
      if (await fs.pathExists(configPath)) {
        const content = await fs.readFile(configPath, "utf8");
        const parsed = JSON.parse(content) as { url?: unknown };
        if (typeof parsed.url === "string" && parsed.url.trim() !== "") {
          return parsed.url.trim().replace(/\/$/, "");
        }
      }
    } catch (error) {
      console.warn(chalk.yellow("⚠️ Error reading config.json"), error);
    }

    return null;
  }

  private buildSitemapEntries(pages: PageMeta[]): SitemapEntry[] {
    const sectionSlugs = new Set(
      (this.sectionsConfig || [])
        .map((s) => s.slug)
        .filter((s): s is string => typeof s === "string" && s !== ""),
    );

    const entries: SitemapEntry[] = pages.map((page) => {
      let priority = 0.5;
      if (page.slug === "") {
        priority = 1.0;
      } else if (sectionSlugs.has(page.slug)) {
        priority = 0.8;
      }
      return {
        slug: page.slug,
        lastModified: page.lastModified,
        changeFrequency: "weekly",
        priority,
      };
    });

    if (!entries.some((entry) => entry.slug === "")) {
      entries.unshift({
        slug: "",
        changeFrequency: "weekly",
        priority: 1.0,
      });
    }

    return entries;
  }

  async updateSitemap(pages?: PageMeta[]) {
    const sitemapPath = this.outputPath("app", "sitemap.ts");
    const siteUrl = await this.loadSiteUrl();

    const resolvedPages = pages ?? (await this.buildAllPagesMeta());
    const entries = this.buildSitemapEntries(resolvedPages);
    await writeFileAtomic(sitemapPath, sitemapTemplate(entries));
    console.log(
      chalk.green(
        `🗺️ Generated sitemap.ts with ${entries.length} page(s)${
          siteUrl ? ` using ${siteUrl}` : " (waiting for a deployment URL)"
        }`,
      ),
    );
  }

  async updateRobots() {
    const siteUrl = await this.loadSiteUrl();
    await writeFileAtomic(this.outputPath("app", "robots.ts"), robotsTemplate);
    console.log(
      chalk.green(
        siteUrl
          ? `🤖 Regenerated robots.ts with sitemap link`
          : `🤖 Regenerated robots.ts (no sitemap link)`,
      ),
    );
  }

  private async loadSiteMetadata(): Promise<{
    url: string | null;
    name: string;
    description: string;
  }> {
    const configPath = path.join(this.rootDir, "config.json");
    let url: string | null = null;
    let name = "Documentation";
    let description = "";

    try {
      const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
      if (fromEnv) url = fromEnv.replace(/\/$/, "");
      if (await fs.pathExists(configPath)) {
        const content = await fs.readFile(configPath, "utf8");
        const parsed = JSON.parse(content) as {
          url?: unknown;
          name?: unknown;
          title?: unknown;
          description?: unknown;
        };
        if (
          !url &&
          typeof parsed.url === "string" &&
          parsed.url.trim() !== ""
        ) {
          url = parsed.url.trim().replace(/\/$/, "");
        }
        if (typeof parsed.name === "string" && parsed.name.trim() !== "") {
          name = parsed.name.trim();
        } else if (
          typeof parsed.title === "string" &&
          parsed.title.trim() !== ""
        ) {
          name = parsed.title.trim();
        }
        if (
          typeof parsed.description === "string" &&
          parsed.description.trim() !== ""
        ) {
          description = parsed.description.trim();
        }
      }
    } catch (error) {
      console.warn(
        chalk.yellow("⚠️ Error reading config.json for llms metadata"),
        error,
      );
    }

    return { url, name, description };
  }

  private async readPageWithBody(page: PageMeta): Promise<PageWithBody> {
    // Synthetic OpenAPI pages have no backing .mdx file; their markdown body
    // comes from the registry instead of disk.
    if (!page.path.endsWith(".mdx")) {
      return { ...page, body: this.apiRegistry.bodyForSlug(page.slug) ?? "" };
    }
    const { content: raw } = await this.readMdxSourceFile(page.path);
    const { content: body } = safeMatter(raw, page.path);
    return { ...page, body };
  }

  private async findSourcePublicAsset(
    relativePath: string,
  ): Promise<string | null> {
    const sourcePublicDir = path.join(this.rootDir, "public");
    const normalized = relativePath.replace(/\\/g, "/");
    resolveWithin(sourcePublicDir, normalized);

    let rootStat: fs.Stats;
    try {
      rootStat = await fs.lstat(sourcePublicDir);
    } catch (error) {
      if (errorCode(error) === "ENOENT") return null;
      throw error;
    }
    if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
      throw this.sourcePathError(
        "public source",
        sourcePublicDir,
        "the public source root must be a real directory",
      );
    }
    const realPublicDir = await this.realSourceRoot(
      sourcePublicDir,
      "public source",
      true,
    );

    let currentPath = sourcePublicDir;
    const parts = normalized.split("/").filter(Boolean);
    for (const [index, part] of parts.entries()) {
      let entries: string[];
      try {
        entries = await fs.readdir(currentPath);
      } catch {
        return null;
      }
      const actualName =
        entries.find((entry) => entry === part) ??
        entries.find((entry) => entry.toLowerCase() === part.toLowerCase());
      if (!actualName) return null;
      currentPath = path.join(currentPath, actualName);
      const stat = await fs.lstat(currentPath);
      if (stat.isSymbolicLink()) {
        throw this.sourcePathError(
          "public source",
          currentPath,
          "the path is a symbolic link",
        );
      }
      if (index < parts.length - 1 && !stat.isDirectory()) return null;
    }

    const stat = await fs.lstat(currentPath);
    if (!stat.isFile()) return null;
    const realPath = await fs.realpath(currentPath);
    if (!isPathInside(realPublicDir, realPath)) {
      throw this.sourcePathError(
        "public source",
        currentPath,
        `the real path ${realPath} is outside ${realPublicDir}`,
      );
    }
    return currentPath;
  }

  private async writePublicAggregate(
    relativePath: string,
    content: string,
  ): Promise<void> {
    const sourcePath = await this.findSourcePublicAsset(relativePath);
    const targetPath = this.publicOutputFilePath(relativePath);
    if (sourcePath) {
      console.warn(
        chalk.yellow(
          `⚠️ Skipping generated public/${relativePath}; a project public asset owns that path`,
        ),
      );
      await this.copyRegularPublicFile(
        path.join(this.rootDir, "public"),
        sourcePath,
        targetPath,
      );
      return;
    }

    await fs.ensureDir(path.dirname(targetPath));
    await writeFileAtomic(targetPath, content);
  }

  async updateLlmsFiles(pages?: PageMeta[]) {
    const publicDir = this.outputPath("public");
    await fs.ensureDir(publicDir);

    const { url: baseUrl, name, description } = await this.loadSiteMetadata();
    const resolvedPages = pages ?? (await this.buildAllPagesMeta());
    const pagesWithBodies = await Promise.all(
      resolvedPages.map((page) => this.readPageWithBody(page)),
    );
    const docsContent = pagesWithBodies.map((page) => {
      const route = page.slug.replace(/^\/+|\/+$/g, "");
      const pagePath = route
        ? `app/(site)/${route}/page.tsx`
        : "app/(site)/page.tsx";
      return {
        uri: `docs://${route || "/"}`,
        name: page.title,
        path: pagePath,
        content: page.body,
      };
    });
    await writeFileAtomic(
      this.outputPath("services", "mcp", "docs-content.json"),
      JSON.stringify(docsContent, null, 2) + "\n",
    );

    const indexContent = llmsIndexTemplate({
      siteName: name,
      siteDescription: description,
      baseUrl,
      pages: resolvedPages,
      sectionsConfig: this.sectionsConfig,
    });
    const fullContent = llmsFullTemplate({
      siteName: name,
      siteDescription: description,
      baseUrl,
      pages: pagesWithBodies,
      sectionsConfig: this.sectionsConfig,
    });

    await this.writePublicAggregate("llms.txt", indexContent);
    await this.writePublicAggregate("llms-full.txt", fullContent);

    const skillContent = skillMdTemplate({
      siteName: name,
      siteDescription: description,
      baseUrl,
      pages: resolvedPages,
      sectionsConfig: this.sectionsConfig,
    });
    await this.writePublicAggregate("skill.md", skillContent);

    // MCP discovery manifest. Needs an absolute URL, so it only exists when
    // config.json declares the site url; it is pruned if the url is removed.
    const mcpRelativePath = ".well-known/mcp.json";
    const mcpJsonPath = this.publicOutputFilePath(mcpRelativePath);
    const sourceMcpJsonPath = await this.findSourcePublicAsset(mcpRelativePath);
    if (sourceMcpJsonPath) {
      console.warn(
        chalk.yellow(
          `⚠️ Skipping generated public/${mcpRelativePath}; a project public asset owns that path`,
        ),
      );
      await this.copyRegularPublicFile(
        path.join(this.rootDir, "public"),
        sourceMcpJsonPath,
        mcpJsonPath,
      );
    } else if (baseUrl) {
      const mcpJson =
        JSON.stringify(
          {
            mcpServers: {
              [siteDocsSlug(name)]: {
                url: `${baseUrl}/api/mcp`,
                transport: "streamable-http",
              },
            },
          },
          null,
          2,
        ) + "\n";
      await fs.ensureDir(path.dirname(mcpJsonPath));
      await writeFileAtomic(mcpJsonPath, mcpJson);
    } else if (await fs.pathExists(mcpJsonPath)) {
      await fs.remove(mcpJsonPath);
    }

    const nextRelativePaths = new Set<string>();
    await Promise.all(
      pagesWithBodies.map(async (page) => {
        const relPath = page.slug === "" ? "index.md" : `${page.slug}.md`;
        if (isPublicAggregate(relPath)) return;
        const sourceAssetPath = await this.findSourcePublicAsset(relPath);
        if (sourceAssetPath) {
          console.warn(
            chalk.yellow(
              `⚠️ Skipping generated public/${relPath}; a project public asset owns that path`,
            ),
          );
          const targetPath = this.publicOutputFilePath(relPath);
          await this.copyRegularPublicFile(
            path.join(this.rootDir, "public"),
            sourceAssetPath,
            targetPath,
          );
          return;
        }
        const targetPath = this.publicOutputFilePath(relPath);
        await fs.ensureDir(path.dirname(targetPath));
        await writeFileAtomic(targetPath, llmsPageTemplate(page, baseUrl));
        nextRelativePaths.add(relPath);
      }),
    );

    const previousRelativePaths = this.artifacts.llmsPageFiles();

    for (const stale of previousRelativePaths) {
      if (!nextRelativePaths.has(stale)) {
        try {
          if (isPublicAggregate(stale)) continue;
          if (await this.findSourcePublicAsset(stale)) continue;
          const stalePath = resolveOutputPath(publicDir, stale);
          if (await fs.pathExists(stalePath)) {
            await fs.remove(stalePath);
          }
        } catch {
          // ignore
        }
      }
    }
    this.artifacts.replaceLlmsPageFiles(nextRelativePaths);
    await this.artifacts.save();

    console.log(
      chalk.green(
        `🤖 Generated llms.txt and llms-full.txt with ${resolvedPages.length} page(s)${
          baseUrl ? ` using ${baseUrl}` : " (relative URLs)"
        }`,
      ),
    );
  }

  async stop() {
    if (this.watcher) {
      await this.watcher.close();
      console.log(chalk.yellow("👋 Stopped watching for MDX changes"));
    }
    if (this.configWatcher) {
      await this.configWatcher.close();
      console.log(chalk.yellow("👋 Stopped watching for config changes"));
    }
    if (this.fontWatcher) {
      await this.fontWatcher.close();
      console.log(chalk.yellow("👋 Stopped watching for font config changes"));
    }
    if (this.analyticsWatcher) {
      await this.analyticsWatcher.close();
      console.log(
        chalk.yellow("👋 Stopped watching for analytics config changes"),
      );
    }
    if (this.openApiWatcher) {
      await this.openApiWatcher.close();
      console.log(chalk.yellow("👋 Stopped watching for OpenAPI spec changes"));
    }
    if (this.doccupineConfigWatcher) {
      await this.doccupineConfigWatcher.close();
      console.log(
        chalk.yellow("👋 Stopped watching for doccupine.json changes"),
      );
    }
    if (this.publicWatcher) {
      await this.publicWatcher.close();
      console.log(
        chalk.yellow("👋 Stopped watching for public directory changes"),
      );
    }
    if (this.rootDirWatcher) {
      await this.rootDirWatcher.close();
    }
    await this.mutationQueue;
  }
}
