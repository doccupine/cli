import fs from "fs-extra";
import { createHash } from "node:crypto";
import path from "path";

import chalk from "chalk";

import { rootLayoutTemplate, siteLayoutTemplate } from "./lib/layout.js";
import {
  normalizeOpenApiConfig,
  validateConfig,
} from "./lib/config-manager.js";
import {
  GeneratedArtifacts,
  type RouteArtifact,
} from "./lib/generated-artifacts.js";
import {
  claimOutputDirectory,
  resolveOutputPath,
} from "./lib/output-safety.js";
import { OpenApiRegistry, DEFAULT_API_BASE_SLUG } from "./lib/openapi.js";
import { safeMatter, writeFileAtomic } from "./lib/utils.js";
import { nextConfigTemplate } from "./templates/next.config.js";
import { proxyTemplate } from "./templates/proxy.js";
import type {
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
import {
  GeneratedPagePublisher,
  type GeneratedPageCommit,
} from "./generator/generated-page-publisher.js";
import { GeneratedRouteManager } from "./generator/generated-route-manager.js";
import { MdxReconciliationCoordinator } from "./generator/mdx-reconciliation-coordinator.js";
import { ProjectConfigRepository } from "./generator/project-config-repository.js";
import { PublicAssetManager } from "./generator/public-asset-manager.js";
import {
  ICON_SOURCE_FILES,
  IconAssetManager,
} from "./generator/icon-asset-manager.js";
import { WatchCoordinator } from "./generator/watch-coordinator.js";
import { SectionIndexGenerator } from "./generator/section-index-generator.js";
import {
  OpenApiRefreshCoordinator,
  type ApiPageWriteOptions,
} from "./generator/openapi-refresh-coordinator.js";
import {
  addApiReferenceSection,
  determineSectionRoute,
  discoverSections,
} from "./generator/section-resolver.js";
import type { HomepageSource } from "./generator/page-renderer.js";
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
  private generatedPagePublisher: GeneratedPagePublisher;
  private generatedRouteManager: GeneratedRouteManager;
  private mdxReconciliationCoordinator: MdxReconciliationCoordinator;
  private openApiRefreshCoordinator: OpenApiRefreshCoordinator;
  private sectionIndexGenerator: SectionIndexGenerator;
  private projectConfigRepository: ProjectConfigRepository;
  private publicAssetManager: PublicAssetManager;
  private iconAssetManager: IconAssetManager;
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
    this.generatedPagePublisher = new GeneratedPagePublisher(
      this.outputDir,
      this.generatedRouteManager,
    );
    this.sectionIndexGenerator = new SectionIndexGenerator(
      this.outputDir,
      this.generatedRouteManager,
    );
    this.mdxReconciliationCoordinator = new MdxReconciliationCoordinator({
      sourceFs: this.sourceFs,
      generatedRouteManager: this.generatedRouteManager,
      getAllMdxFiles: () => this.getAllMDXFiles(),
      getSections: () => this.sectionsConfig,
      setSections: (sections) => {
        this.sectionsConfig = sections;
      },
      loadSectionsConfig: () => this.loadSectionsConfig(),
      withApiReferenceSection: (sections) =>
        this.withApiReferenceSection(sections),
      determineSectionForFile: (filePath, frontmatter, sections) =>
        this.determineSectionForFile(filePath, frontmatter, sections),
      lookupOpenApi: (reference) => this.apiRegistry.lookup(reference),
      isOpenApiRegistryEmpty: () => this.apiRegistry.isEmpty,
      syntheticOpenApiPages: () => this.apiRegistry.syntheticPages(),
      getMdxRoutes: () => this.artifacts.routesFor("mdx"),
      getOpenApiRoutes: () => this.artifacts.routesFor("openapi"),
      replaceMdxRoutes: (routes) =>
        this.artifacts.replaceRoutesAndSave("mdx", routes),
      generatePageFromMdx: (mdxFile, options) =>
        this.generatePageFromMDX(mdxFile, options),
      updateSectionIndex: (sectionSlug, frontmatter, content, sourcePath) =>
        this.updateSectionIndex(sectionSlug, frontmatter, content, sourcePath),
      writeApiPages: (realPages) => this.writeApiPages(realPages),
      updatePagesIndex: (pages) => this.updatePagesIndex(pages),
      updateRootLayout: (pages) => this.updateRootLayout(pages),
      updateSitemap: (pages) => this.updateSitemap(pages),
      updateLlmsFiles: (pages) => this.updateLlmsFiles(pages),
      generateSectionIndexPages: (pages, declaredSlugs) =>
        this.generateSectionIndexPages(pages, declaredSlugs),
      maybeUpdateSections: () => this.maybeUpdateSections(),
      removeOwnedRoute: (slug) => this.removeOwnedRoute(slug),
    });
    this.projectConfigRepository = new ProjectConfigRepository(
      this.rootDir,
      this.outputDir,
      this.sourceFs,
      this.configFiles,
      this.fontConfigFile,
      this.analyticsConfigFile,
      ICON_SOURCE_FILES,
    );
    this.publicAssetManager = new PublicAssetManager(
      this.rootDir,
      this.outputDir,
      this.artifacts,
      this.sourceFs,
    );
    this.iconAssetManager = new IconAssetManager(
      this.rootDir,
      this.outputDir,
      this.artifacts,
      this.sourceFs,
      (fileName) =>
        this.projectConfigRepository.readOptionalRootBinaryFile(
          fileName,
          "icon source",
        ),
    );
    this.watchCoordinator = new WatchCoordinator({
      watchDir: this.watchDir,
      rootDir: this.rootDir,
      configFiles: this.configFiles,
      fontConfigFile: this.fontConfigFile,
      analyticsConfigFile: this.analyticsConfigFile,
      doccupineConfigFile: this.doccupineConfigFile,
      iconFiles: ICON_SOURCE_FILES,
      sourceFs: this.sourceFs,
      getOpenApiSpecs: () => this.openApiSpecs,
      getOpenApiSourceFiles: () => this.apiRegistry.sourceFiles,
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
        syncIconFiles: () => this.syncIconFiles(),
        processAllMDXFiles: () => this.reconcileMdxSources(),
      },
    });
    this.openApiRefreshCoordinator = new OpenApiRefreshCoordinator({
      rootDir: this.rootDir,
      watchDir: this.watchDir,
      outputDir: this.outputDir,
      configFile: this.doccupineConfigFile,
      apiBaseSlug: this.apiBaseSlug,
      sourceFs: this.sourceFs,
      getRegistry: () => this.apiRegistry,
      setRegistry: (registry) => {
        this.apiRegistry = registry;
      },
      getSpecs: () => this.openApiSpecs,
      setSpecs: (specs) => {
        this.openApiSpecs = specs;
      },
      getSections: () => this.sectionsConfig,
      setSections: (sections) => {
        this.sectionsConfig = sections;
      },
      getOpenApiRoutes: () => this.artifacts.routesFor("openapi"),
      getSuccessfulMdxPages: () =>
        this.mdxReconciliationCoordinator.successfulPages(),
      resolveSections: () => this.resolveSections(),
      writeApiPages: (realPages, options) =>
        this.writeApiPages(realPages, options),
      refreshSiteAggregates: () => this.refreshSiteAggregates(),
      syncWatcher: () => this.syncOpenApiSpecWatcher(),
      removeOwnedRoute: (slug) => this.removeOwnedRoute(slug),
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

  private async writeStarterFilesIfEmpty(
    files: Iterable<readonly [string, string | Uint8Array]>,
  ): Promise<void> {
    return this.sourceFs.writeStarterFilesIfEmpty(files);
  }

  private async refreshInitialDoccupineConfig(): Promise<string | undefined> {
    const configPath = path.join(this.rootDir, this.doccupineConfigFile);
    if (!(await fs.pathExists(configPath))) return undefined;
    const { data, stat } = await this.sourceFs.readProjectSourceFile(
      configPath,
      "Doccupine configuration source",
    );
    const config = validateConfig(
      JSON.parse(data.toString("utf8")),
      this.rootDir,
    );
    this.openApiSpecs = normalizeOpenApiConfig(config.openapi);
    const hash = createHash("sha256").update(data).digest("hex");
    return `file:${stat.size}:${stat.mtimeMs}:${stat.dev}:${stat.ino}:${hash}`;
  }

  async init() {
    console.log(chalk.blue("🚀 Initializing MDX to Next.js generator..."));

    await this.projectConfigRepository.preflightSourceFiles();
    try {
      await fs.ensureDir(this.watchDir);
      await claimOutputDirectory(this.outputDir);
      await this.artifacts.load();

      // Starter documents are part of the initial source tree. Capture the
      // watcher baseline after creating them, but before reading any source
      // that contributes to generated output.
      await this.createStartingDocs();
      const doccupineSourceState = await this.refreshInitialDoccupineConfig();
      await this.loadOpenApiRegistry();
      await this.watchCoordinator.establishSourceSnapshot(
        this.projectConfigRepository.sourceSnapshotStates(),
        this.apiRegistry.sourceFingerprint,
        doccupineSourceState,
      );

      // Resolve sections after loading OpenAPI so the generated reference is
      // present in the first layout, sitemap, and LLMS pass.
      this.sectionsConfig = await this.resolveSections();
      this.analyticsConfig = await this.loadAnalyticsConfig();

      if (this.analyticsConfig) {
        console.log(
          chalk.blue(`📊 Analytics enabled: ${this.analyticsConfig.provider}`),
        );
      }

      this.mdxReconciliationCoordinator.resetForInitialPublication();
      await this.createNextJSStructure();
      await this.copyCustomConfigFiles();
      await this.copyFontConfig();
      await this.copyAnalyticsConfig();
      await this.copyPublicFiles();
      await this.syncIconFiles();
      if (this.sectionsConfig) {
        console.log(
          chalk.blue(
            `📑 Found ${this.sectionsConfig.length} section(s): ${this.sectionsConfig.map((s) => s.label).join(", ")}`,
          ),
        );
      }

      await this.processAllMDXFiles();

      console.log(chalk.green("✅ Initial setup complete!"));
      console.log(chalk.cyan("💡 To start the Next.js dev server:"));
      console.log(
        chalk.white(`   cd ${path.relative(process.cwd(), this.outputDir)}`),
      );
      console.log(
        chalk.white("   install dependencies, then run the dev script"),
      );
    } finally {
      this.projectConfigRepository.clearSourceSnapshot();
    }
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
      writeStarterFilesIfEmpty: (files) => this.writeStarterFilesIfEmpty(files),
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

  private async reconcileMdxSources(): Promise<void> {
    await this.processAllMDXFiles();
  }

  private determineSectionForFile(
    filePath: string,
    frontmatter: Record<string, any>,
    sections: SectionConfig[] | null = this.sectionsConfig,
  ): { sectionSlug: string; pageSlug: string } {
    return determineSectionRoute(filePath, frontmatter, sections);
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

  async syncIconFiles() {
    return this.iconAssetManager.syncIconFiles();
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

  private async buildRealPagesMeta(): Promise<PageMeta[]> {
    return this.mdxReconciliationCoordinator.buildRealPagesMeta();
  }

  private async buildAllPagesMeta(): Promise<PageMeta[]> {
    return this.mdxReconciliationCoordinator.buildAllPagesMeta();
  }

  private async readAggregateMdxSource(
    filePath: string,
  ): Promise<{ content: string }> {
    return this.mdxReconciliationCoordinator.readAggregateMdxSource(filePath);
  }

  private async removeOwnedRoute(slug: string): Promise<void> {
    return this.generatedRouteManager.removeOwnedRoute(slug);
  }

  private async refreshSiteAggregates(
    resolvedPages?: PageMeta[],
    declaredSlugs?: Set<string>,
  ): Promise<void> {
    return this.mdxReconciliationCoordinator.refreshSiteAggregates(
      resolvedPages,
      declaredSlugs,
    );
  }

  async handleFileChange(action: string, filePath: string) {
    return this.mdxReconciliationCoordinator.handleFileChange(action, filePath);
  }

  async handleFileDelete(filePath: string) {
    return this.mdxReconciliationCoordinator.handleFileDelete(filePath);
  }

  async processAllMDXFiles() {
    return this.mdxReconciliationCoordinator.processAllMdxFiles();
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

  async generateSectionIndexPages(
    pages?: PageMeta[],
    declaredSlugs?: Set<string>,
  ) {
    const resolvedPages = pages ?? (await this.buildAllPagesMeta());
    return this.sectionIndexGenerator.generate(
      resolvedPages,
      this.sectionsConfig,
      declaredSlugs,
      (slug, target) => this.writeSectionIndexRedirect(slug, target),
    );
  }

  private async writeSectionIndexRedirect(
    slug: string,
    target: string,
  ): Promise<void> {
    const content = `import { redirect } from "next/navigation";

export default function SectionIndex() {
  redirect("/${target}");
}
`;
    await writeFileAtomic(
      this.outputPath("app", "(site)", slug, "page.tsx"),
      content,
    );
    console.log(
      chalk.blue(`🔀 Generated section index redirect: /${slug} -> /${target}`),
    );
  }

  async generatePageFromMDX(
    mdxFile: MDXFile,
    options?: { apiOperation?: OperationDescriptor },
  ): Promise<GeneratedPageCommit> {
    return this.generatedPagePublisher.generatePageFromMdx(mdxFile, options);
  }

  /** Parses the configured OpenAPI spec(s) into the shared registry. */
  private async loadOpenApiRegistry(): Promise<void> {
    return this.openApiRefreshCoordinator.loadInitialRegistry();
  }

  /**
   * Generates one page per OpenAPI operation, (re)writes the request-execution
   * allowlist consumed by the playground proxy + component, and removes endpoint
   * pages that no longer exist in the spec. Safe to call when there are no specs
   * - it still emits an empty allowlist and prunes any previously generated
   * pages (e.g. after the `openapi` config is removed).
   */
  private async writeApiPages(
    realPages?: PageMeta[],
    options: ApiPageWriteOptions = {},
  ): Promise<Map<string, string>> {
    const resolvedRealPages = realPages ?? (await this.buildRealPagesMeta());
    const blockedRealPages =
      this.mdxReconciliationCoordinator.blockOpenApiPages(resolvedRealPages);
    const occupiedMdxSlugs = this.mdxReconciliationCoordinator.occupiedSlugs();
    return this.apiReferenceGenerator.writePages(
      this.apiRegistry,
      this.apiBaseSlug,
      blockedRealPages,
      async (mdxFile, options) => {
        await this.generatePageFromMDX(mdxFile, options);
      },
      () => this.writeApiAllowlist(),
      (nextRoutes) =>
        this.cleanupStaleApiPages(
          nextRoutes,
          occupiedMdxSlugs,
          options.additionalPreviousRoutes,
        ),
      options.writtenRoutes,
    );
  }

  /** Writes the request-execution allowlist (overwrites the shipped stub). */
  private async writeApiAllowlist(): Promise<void> {
    return this.apiReferenceGenerator.writeAllowlist(this.apiRegistry);
  }

  /** Removes endpoint page directories that are no longer in the spec. */
  private async cleanupStaleApiPages(
    nextRoutes: Map<string, string>,
    occupiedMdxSlugs: Set<string>,
    additionalPreviousRoutes: Iterable<RouteArtifact> = [],
  ): Promise<void> {
    return this.apiReferenceGenerator.cleanupStalePages(
      nextRoutes,
      occupiedMdxSlugs,
      (slug) => this.removeOwnedRoute(slug),
      additionalPreviousRoutes,
    );
  }

  /**
   * (Re)points the spec-file watcher at the currently configured spec paths.
   * Called at startup and whenever doccupine.json changes the `openapi` set,
   * so specs added mid-session are watched without a restart.
   */
  private async syncOpenApiSpecWatcher(): Promise<void> {
    return this.watchCoordinator.syncOpenApiSpecWatcher(
      this.openApiSpecs,
      this.apiRegistry.sourceFiles,
    );
  }

  /** Reparses the spec(s) and regenerates the API reference on a watch event. */
  async handleOpenApiChange() {
    return this.openApiRefreshCoordinator.handleOpenApiChange();
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
    return this.openApiRefreshCoordinator.handleConfigChange();
  }

  async updatePagesIndex(pages?: readonly PageMeta[]) {
    const indexMDX: HomepageSource | null =
      await this.mdxReconciliationCoordinator.readHomepageSource(pages);

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
    await this.generatedPagePublisher.updateHomepage(indexMDX, apiOperation);
  }

  async updateSectionIndex(
    sectionSlug: string,
    frontmatter: Record<string, any>,
    mdxContent: string,
    sourcePath?: string,
  ): Promise<GeneratedPageCommit> {
    return this.generatedPagePublisher.updateSectionIndex(
      sectionSlug,
      frontmatter,
      mdxContent,
      sourcePath,
    );
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
      (filePath) => this.readAggregateMdxSource(filePath),
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
