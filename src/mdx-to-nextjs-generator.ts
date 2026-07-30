import fs from "fs-extra";
import path from "path";

import chalk from "chalk";

import { rootLayoutTemplate, siteLayoutTemplate } from "./lib/layout.js";
import {
  normalizeOpenApiConfig,
  validateConfig,
} from "./lib/config-manager.js";
import { GeneratedArtifacts } from "./lib/generated-artifacts.js";
import {
  claimOutputDirectory,
  resolveOutputPath,
} from "./lib/output-safety.js";
import { OpenApiRegistry, DEFAULT_API_BASE_SLUG } from "./lib/openapi.js";
import { getFullSlug, safeMatter, writeFileAtomic } from "./lib/utils.js";
import { nextConfigTemplate } from "./templates/next.config.js";
import { proxyTemplate } from "./templates/proxy.js";
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
import { SecureSourceFs } from "./generator/secure-source-fs.js";
import { AppScaffolder } from "./generator/app-scaffolder.js";
import { ApiReferenceGenerator } from "./generator/api-reference-generator.js";
import { GeneratedRouteManager } from "./generator/generated-route-manager.js";
import { ProjectConfigRepository } from "./generator/project-config-repository.js";
import { PublicAssetManager } from "./generator/public-asset-manager.js";
import { WatchCoordinator } from "./generator/watch-coordinator.js";
import {
  addApiReferenceSection,
  determineSectionRoute,
  discoverSections,
} from "./generator/section-resolver.js";
import {
  renderHomepage,
  renderMdxPage,
  renderSectionPage,
  type HomepageSource,
} from "./generator/page-renderer.js";
import {
  buildRealPagesMeta as buildRealPageCatalog,
  mergePages as mergePageCatalog,
  parseMdxPageMeta,
} from "./generator/page-catalog.js";
import {
  loadSiteMetadata,
  loadSiteUrl as loadSiteUrlArtifact,
  writeLlmsFiles,
  writeRobots,
  writeSitemap,
} from "./generator/site-artifacts.js";

export class MDXToNextJSGenerator {
  private watchDir: string;
  private outputDir: string;
  private rootDir: string;
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
  private sourceFs: SecureSourceFs;
  private appScaffolder: AppScaffolder;
  private apiReferenceGenerator: ApiReferenceGenerator;
  private generatedRouteManager: GeneratedRouteManager;
  private projectConfigRepository: ProjectConfigRepository;
  private publicAssetManager: PublicAssetManager;
  private watchCoordinator: WatchCoordinator;

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
    this.sourceFs = new SecureSourceFs(this.watchDir, this.rootDir);
    this.appScaffolder = new AppScaffolder(this.outputDir);
    this.apiReferenceGenerator = new ApiReferenceGenerator(
      this.outputDir,
      this.artifacts,
    );
    this.generatedRouteManager = new GeneratedRouteManager(
      this.outputDir,
      this.artifacts,
    );
    this.projectConfigRepository = new ProjectConfigRepository(
      this.rootDir,
      this.outputDir,
      this.sourceFs,
      this.configFiles,
      this.fontConfigFile,
      this.analyticsConfigFile,
    );
    this.publicAssetManager = new PublicAssetManager(
      this.rootDir,
      this.outputDir,
      this.artifacts,
      this.sourceFs,
    );
    this.watchCoordinator = new WatchCoordinator({
      watchDir: this.watchDir,
      rootDir: this.rootDir,
      configFiles: this.configFiles,
      fontConfigFile: this.fontConfigFile,
      analyticsConfigFile: this.analyticsConfigFile,
      doccupineConfigFile: this.doccupineConfigFile,
      sourceFs: this.sourceFs,
      getOpenApiSpecs: () => this.openApiSpecs,
      callbacks: {
        syncOpenApiSpecWatcher: () => this.syncOpenApiSpecWatcher(),
        handleFileChange: (action, filePath) =>
          this.handleFileChange(action, filePath),
        handleFileDelete: (filePath) => this.handleFileDelete(filePath),
        handleConfigFileChange: (filePath) =>
          this.handleConfigFileChange(filePath),
        handleConfigFileDelete: (filePath) =>
          this.handleConfigFileDelete(filePath),
        handleFontConfigChange: () => this.handleFontConfigChange(),
        handleFontConfigDelete: () => this.handleFontConfigDelete(),
        handleAnalyticsConfigChange: () => this.handleAnalyticsConfigChange(),
        handleAnalyticsConfigDelete: () => this.handleAnalyticsConfigDelete(),
        handleDoccupineConfigChange: () => this.handleDoccupineConfigChange(),
        handleOpenApiChange: () => this.handleOpenApiChange(),
        copyPublicFiles: () => this.copyPublicFiles(),
        handlePublicFileChange: (filePath) =>
          this.handlePublicFileChange(filePath),
        handlePublicFileDelete: (filePath) =>
          this.handlePublicFileDelete(filePath),
        processAllMDXFiles: () => this.processAllMDXFiles(),
      },
    });
  }

  private outputPath(...segments: string[]): string {
    return resolveOutputPath(this.outputDir, ...segments);
  }

  private async readMdxSourceFile(
    filePath: string,
  ): Promise<{ content: string; stat: fs.Stats }> {
    return this.sourceFs.readMdxSourceFile(filePath);
  }

  private async writeStarterFile(
    relativePath: string,
    content: string | Uint8Array,
  ): Promise<void> {
    return this.sourceFs.writeStarterFile(relativePath, content);
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

    await this.watchCoordinator.establishSourceSnapshot();

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
    return this.appScaffolder.createNextJsStructure(this.analyticsConfig, {
      generateRootLayout: () => this.generateRootLayout(),
      generateSiteLayout: () => this.generateSiteLayout(),
      updateSitemap: () => this.updateSitemap(),
      updateLlmsFiles: () => this.updateLlmsFiles(),
    });
  }

  async createStartingDocs() {
    return this.appScaffolder.createStartingDocs({
      getAllMdxFiles: () => this.getAllMDXFiles(),
      writeStarterFile: (filePath, content) =>
        this.writeStarterFile(filePath, content),
    });
  }

  async copyCustomConfigFiles() {
    return this.projectConfigRepository.copyCustomConfigFiles();
  }

  async copyFontConfig() {
    return this.projectConfigRepository.copyFontConfig();
  }

  async loadFontConfig(): Promise<FontConfig | null> {
    return this.projectConfigRepository.loadFontConfig();
  }

  async loadAnalyticsConfig(): Promise<AnalyticsConfig | null> {
    return this.projectConfigRepository.loadAnalyticsConfig();
  }

  async copyAnalyticsConfig() {
    return this.projectConfigRepository.copyAnalyticsConfig(() =>
      this.loadAnalyticsConfig(),
    );
  }

  async loadSectionsConfig(): Promise<SectionConfig[] | null> {
    return this.projectConfigRepository.loadSectionsConfig();
  }

  async discoverSectionsFromFrontmatter(): Promise<SectionConfig[] | null> {
    const files = await this.getAllMDXFiles();
    const documents = [];
    for (const filePath of files) {
      const { content } = await this.readMdxSourceFile(filePath);
      const { data: frontmatter } = safeMatter(content, filePath);
      documents.push({ filePath, frontmatter });
    }
    return discoverSections(documents);
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
    return addApiReferenceSection(
      sections,
      !this.apiRegistry.isEmpty,
      this.apiBaseSlug,
    );
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
    return determineSectionRoute(filePath, frontmatter, this.sectionsConfig);
  }

  async handleConfigFileChange(filePath: string) {
    const fileName = path.basename(filePath);

    if (this.configFiles.includes(fileName)) {
      try {
        await this.projectConfigRepository.copyConfigFile(fileName);
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
      try {
        await this.projectConfigRepository.resetConfigFile(fileName);
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

    try {
      await this.projectConfigRepository.copyFontConfigFile();
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

    try {
      if (await this.projectConfigRepository.removeFontConfig()) {
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

    try {
      this.analyticsConfig = await this.loadAnalyticsConfig();
      await this.projectConfigRepository.writeAnalyticsConfig(
        this.analyticsConfig,
      );
      console.log(
        chalk.green(`📋 Updated ${this.analyticsConfigFile} in Next.js app`),
      );

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

    try {
      // Write empty analytics.json so runtime imports don't break
      await this.projectConfigRepository.resetAnalyticsConfig();

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
    return this.publicAssetManager.copyPublicFiles();
  }

  async handlePublicFileChange(filePath: string) {
    return this.publicAssetManager.handlePublicFileChange(filePath, () =>
      this.updateLlmsFiles(),
    );
  }

  async handlePublicFileDelete(filePath: string) {
    return this.publicAssetManager.handlePublicFileDelete(
      filePath,
      () => this.handlePublicFileChange(filePath),
      () => this.updateLlmsFiles(),
    );
  }

  async startWatching() {
    return this.watchCoordinator.startWatching();
  }

  private async parseMDXFile(file: string): Promise<PageMeta> {
    return parseMdxPageMeta(
      file,
      (filePath) => this.readMdxSourceFile(filePath),
      (filePath, frontmatter) =>
        this.determineSectionForFile(filePath, frontmatter),
      (reference) => this.apiRegistry.lookup(reference)?.method,
    );
  }

  private async buildRealPagesMeta(): Promise<PageMeta[]> {
    const files = await this.getAllMDXFiles();
    return buildRealPageCatalog(files, (file) => this.parseMDXFile(file));
  }

  private async buildAllPagesMeta(): Promise<PageMeta[]> {
    const real = await this.buildRealPagesMeta();
    return mergePageCatalog(
      real,
      this.apiRegistry.isEmpty ? [] : this.apiRegistry.syntheticPages(),
    );
  }

  private async removeOwnedRoute(slug: string): Promise<void> {
    return this.generatedRouteManager.removeOwnedRoute(slug);
  }

  private async removeStaleMdxRoutes(realPages: PageMeta[]): Promise<void> {
    return this.generatedRouteManager.removeStaleMdxRoutes(realPages, (slug) =>
      this.removeOwnedRoute(slug),
    );
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
      const previousSlug =
        this.generatedRouteManager.routeForMdxSource(normalizedSource);
      const realPages = await this.buildRealPagesMeta();
      const currentPage = realPages.find(
        (page) => page.path.replace(/\\/g, "/") === normalizedSource,
      );
      if (previousSlug && previousSlug !== currentPage?.slug)
        await this.removeStaleMdxRoutes(realPages);

      await this.writePageForFile(filePath);
      await this.generatedRouteManager.replaceMdxRoutes(realPages);

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
        const ownedSlug =
          this.generatedRouteManager.routeForMdxSource(normalizedSource);
        if (ownedSlug) await this.removeOwnedRoute(ownedSlug);
        await this.generatedRouteManager.removeMdxRoute(normalizedSource);
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

    await this.generatedRouteManager.replaceMdxRoutes(realPages);

    const pages = await this.buildAllPagesMeta();
    await this.refreshSiteAggregates(pages);
  }

  async getAllMDXFiles(): Promise<string[]> {
    return this.sourceFs.getAllMdxFiles();
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
    const resolvedPages = pages ?? (await this.buildAllPagesMeta());
    const occupiedSlugs = new Set(resolvedPages.map((page) => page.slug));

    if (this.sectionsConfig && this.sectionsConfig.length > 0) {
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

    await this.cleanupStaleSectionIndexPages(nextSlugs, occupiedSlugs);
  }

  /**
   * Removes section index redirects written earlier in this session whose
   * section has since disappeared (e.g. the API Reference section after the
   * `openapi` config is removed mid-watch). Slugs now occupied by real pages
   * are preserved. Fresh processes start clean anyway - init() wipes app/ -
   * so in-session tracking is enough.
   */
  private async cleanupStaleSectionIndexPages(
    nextSlugs: Set<string>,
    occupiedSlugs: Set<string>,
  ): Promise<void> {
    return this.generatedRouteManager.cleanupStaleSectionIndexPages(
      nextSlugs,
      occupiedSlugs,
      (dir, stopDir) => this.removeEmptyDirsUpTo(dir, stopDir),
    );
  }

  /** Best-effort removal of now-empty directories up to (not incl.) stopDir. */
  private async removeEmptyDirsUpTo(
    dir: string,
    stopDir: string,
  ): Promise<void> {
    return this.generatedRouteManager.removeEmptyDirsUpTo(dir, stopDir);
  }

  async generatePageFromMDX(
    mdxFile: MDXFile,
    options?: { apiOperation?: OperationDescriptor },
  ) {
    const rendered = renderMdxPage(mdxFile, options);
    const pagePath = resolveOutputPath(
      this.outputDir,
      "app",
      "(site)",
      mdxFile.slug,
      "page.tsx",
    );
    await fs.ensureDir(path.dirname(pagePath));
    await writeFileAtomic(pagePath, rendered.pageContent);

    // The feed route lives inside the page's directory, so a deleted page
    // takes its feed along (handleFileDelete removes the whole dir) and the
    // else-branch prunes the route when a regenerated page no longer has
    // Update blocks. Cross-run staleness is covered by the app/ wipe in
    // createNextJSStructure.
    if (rendered.rssRoute.action !== "preserve") {
      const rssDir = resolveOutputPath(path.dirname(pagePath), "rss.xml");
      if (rendered.rssRoute.action === "write") {
        await fs.ensureDir(rssDir);
        await writeFileAtomic(
          resolveOutputPath(path.dirname(pagePath), "rss.xml", "route.ts"),
          rendered.rssRoute.content,
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
    const realPages = await this.buildRealPagesMeta();
    return this.apiReferenceGenerator.writePages(
      this.apiRegistry,
      this.apiBaseSlug,
      realPages,
      (mdxFile, options) => this.generatePageFromMDX(mdxFile, options),
      () => this.writeApiAllowlist(),
      (nextRoutes, realSlugs) =>
        this.cleanupStaleApiPages(nextRoutes, realSlugs),
    );
  }

  /** Writes the request-execution allowlist (overwrites the shipped stub). */
  private async writeApiAllowlist(): Promise<void> {
    return this.apiReferenceGenerator.writeAllowlist(this.apiRegistry);
  }

  /** Removes endpoint page directories that are no longer in the spec. */
  private async cleanupStaleApiPages(
    nextRoutes: Map<string, string>,
    realSlugs: Set<string>,
  ): Promise<void> {
    return this.apiReferenceGenerator.cleanupStalePages(
      nextRoutes,
      realSlugs,
      (slug) => this.removeOwnedRoute(slug),
    );
  }

  /**
   * (Re)points the spec-file watcher at the currently configured spec paths.
   * Called at startup and whenever doccupine.json changes the `openapi` set,
   * so specs added mid-session are watched without a restart.
   */
  private async syncOpenApiSpecWatcher(): Promise<void> {
    return this.watchCoordinator.syncOpenApiSpecWatcher(this.openApiSpecs);
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
    let indexMDX: HomepageSource | null = null;

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
    const rendered = renderHomepage(indexMDX, apiOperation);

    const homePath = this.outputPath("app", "(site)", "page.tsx");
    await fs.ensureDir(path.dirname(homePath));
    await writeFileAtomic(homePath, rendered.pageContent);

    // Same lifecycle as the per-page feeds in generatePageFromMDX: write the
    // root feed route while the homepage has Update blocks, prune it when
    // they go away or index.mdx is deleted (this runs on every aggregate
    // refresh, including the delete path).
    const rssDir = this.outputPath("app", "(site)", "rss.xml");
    if (rendered.rssRoute.action === "write") {
      await fs.ensureDir(rssDir);
      await writeFileAtomic(
        this.outputPath("app", "(site)", "rss.xml", "route.ts"),
        rendered.rssRoute.content,
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
    const rendered = renderSectionPage(
      sectionSlug,
      frontmatter,
      mdxContent,
      sourcePath,
    );

    const pagePath = resolveOutputPath(
      this.outputDir,
      "app",
      "(site)",
      sectionSlug,
      "page.tsx",
    );
    await fs.ensureDir(path.dirname(pagePath));
    await writeFileAtomic(pagePath, rendered.pageContent);
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
    return loadSiteUrlArtifact(() =>
      this.projectConfigRepository.readConfigFile(),
    );
  }

  async updateSitemap(pages?: PageMeta[]) {
    return writeSitemap(
      this.outputDir,
      this.sectionsConfig,
      async () => pages ?? (await this.buildAllPagesMeta()),
      () => this.loadSiteUrl(),
    );
  }

  async updateRobots() {
    return writeRobots(this.outputDir, () => this.loadSiteUrl());
  }

  async updateLlmsFiles(pages?: PageMeta[]) {
    return writeLlmsFiles(
      this.outputDir,
      this.sectionsConfig,
      async () => pages ?? (await this.buildAllPagesMeta()),
      (filePath) => this.readMdxSourceFile(filePath),
      (slug) => this.apiRegistry.bodyForSlug(slug),
      () =>
        loadSiteMetadata(() => this.projectConfigRepository.readConfigFile()),
      this.publicAssetManager,
    );
  }

  async stop() {
    return this.watchCoordinator.stop();
  }
}
