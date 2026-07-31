import chalk from "chalk";

import type { RouteArtifact } from "../lib/generated-artifacts.js";
import type { OperationDescriptor } from "../lib/openapi-types.js";
import type { MDXFile, PageMeta, SectionConfig } from "../lib/types.js";
import { getFullSlug, safeMatter } from "../lib/utils.js";
import type { GeneratedPageCommit } from "./generated-page-publisher.js";
import { GeneratedRouteManager } from "./generated-route-manager.js";
import {
  MdxPassBuilder,
  type MdxPassSnapshot,
  type MdxSourceSnapshot,
} from "./mdx-pass-builder.js";
import { mergePages, RouteCollisionError } from "./page-catalog.js";
import { renderHomepage, type HomepageSource } from "./page-renderer.js";
import { SecureSourceFs } from "./secure-source-fs.js";

interface SuccessfulMdxState {
  pages: Map<string, PageMeta>;
  content: Map<string, string>;
  sourcesBySlug: Map<string, string>;
  collisionBlockedSources: Set<string>;
  sections: SectionConfig[] | null;
  routes: RouteArtifact[];
  snapshotInitialized: boolean;
}

interface MdxReconciliationCoordinatorOptions {
  sourceFs: SecureSourceFs;
  generatedRouteManager: GeneratedRouteManager;
  getAllMdxFiles(): Promise<string[]>;
  getSections(): SectionConfig[] | null;
  setSections(sections: SectionConfig[] | null): void;
  loadSectionsConfig(): Promise<SectionConfig[] | null>;
  withApiReferenceSection(
    sections: SectionConfig[] | null,
  ): SectionConfig[] | null;
  determineSectionForFile(
    filePath: string,
    frontmatter: Record<string, any>,
    sections?: SectionConfig[] | null,
  ): { sectionSlug: string; pageSlug: string };
  lookupOpenApi(reference: string): OperationDescriptor | undefined;
  isOpenApiRegistryEmpty(): boolean;
  syntheticOpenApiPages(): PageMeta[];
  getMdxRoutes(): RouteArtifact[];
  getOpenApiRoutes(): RouteArtifact[];
  replaceMdxRoutes(
    routes: Iterable<{ source: string; slug: string }>,
  ): Promise<void>;
  generatePageFromMdx(
    mdxFile: MDXFile,
    options?: { apiOperation?: OperationDescriptor },
  ): Promise<GeneratedPageCommit>;
  updateSectionIndex(
    sectionSlug: string,
    frontmatter: Record<string, any>,
    mdxContent: string,
    sourcePath?: string,
  ): Promise<GeneratedPageCommit>;
  writeApiPages(realPages?: PageMeta[]): Promise<Map<string, string>>;
  updatePagesIndex(pages?: readonly PageMeta[]): Promise<void>;
  updateRootLayout(pages?: PageMeta[]): Promise<void>;
  updateSitemap(pages?: PageMeta[]): Promise<void>;
  updateLlmsFiles(pages?: PageMeta[]): Promise<void>;
  generateSectionIndexPages(
    pages?: PageMeta[],
    declaredSlugs?: Set<string>,
  ): Promise<void>;
  maybeUpdateSections(): Promise<void>;
  removeOwnedRoute(slug: string): Promise<void>;
}

export class MdxReconciliationCoordinator {
  private readonly mdxPassBuilder: MdxPassBuilder;
  private retainExistingMdxOutput = true;
  private mdxSnapshotInitialized = false;
  private successfulMdxPages = new Map<string, PageMeta>();
  private successfulMdxContent = new Map<string, string>();
  private successfulMdxSourcesBySlug = new Map<string, string>();
  private collisionBlockedMdxSources = new Set<string>();

  constructor(private readonly options: MdxReconciliationCoordinatorOptions) {
    this.mdxPassBuilder = new MdxPassBuilder({
      sourceFs: options.sourceFs,
      getAllMdxFiles: () => options.getAllMdxFiles(),
      getSections: () => options.getSections(),
      loadSectionsConfig: () => options.loadSectionsConfig(),
      withApiReferenceSection: (sections) =>
        options.withApiReferenceSection(sections),
      determineSectionForFile: (filePath, frontmatter, sections) =>
        options.determineSectionForFile(filePath, frontmatter, sections),
      resolveHttpMethod: (reference) =>
        options.lookupOpenApi(reference)?.method,
    });
  }

  resetForInitialPublication(): void {
    this.retainExistingMdxOutput = false;
  }

  successfulPages(): PageMeta[] {
    return [...this.successfulMdxPages.values()];
  }

  occupiedSlugs(): Set<string> {
    return new Set(this.successfulPages().map((page) => page.slug));
  }

  blockOpenApiPages(realPages: PageMeta[]): PageMeta[] {
    const blockedRealPages = [...realPages];
    const blockedSlugs = new Set(blockedRealPages.map((page) => page.slug));
    for (const page of this.successfulMdxPages.values()) {
      if (blockedSlugs.has(page.slug)) continue;
      blockedSlugs.add(page.slug);
      blockedRealPages.push(page);
    }
    return blockedRealPages;
  }

  private async captureMdxPass(
    files?: string[],
    seededSources: ReadonlyMap<string, MdxSourceSnapshot> = new Map(),
    refreshSections = false,
  ): Promise<MdxPassSnapshot> {
    return this.mdxPassBuilder.capture(files, seededSources, refreshSections);
  }

  async buildRealPagesMeta(): Promise<PageMeta[]> {
    return (await this.captureMdxPass()).pages;
  }

  async buildAllPagesMeta(): Promise<PageMeta[]> {
    const real = await this.buildRealPagesMeta();
    const successful = this.mdxSnapshotInitialized
      ? this.successfulPagesInSourceOrder(real)
      : real;
    return this.mergeAllPagesMeta(
      successful,
      new Set([...real, ...successful].map((page) => page.slug)),
    );
  }

  private mergeAllPagesMeta(
    real: PageMeta[],
    declaredRealSlugs: Set<string> = new Set(real.map((page) => page.slug)),
  ): PageMeta[] {
    return mergePages(
      real,
      this.options.isOpenApiRegistryEmpty()
        ? []
        : this.options
            .syntheticOpenApiPages()
            .filter((page) => !declaredRealSlugs.has(page.slug)),
    );
  }

  private successfulPagesInSourceOrder(realPages: PageMeta[]): PageMeta[] {
    const currentSources = new Set(
      realPages.map((page) => page.path.replace(/\\/g, "/")),
    );
    const ordered = realPages.flatMap((page) => {
      const successful = this.successfulMdxPages.get(
        page.path.replace(/\\/g, "/"),
      );
      return successful ? [successful] : [];
    });
    for (const [source, page] of this.successfulMdxPages) {
      if (!currentSources.has(source)) ordered.push(page);
    }
    return ordered;
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
      sections:
        this.options.getSections()?.map((section) => ({ ...section })) ?? null,
      routes: this.options.getMdxRoutes(),
      snapshotInitialized: this.mdxSnapshotInitialized,
    };
  }

  private restoreSuccessfulMdxState(state: SuccessfulMdxState): void {
    this.successfulMdxPages = state.pages;
    this.successfulMdxContent = state.content;
    this.successfulMdxSourcesBySlug = state.sourcesBySlug;
    this.collisionBlockedMdxSources = state.collisionBlockedSources;
    this.options.setSections(state.sections);
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
      await this.options.replaceMdxRoutes(
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
    const previousRoutes = this.options.getMdxRoutes();
    await this.options.generatedRouteManager.replaceMdxRoutes(successfulPages);
    try {
      await this.options.generatedRouteManager.removeStaleMdxRoutes(
        successfulPages,
        (slug) => this.options.removeOwnedRoute(slug),
        previousRoutes,
      );
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
      !this.options.isOpenApiRegistryEmpty() ||
      this.options.getOpenApiRoutes().length > 0
    ) {
      await this.options.writeApiPages(realPages);
    }
    const declaredSlugs = new Set(realPages.map((page) => page.slug));
    const pages = this.mergeAllPagesMeta(successfulPages, declaredSlugs);
    await this.refreshSiteAggregates(pages, declaredSlugs);
  }

  async readAggregateMdxSource(filePath: string): Promise<{ content: string }> {
    const cached = this.successfulMdxContent.get(filePath.replace(/\\/g, "/"));
    if (this.mdxSnapshotInitialized && cached !== undefined) {
      return { content: cached };
    }
    return this.options.sourceFs.readMdxSourceFile(filePath);
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

  async readHomepageSource(
    pages?: readonly PageMeta[],
  ): Promise<HomepageSource | null> {
    const files = pages
      ? pages
          .map((page) => page.path)
          .filter((file) => file === "index.mdx" || file === "./index.mdx")
      : await this.options.getAllMdxFiles();

    for (const file of files) {
      if (file !== "index.mdx" && file !== "./index.mdx") continue;
      const cached = this.successfulMdxContent.get(file.replace(/\\/g, "/"));
      if (this.mdxSnapshotInitialized && cached === undefined) break;
      const content =
        cached ?? (await this.options.sourceFs.readMdxSourceFile(file)).content;
      const { data: frontmatter, content: mdxContent } = safeMatter(
        content,
        file,
      );
      return this.homepageSource(frontmatter, mdxContent);
    }
    return null;
  }

  private async writePageForFile(
    filePath: string,
    content: string,
  ): Promise<GeneratedPageCommit[]> {
    const commits: GeneratedPageCommit[] = [];
    const { data: frontmatter, content: mdxContent } = safeMatter(
      content,
      filePath,
    );
    const { sectionSlug, pageSlug } = this.options.determineSectionForFile(
      filePath,
      frontmatter,
    );
    const fullSlug = getFullSlug(pageSlug, sectionSlug);
    const isIndex = filePath === "index.mdx" || filePath === "./index.mdx";
    const isSectionIndex =
      this.options.getSections() && pageSlug === "" && sectionSlug !== "";

    try {
      if (isIndex) {
        console.log(chalk.blue("🏠 Updating homepage with index.mdx content"));
        renderHomepage(
          this.homepageSource(frontmatter, mdxContent),
          typeof frontmatter.openapi === "string"
            ? this.options.lookupOpenApi(frontmatter.openapi)
            : undefined,
        );
      } else {
        const mdxFile: MDXFile = {
          path: filePath,
          content: mdxContent,
          frontmatter,
          slug: fullSlug,
        };
        let apiOperation: OperationDescriptor | undefined;
        if (frontmatter.openapi) {
          apiOperation = this.options.lookupOpenApi(
            String(frontmatter.openapi),
          );
          if (!apiOperation) {
            console.error(
              chalk.red(
                `❌ openapi frontmatter "${frontmatter.openapi}" in ${filePath} not found in any spec`,
              ),
            );
          }
        }
        commits.push(
          await this.options.generatePageFromMdx(
            mdxFile,
            apiOperation ? { apiOperation } : undefined,
          ),
        );
      }

      if (isSectionIndex) {
        commits.push(
          await this.options.updateSectionIndex(
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

  async refreshSiteAggregates(
    resolvedPages?: PageMeta[],
    declaredSlugs?: Set<string>,
  ): Promise<void> {
    const pages = resolvedPages ?? (await this.buildAllPagesMeta());
    await this.options.updatePagesIndex(pages);
    await this.options.updateRootLayout(pages);
    await this.options.updateSitemap(pages);
    await this.options.updateLlmsFiles(pages);
    await this.options.generateSectionIndexPages(pages, declaredSlugs);
  }

  async handleFileChange(action: string, filePath: string): Promise<void> {
    console.log(chalk.cyan(`📝 File ${action}: ${filePath}`));
    const normalizedSource = filePath.replace(/\\/g, "/");
    const changedSource =
      await this.options.sourceFs.readMdxSourceFile(filePath);
    const previousState = this.captureSuccessfulMdxState();
    const pageCommits: GeneratedPageCommit[] = [];
    let pageRendered = false;

    try {
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
      this.options.setSections(snapshot.sections);

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
      await this.options.maybeUpdateSections();
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

  async handleFileDelete(filePath: string): Promise<void> {
    console.log(chalk.red(`🗑️ File deleted: ${filePath}`));
    const previousState = this.captureSuccessfulMdxState();
    const pageCommits: GeneratedPageCommit[] = [];
    try {
      const normalizedSource = filePath.replace(/\\/g, "/");
      if (filePath === "index.mdx" || filePath === "./index.mdx") {
        console.log(chalk.blue("🏠 Updating homepage - index.mdx deleted"));
      }
      const snapshot = await this.captureMdxPass(undefined, undefined, true);
      this.removeSuccessfulMdxPage(normalizedSource);
      this.collisionBlockedMdxSources.delete(normalizedSource);
      this.options.setSections(snapshot.sections);
      const realPages = snapshot.pages;
      await this.retryMdxPages(
        snapshot,
        (source, page) =>
          this.collisionBlockedMdxSources.has(source) ||
          this.successfulMdxPages.get(source)?.slug !== page.slug,
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
      await this.options.maybeUpdateSections();
    } catch (error) {
      console.error(
        chalk.red(`❌ Error removing page for ${filePath}:`),
        error,
      );
    }
  }

  async processAllMdxFiles(): Promise<void> {
    const previousState = this.captureSuccessfulMdxState();
    const pageCommits: GeneratedPageCommit[] = [];
    const files = await this.options.getAllMdxFiles();
    let snapshot: MdxPassSnapshot;
    try {
      snapshot = await this.captureMdxPass(files, undefined, true);
    } catch (error) {
      if (error instanceof RouteCollisionError) {
        for (const source of files) {
          this.collisionBlockedMdxSources.add(source.replace(/\\/g, "/"));
        }
      }
      throw error;
    }
    this.options.setSections(snapshot.sections);
    const realPages = snapshot.pages;
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
}
