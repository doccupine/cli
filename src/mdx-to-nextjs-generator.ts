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
  readOutputFileIfPresent,
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
  type RenderedPage,
} from "./generator/page-renderer.js";
import {
  buildRealPagesMeta as buildRealPageCatalog,
  mergePages as mergePageCatalog,
  parseMdxPageMeta,
  RouteCollisionError,
} from "./generator/page-catalog.js";
import {
  loadSiteMetadata,
  loadSiteUrl as loadSiteUrlArtifact,
  writeLlmsFiles,
  writeRobots,
  writeSitemap,
} from "./generator/site-artifacts.js";

interface MdxSourceSnapshot {
  content: string;
  stat: fs.Stats;
}

interface MdxPassSnapshot {
  files: string[];
  pages: PageMeta[];
  sources: ReadonlyMap<string, MdxSourceSnapshot>;
}

interface SuccessfulMdxState {
  pages: Map<string, PageMeta>;
  content: Map<string, string>;
  sourcesBySlug: Map<string, string>;
  collisionBlockedSources: Set<string>;
  sections: SectionConfig[] | null;
  routes: RouteArtifact[];
  snapshotInitialized: boolean;
}

interface GeneratedPageCommit {
  rollback(): Promise<void>;
}

interface ApiPageWriteOptions {
  writtenRoutes?: Map<string, string>;
  additionalPreviousRoutes?: Iterable<RouteArtifact>;
}

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
  private retainExistingMdxOutput = true;
  private mdxSnapshotInitialized = false;
  private successfulMdxPages = new Map<string, PageMeta>();
  private successfulMdxContent = new Map<string, string>();
  private successfulMdxSourcesBySlug = new Map<string, string>();
  private collisionBlockedMdxSources = new Set<string>();

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
        processAllMDXFiles: () => this.reconcileMdxSources(),
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

      this.retainExistingMdxOutput = false;
      await this.createNextJSStructure();
      await this.copyCustomConfigFiles();
      await this.copyFontConfig();
      await this.copyAnalyticsConfig();
      await this.copyPublicFiles();
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

  private async parseMDXFile(
    file: string,
    source?: MdxSourceSnapshot,
  ): Promise<PageMeta> {
    return parseMdxPageMeta(
      file,
      source
        ? async () => source
        : (filePath) => this.readMdxSourceFile(filePath),
      (filePath, frontmatter) =>
        this.determineSectionForFile(filePath, frontmatter),
      (reference) => this.apiRegistry.lookup(reference)?.method,
    );
  }

  private async captureMdxPass(
    files?: string[],
    seededSources: ReadonlyMap<string, MdxSourceSnapshot> = new Map(),
    refreshSections = false,
  ): Promise<MdxPassSnapshot> {
    const resolvedFiles = files ?? (await this.getAllMDXFiles());
    const sources = new Map(seededSources);
    await Promise.all(
      resolvedFiles.map(async (file) => {
        const source = file.replace(/\\/g, "/");
        if (!sources.has(source)) {
          sources.set(source, await this.readMdxSourceFile(file));
        }
      }),
    );
    if (refreshSections) {
      const configuredSections = await this.loadSectionsConfig();
      if (configuredSections !== null) {
        this.sectionsConfig = this.withApiReferenceSection(configuredSections);
      } else {
        const documents = resolvedFiles.map((filePath) => {
          const source = sources.get(filePath.replace(/\\/g, "/"));
          if (!source) throw new Error(`Unable to snapshot ${filePath}`);
          return {
            filePath,
            frontmatter: safeMatter(source.content, filePath).data,
          };
        });
        this.sectionsConfig = this.withApiReferenceSection(
          discoverSections(documents),
        );
      }
    }
    const pages = await buildRealPageCatalog(resolvedFiles, (file) => {
      const source = sources.get(file.replace(/\\/g, "/"));
      if (!source) throw new Error(`Unable to snapshot ${file}`);
      return this.parseMDXFile(file, source);
    });
    return { files: resolvedFiles, pages, sources };
  }

  private async buildRealPagesMeta(): Promise<PageMeta[]> {
    return (await this.captureMdxPass()).pages;
  }

  private async buildAllPagesMeta(): Promise<PageMeta[]> {
    const real = await this.buildRealPagesMeta();
    return this.mergeAllPagesMeta(
      this.mdxSnapshotInitialized
        ? this.successfulPagesInSourceOrder(real)
        : real,
      new Set(real.map((page) => page.slug)),
    );
  }

  private mergeAllPagesMeta(
    real: PageMeta[],
    declaredRealSlugs: Set<string> = new Set(real.map((page) => page.slug)),
  ): PageMeta[] {
    return mergePageCatalog(
      real,
      this.apiRegistry.isEmpty
        ? []
        : this.apiRegistry
            .syntheticPages()
            .filter((page) => !declaredRealSlugs.has(page.slug)),
    );
  }

  private successfulPagesInSourceOrder(realPages: PageMeta[]): PageMeta[] {
    return realPages.flatMap((page) => {
      const successful = this.successfulMdxPages.get(
        page.path.replace(/\\/g, "/"),
      );
      return successful ? [successful] : [];
    });
  }

  private recordSuccessfulMdxPage(page: PageMeta, sourceContent: string): void {
    const source = page.path.replace(/\\/g, "/");
    const previous = this.successfulMdxPages.get(source);
    if (
      previous &&
      previous.slug !== page.slug &&
      this.successfulMdxSourcesBySlug.get(previous.slug) === source
    ) {
      this.successfulMdxSourcesBySlug.delete(previous.slug);
    }
    const otherSource = this.successfulMdxSourcesBySlug.get(page.slug);
    if (otherSource && otherSource !== source) {
      this.removeSuccessfulMdxPage(otherSource);
    }
    this.successfulMdxPages.set(source, page);
    this.successfulMdxContent.set(source, sourceContent);
    this.successfulMdxSourcesBySlug.set(page.slug, source);
    this.collisionBlockedMdxSources.delete(source);
  }

  private removeSuccessfulMdxPage(source: string): void {
    const successful = this.successfulMdxPages.get(source);
    if (
      successful &&
      this.successfulMdxSourcesBySlug.get(successful.slug) === source
    ) {
      this.successfulMdxSourcesBySlug.delete(successful.slug);
    }
    this.successfulMdxPages.delete(source);
    this.successfulMdxContent.delete(source);
  }

  private captureSuccessfulMdxState(): SuccessfulMdxState {
    return {
      pages: new Map(this.successfulMdxPages),
      content: new Map(this.successfulMdxContent),
      sourcesBySlug: new Map(this.successfulMdxSourcesBySlug),
      collisionBlockedSources: new Set(this.collisionBlockedMdxSources),
      sections: this.sectionsConfig?.map((section) => ({ ...section })) ?? null,
      routes: this.artifacts.routesFor("mdx"),
      snapshotInitialized: this.mdxSnapshotInitialized,
    };
  }

  private restoreSuccessfulMdxState(state: SuccessfulMdxState): void {
    this.successfulMdxPages = state.pages;
    this.successfulMdxContent = state.content;
    this.successfulMdxSourcesBySlug = state.sourcesBySlug;
    this.collisionBlockedMdxSources = state.collisionBlockedSources;
    this.sectionsConfig = state.sections;
    this.mdxSnapshotInitialized = state.snapshotInitialized;
  }

  private async rollbackPageCommits(
    commits: readonly GeneratedPageCommit[],
  ): Promise<unknown[]> {
    const errors: unknown[] = [];
    for (const commit of [...commits].reverse()) {
      try {
        await commit.rollback();
      } catch (error) {
        errors.push(error);
      }
    }
    return errors;
  }

  private async rollbackFailedMdxCommit(
    error: unknown,
    state: SuccessfulMdxState,
    commits: readonly GeneratedPageCommit[],
  ): Promise<never> {
    this.restoreSuccessfulMdxState(state);
    const rollbackErrors = await this.rollbackPageCommits(commits);
    if (rollbackErrors.length > 0) {
      throw new AggregateError(
        [error, ...rollbackErrors],
        "Unable to commit or restore generated MDX pages",
      );
    }
    throw error;
  }

  private async rollbackCommittedMdxChange(
    error: unknown,
    state: SuccessfulMdxState,
    commits: readonly GeneratedPageCommit[],
  ): Promise<never> {
    this.restoreSuccessfulMdxState(state);
    const rollbackErrors = await this.rollbackPageCommits(commits);
    const previousPages = [...state.pages.values()];

    for (const page of previousPages) {
      if (page.slug === "") continue;
      const content = state.content.get(page.path.replace(/\\/g, "/"));
      if (content === undefined) continue;
      try {
        await this.writePageForFile(page.path, content);
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }
    try {
      await this.artifacts.replaceRoutesAndSave(
        "mdx",
        state.routes.map(({ source, slug }) => ({ source, slug })),
      );
    } catch (rollbackError) {
      rollbackErrors.push(rollbackError);
    }
    try {
      await this.refreshMdxDerivedOutput(previousPages, previousPages);
    } catch (rollbackError) {
      rollbackErrors.push(rollbackError);
    }

    if (rollbackErrors.length > 0) {
      throw new AggregateError(
        [error, ...rollbackErrors],
        "Unable to refresh or restore generated MDX output",
      );
    }
    throw error;
  }

  private dropMissingMdxSnapshots(realPages: PageMeta[]): void {
    const currentSources = new Set(
      realPages.map((page) => page.path.replace(/\\/g, "/")),
    );
    for (const source of this.successfulMdxPages.keys()) {
      if (currentSources.has(source)) continue;
      this.removeSuccessfulMdxPage(source);
      this.collisionBlockedMdxSources.delete(source);
    }
  }

  private async commitMdxSnapshot(realPages: PageMeta[]): Promise<PageMeta[]> {
    this.dropMissingMdxSnapshots(realPages);
    const successfulPages = this.successfulPagesInSourceOrder(realPages);
    const previousRoutes = this.artifacts.routesFor("mdx");
    await this.generatedRouteManager.replaceMdxRoutes(successfulPages);
    try {
      await this.removeStaleMdxRoutes(successfulPages, previousRoutes);
    } catch (error) {
      console.error(
        chalk.red("❌ Error removing stale MDX routes; cleanup will retry:"),
        error,
      );
    }
    this.mdxSnapshotInitialized = true;
    return successfulPages;
  }

  private async refreshMdxDerivedOutput(
    realPages: PageMeta[],
    successfulPages: PageMeta[],
  ): Promise<void> {
    if (
      !this.apiRegistry.isEmpty ||
      this.artifacts.routesFor("openapi").length > 0
    ) {
      await this.writeApiPages(realPages);
    }
    const declaredSlugs = new Set(realPages.map((page) => page.slug));
    const pages = this.mergeAllPagesMeta(successfulPages, declaredSlugs);
    await this.refreshSiteAggregates(pages, declaredSlugs);
  }

  private async readAggregateMdxSource(
    filePath: string,
  ): Promise<{ content: string }> {
    const cached = this.successfulMdxContent.get(filePath.replace(/\\/g, "/"));
    if (this.mdxSnapshotInitialized && cached !== undefined) {
      return { content: cached };
    }
    return this.readMdxSourceFile(filePath);
  }

  private homepageSource(
    frontmatter: Record<string, any>,
    mdxContent: string,
  ): HomepageSource {
    return {
      content: mdxContent,
      title: frontmatter.title || "Welcome",
      description: frontmatter.description || "",
      icon: frontmatter.icon,
      image: frontmatter.image,
      name: frontmatter.name,
      date: typeof frontmatter.date === "string" ? frontmatter.date : undefined,
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
  }

  private async removeOwnedRoute(slug: string): Promise<void> {
    return this.generatedRouteManager.removeOwnedRoute(slug);
  }

  private async removeStaleMdxRoutes(
    realPages: PageMeta[],
    previousRoutes = this.artifacts.routesFor("mdx"),
  ): Promise<void> {
    return this.generatedRouteManager.removeStaleMdxRoutes(
      realPages,
      (slug) => this.removeOwnedRoute(slug),
      previousRoutes,
    );
  }

  /**
   * Writes the generated page(s) for a single MDX file: the doc page and, for a
   * section-index file, the section landing page. Deliberately does NOT run the
   * site-wide aggregations (pages index, layout, sitemap, llms, section
   * redirects) - the caller batches those so a bulk build runs them once at the
   * end instead of once per file (which is what made large builds O(n²)).
   */
  private async writePageForFile(
    filePath: string,
    content: string,
  ): Promise<GeneratedPageCommit[]> {
    const commits: GeneratedPageCommit[] = [];
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

    try {
      if (isIndex) {
        // The homepage is emitted by updatePagesIndex() in the aggregate pass, so
        // validate it here before its source enters the successful snapshot.
        console.log(chalk.blue("🏠 Updating homepage with index.mdx content"));
        renderHomepage(
          this.homepageSource(frontmatter, mdxContent),
          typeof frontmatter.openapi === "string"
            ? this.apiRegistry.lookup(frontmatter.openapi)
            : undefined,
        );
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

        commits.push(
          await this.generatePageFromMDX(
            mdxFile,
            apiOperation ? { apiOperation } : undefined,
          ),
        );
      }

      if (isSectionIndex) {
        commits.push(
          await this.updateSectionIndex(
            sectionSlug,
            frontmatter,
            mdxContent,
            filePath,
          ),
        );
      }
      return commits;
    } catch (error) {
      const rollbackErrors = await this.rollbackPageCommits(commits);
      if (rollbackErrors.length > 0) {
        throw new AggregateError(
          [error, ...rollbackErrors],
          `Unable to generate or restore ${filePath}`,
        );
      }
      throw error;
    }
  }

  private async retryMdxPages(
    snapshot: MdxPassSnapshot,
    shouldRetry: (source: string, page: PageMeta) => boolean,
    commits: GeneratedPageCommit[],
  ): Promise<void> {
    for (const page of snapshot.pages) {
      const source = page.path.replace(/\\/g, "/");
      if (!shouldRetry(source, page)) continue;
      const currentOwner = this.successfulMdxSourcesBySlug.get(page.slug);
      if (currentOwner && currentOwner !== source) continue;
      const captured = snapshot.sources.get(source);
      if (!captured) continue;
      try {
        commits.push(
          ...(await this.writePageForFile(page.path, captured.content)),
        );
        this.recordSuccessfulMdxPage(page, captured.content);
      } catch (error) {
        console.error(chalk.red(`❌ Error processing ${page.path}:`), error);
      }
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
    declaredSlugs?: Set<string>,
  ): Promise<void> {
    const pages = resolvedPages ?? (await this.buildAllPagesMeta());
    await this.updatePagesIndex();
    await this.updateRootLayout(pages);
    await this.updateSitemap(pages);
    await this.updateLlmsFiles(pages);
    await this.generateSectionIndexPages(pages, declaredSlugs);
  }

  async handleFileChange(action: string, filePath: string) {
    console.log(chalk.cyan(`📝 File ${action}: ${filePath}`));

    const normalizedSource = filePath.replace(/\\/g, "/");
    const changedSource = await this.readMdxSourceFile(filePath);
    const previousState = this.captureSuccessfulMdxState();
    const pageCommits: GeneratedPageCommit[] = [];
    let pageRendered = false;

    try {
      // Validate the complete route set before writing this page so a collision
      // cannot transiently overwrite another route during watch mode.
      const snapshot = await this.captureMdxPass(
        undefined,
        new Map([[normalizedSource, changedSource]]),
        true,
      );
      const realPages = snapshot.pages;
      const currentPage = realPages.find(
        (page) => page.path.replace(/\\/g, "/") === normalizedSource,
      );
      if (!currentPage) throw new Error(`Unable to resolve ${filePath}`);

      try {
        pageCommits.push(
          ...(await this.writePageForFile(filePath, changedSource.content)),
        );
        this.recordSuccessfulMdxPage(currentPage, changedSource.content);
        pageRendered = true;
      } catch (error) {
        if (this.retainExistingMdxOutput) {
          this.restoreSuccessfulMdxState(previousState);
        } else {
          this.removeSuccessfulMdxPage(normalizedSource);
        }
        const successfulPages = await this.commitMdxSnapshot(realPages);
        await this.refreshMdxDerivedOutput(realPages, successfulPages);
        throw error;
      }

      await this.retryMdxPages(
        snapshot,
        (source) =>
          source !== normalizedSource &&
          this.collisionBlockedMdxSources.has(source),
        pageCommits,
      );

      let successfulPages: PageMeta[] = [];
      try {
        successfulPages = await this.commitMdxSnapshot(realPages);
      } catch (error) {
        await this.rollbackFailedMdxCommit(error, previousState, pageCommits);
      }
      try {
        await this.refreshMdxDerivedOutput(realPages, successfulPages);
      } catch (error) {
        await this.rollbackCommittedMdxChange(
          error,
          previousState,
          pageCommits,
        );
      }

      console.log(chalk.green(`✅ Generated page for: ${filePath}`));

      await this.maybeUpdateSections();
    } catch (error) {
      if (!pageRendered && error instanceof RouteCollisionError) {
        this.collisionBlockedMdxSources.add(normalizedSource);
        for (const source of error.sources) {
          this.collisionBlockedMdxSources.add(source.replace(/\\/g, "/"));
        }
      }
      console.error(chalk.red(`❌ Error processing ${filePath}:`), error);
    }
  }

  async handleFileDelete(filePath: string) {
    console.log(chalk.red(`🗑️ File deleted: ${filePath}`));

    const previousState = this.captureSuccessfulMdxState();
    const pageCommits: GeneratedPageCommit[] = [];
    try {
      const normalizedSource = filePath.replace(/\\/g, "/");
      this.removeSuccessfulMdxPage(normalizedSource);
      this.collisionBlockedMdxSources.delete(normalizedSource);

      if (filePath === "index.mdx" || filePath === "./index.mdx") {
        console.log(chalk.blue("🏠 Updating homepage - index.mdx deleted"));
      }

      const snapshot = await this.captureMdxPass(undefined, undefined, true);
      const realPages = snapshot.pages;
      await this.retryMdxPages(
        snapshot,
        (source, page) => {
          return (
            this.collisionBlockedMdxSources.has(source) ||
            this.successfulMdxPages.get(source)?.slug !== page.slug
          );
        },
        pageCommits,
      );

      let successfulPages: PageMeta[] = [];
      try {
        successfulPages = await this.commitMdxSnapshot(realPages);
      } catch (error) {
        await this.rollbackFailedMdxCommit(error, previousState, pageCommits);
      }
      try {
        await this.refreshMdxDerivedOutput(realPages, successfulPages);
      } catch (error) {
        await this.rollbackCommittedMdxChange(
          error,
          previousState,
          pageCommits,
        );
      }

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
    const previousState = this.captureSuccessfulMdxState();
    const pageCommits: GeneratedPageCommit[] = [];
    const files = await this.getAllMDXFiles();
    // Fail before writing any page when two source files resolve to one route.
    let snapshot: MdxPassSnapshot;
    try {
      snapshot = await this.captureMdxPass(files, undefined, true);
    } catch (error) {
      if (error instanceof RouteCollisionError) {
        // The catalog rejects the entire pass, so any source may have an
        // unapplied content change even when it is not one of the colliders.
        for (const source of files) {
          this.collisionBlockedMdxSources.add(source.replace(/\\/g, "/"));
        }
      }
      throw error;
    }
    const realPages = snapshot.pages;

    // Write each page first (the only genuinely per-file work), then run the
    // site-wide aggregations a single time. Doing the aggregations per file
    // re-scanned and re-parsed every MDX file on each iteration, which made a
    // full build O(n²); batching them makes it O(n). A single bad file is
    // logged and skipped so it never aborts the whole build.
    const pagesBySource = new Map(
      realPages.map((page) => [page.path.replace(/\\/g, "/"), page]),
    );
    for (const file of files) {
      console.log(chalk.cyan(`📝 Processing: ${file}`));
      const normalizedSource = file.replace(/\\/g, "/");
      try {
        const sourceContent = snapshot.sources.get(normalizedSource)?.content;
        if (sourceContent === undefined) {
          throw new Error(`Unable to snapshot ${file}`);
        }
        pageCommits.push(...(await this.writePageForFile(file, sourceContent)));
        const page = pagesBySource.get(normalizedSource);
        if (!page) throw new Error(`Unable to resolve ${file}`);
        this.recordSuccessfulMdxPage(page, sourceContent);
      } catch (error) {
        if (!this.retainExistingMdxOutput) {
          this.removeSuccessfulMdxPage(normalizedSource);
        }
        console.error(chalk.red(`❌ Error processing ${file}:`), error);
      }
    }

    let successfulPages: PageMeta[] = [];
    try {
      successfulPages = await this.commitMdxSnapshot(realPages);
    } catch (error) {
      await this.rollbackFailedMdxCommit(error, previousState, pageCommits);
    }
    this.retainExistingMdxOutput = true;
    try {
      await this.refreshMdxDerivedOutput(realPages, successfulPages);
    } catch (error) {
      await this.rollbackCommittedMdxChange(error, previousState, pageCommits);
    }
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
    const nextSlugs = new Set<string>();
    const resolvedPages = pages ?? (await this.buildAllPagesMeta());
    const occupiedSlugs = new Set(resolvedPages.map((page) => page.slug));
    const resolvedDeclaredSlugs = new Set(occupiedSlugs);
    for (const slug of declaredSlugs ?? []) resolvedDeclaredSlugs.add(slug);

    if (this.sectionsConfig && this.sectionsConfig.length > 0) {
      for (const section of this.sectionsConfig) {
        if (section.slug === "") continue;

        // Check if a page already exists at the section root
        const hasIndex = resolvedDeclaredSlugs.has(section.slug);
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

  private generatedFileSegments(filePath: string): string[] {
    return path
      .relative(fs.realpathSync(this.outputDir), filePath)
      .split(path.sep)
      .filter(Boolean);
  }

  private async readGeneratedFile(filePath: string): Promise<string | null> {
    return readOutputFileIfPresent(
      this.outputDir,
      ...this.generatedFileSegments(filePath),
    );
  }

  private async restoreGeneratedFile(
    filePath: string,
    content: string | null,
  ): Promise<void> {
    const target = this.outputPath(...this.generatedFileSegments(filePath));
    if (content === null) {
      await fs.remove(target);
    } else {
      await writeFileAtomic(target, content);
    }
  }

  private async commitRenderedPage(
    pagePath: string,
    rendered: RenderedPage,
  ): Promise<GeneratedPageCommit> {
    if (rendered.rssRoute.action === "preserve") {
      const previousPage = await this.readGeneratedFile(pagePath);
      await writeFileAtomic(pagePath, rendered.pageContent);
      return {
        rollback: () => this.restoreGeneratedFile(pagePath, previousPage),
      };
    }

    const rssDir = resolveOutputPath(path.dirname(pagePath), "rss.xml");
    const rssPath = resolveOutputPath(
      path.dirname(pagePath),
      "rss.xml",
      "route.ts",
    );
    const [previousPage, previousRss] = await Promise.all([
      this.readGeneratedFile(pagePath),
      this.readGeneratedFile(rssPath),
    ]);
    let pageChanged = false;
    let rssChanged = false;

    try {
      if (rendered.rssRoute.action === "write") {
        await writeFileAtomic(rssPath, rendered.rssRoute.content);
        rssChanged = true;
        await writeFileAtomic(pagePath, rendered.pageContent);
        pageChanged = true;
      } else {
        await writeFileAtomic(pagePath, rendered.pageContent);
        pageChanged = true;
        await fs.remove(rssPath);
        rssChanged = true;
        await this.removeEmptyDirsUpTo(rssDir, path.dirname(pagePath));
      }
    } catch (error) {
      const rollbackErrors: unknown[] = [];
      if (rssChanged) {
        try {
          await this.restoreGeneratedFile(rssPath, previousRss);
        } catch (rollbackError) {
          rollbackErrors.push(rollbackError);
        }
      }
      if (pageChanged) {
        try {
          await this.restoreGeneratedFile(pagePath, previousPage);
        } catch (rollbackError) {
          rollbackErrors.push(rollbackError);
        }
      }
      if (rollbackErrors.length > 0) {
        throw new AggregateError(
          [error, ...rollbackErrors],
          `Unable to publish or restore generated page ${pagePath}`,
        );
      }
      throw error;
    }

    return {
      rollback: async () => {
        const rollbackErrors: unknown[] = [];
        try {
          await this.restoreGeneratedFile(rssPath, previousRss);
        } catch (error) {
          rollbackErrors.push(error);
        }
        try {
          await this.restoreGeneratedFile(pagePath, previousPage);
        } catch (error) {
          rollbackErrors.push(error);
        }
        if (rollbackErrors.length > 0) {
          throw new AggregateError(
            rollbackErrors,
            `Unable to restore generated page ${pagePath}`,
          );
        }
      },
    };
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
    return this.commitRenderedPage(pagePath, rendered);
  }

  /** Parses the configured OpenAPI spec(s) into the shared registry. */
  private async loadOpenApiRegistry(): Promise<void> {
    if (this.openApiSpecs.length === 0) return;
    this.apiRegistry = (
      await this.loadStableOpenApiRegistry(this.openApiSpecs)
    ).registry;
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
  private async writeApiPages(
    realPages?: PageMeta[],
    options: ApiPageWriteOptions = {},
  ): Promise<Map<string, string>> {
    const resolvedRealPages = realPages ?? (await this.buildRealPagesMeta());
    const blockedRealPages = [...resolvedRealPages];
    const blockedSlugs = new Set(blockedRealPages.map((page) => page.slug));
    for (const page of this.successfulMdxPages.values()) {
      if (blockedSlugs.has(page.slug)) continue;
      blockedSlugs.add(page.slug);
      blockedRealPages.push(page);
    }
    const occupiedMdxSlugs = new Set(
      [...this.successfulMdxPages.values()].map((page) => page.slug),
    );
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

  private async openApiSourceState(registry: OpenApiRegistry): Promise<string> {
    return (
      await Promise.all(
        registry.sourceFiles.map(async (sourcePath) => {
          return `${sourcePath}:${await this.sourceFs.pathState(sourcePath, true)}`;
        }),
      )
    ).join("\n");
  }

  private async loadStableOpenApiRegistry(
    specs: NormalizedOpenApiSpec[],
  ): Promise<{ registry: OpenApiRegistry; sourceState: string }> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const registry = new OpenApiRegistry();
      await registry.load(specs, this.rootDir, this.apiBaseSlug);
      const current = await this.openApiSourceState(registry);
      if (registry.sourceFingerprint === current) {
        return { registry, sourceState: current };
      }
    }
    throw new Error("OpenAPI sources changed repeatedly while being loaded");
  }

  private async applyStableOpenApiRefresh(
    specs: NormalizedOpenApiSpec[],
    syncWatcher: boolean,
  ): Promise<void> {
    let candidate = await this.loadStableOpenApiRegistry(specs);
    await this.applyOpenApiRefresh(candidate.registry, specs, syncWatcher);

    // Once the new watcher is ready, compare its source against the exact
    // version rendered above. A change in the retargeting window is replayed
    // explicitly because ignoreInitial watchers cannot report it.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      if (
        (await this.openApiSourceState(candidate.registry)) ===
        candidate.sourceState
      ) {
        return;
      }
      candidate = await this.loadStableOpenApiRegistry(specs);
      await this.applyOpenApiRefresh(candidate.registry, specs, false);
    }
    throw new Error("OpenAPI sources changed repeatedly while being generated");
  }

  /**
   * Reparses the spec(s) and rewrites everything derived from them: the
   * endpoint pages and allowlist, the sections (the "API Reference" section
   * appears and disappears with the registry), and the site aggregates.
   */
  private async applyOpenApiRefresh(
    nextRegistry: OpenApiRegistry,
    nextSpecs: NormalizedOpenApiSpec[],
    syncWatcher: boolean,
  ): Promise<void> {
    const previousRegistry = this.apiRegistry;
    const previousSpecs = this.openApiSpecs;
    const previousSections = this.sectionsConfig;
    const previousRoutes = this.artifacts.routesFor("openapi");
    const candidateRoutes = new Map<string, string>();
    let watcherSyncAttempted = false;

    try {
      this.apiRegistry = nextRegistry;
      this.openApiSpecs = nextSpecs;
      this.sectionsConfig = await this.resolveSections();
      await this.writeApiPages(undefined, { writtenRoutes: candidateRoutes });
      await this.refreshSiteAggregates();
      if (syncWatcher) {
        watcherSyncAttempted = true;
        await this.syncOpenApiSpecWatcher();
      }
    } catch (error) {
      this.apiRegistry = previousRegistry;
      this.openApiSpecs = previousSpecs;
      this.sectionsConfig = previousSections;
      const rollbackErrors: unknown[] = [];

      if (watcherSyncAttempted) {
        try {
          await this.syncOpenApiSpecWatcher();
        } catch (rollbackError) {
          rollbackErrors.push(rollbackError);
        }
      }
      const previousSlugs = new Set(previousRoutes.map((route) => route.slug));
      const occupiedMdxSlugs = new Set(
        [...this.successfulMdxPages.values()].map((page) => page.slug),
      );
      for (const slug of new Set(candidateRoutes.values())) {
        if (previousSlugs.has(slug) || occupiedMdxSlugs.has(slug)) continue;
        try {
          await this.removeOwnedRoute(slug);
        } catch (rollbackError) {
          rollbackErrors.push(rollbackError);
        }
      }
      try {
        await this.writeApiPages(undefined, {
          additionalPreviousRoutes: [...candidateRoutes].map(
            ([source, slug]) => ({ kind: "openapi", source, slug }),
          ),
        });
        await this.refreshSiteAggregates();
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }

      if (rollbackErrors.length > 0) {
        throw new AggregateError(
          [error, ...rollbackErrors],
          "Unable to apply or restore the OpenAPI reference",
        );
      }
      throw error;
    }
  }

  /** Reparses the spec(s) and regenerates the API reference on a watch event. */
  async handleOpenApiChange() {
    console.log(
      chalk.cyan("📘 OpenAPI spec changed - regenerating API reference"),
    );
    try {
      await this.applyStableOpenApiRefresh(this.openApiSpecs, true);
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
      const { data } = await this.sourceFs.readProjectSourceFile(
        configPath,
        "Doccupine configuration source",
      );
      config = validateConfig(JSON.parse(data.toString("utf8")), this.rootDir);
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
    try {
      // Validate the complete candidate before changing the active spec list or
      // its watcher. A half-written/invalid replacement keeps both the current
      // generated reference and its live watcher intact.
      await this.applyStableOpenApiRefresh(nextSpecs, true);
      console.log(chalk.green("✅ API reference updated"));
    } catch (error) {
      console.error(chalk.red("❌ Error updating API reference:"), error);
    }
  }

  async updatePagesIndex() {
    const files = await this.getAllMDXFiles();
    let indexMDX: HomepageSource | null = null;

    for (const file of files) {
      if (file === "index.mdx" || file === "./index.mdx") {
        const cached = this.successfulMdxContent.get(file.replace(/\\/g, "/"));
        if (this.mdxSnapshotInitialized && cached === undefined) break;
        const content = cached ?? (await this.readMdxSourceFile(file)).content;
        const { data: frontmatter, content: mdxContent } = safeMatter(
          content,
          file,
        );

        indexMDX = this.homepageSource(frontmatter, mdxContent);
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
    await this.commitRenderedPage(homePath, rendered);
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
    return this.commitRenderedPage(pagePath, rendered);
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
