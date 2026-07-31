import fs from "fs-extra";
import path from "node:path";

import type { MDXFile } from "../lib/types.js";
import type { OperationDescriptor } from "../lib/openapi-types.js";
import {
  readOutputFileIfPresent,
  resolveOutputPath,
} from "../lib/output-safety.js";
import { writeFileAtomic } from "../lib/utils.js";
import {
  renderHomepage,
  renderMdxPage,
  renderSectionPage,
  type HomepageSource,
  type RenderedPage,
} from "./page-renderer.js";
import { GeneratedRouteManager } from "./generated-route-manager.js";

export interface GeneratedPageCommit {
  rollback(): Promise<void>;
}

export class GeneratedPagePublisher {
  constructor(
    private readonly outputDir: string,
    private readonly routeManager: GeneratedRouteManager,
  ) {}

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
    const target = resolveOutputPath(
      this.outputDir,
      ...this.generatedFileSegments(filePath),
    );
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
        await this.routeManager.removeEmptyDirsUpTo(
          rssDir,
          path.dirname(pagePath),
        );
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

  async generatePageFromMdx(
    mdxFile: MDXFile,
    options?: { apiOperation?: OperationDescriptor },
  ): Promise<GeneratedPageCommit> {
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

  async updateHomepage(
    source: HomepageSource | null,
    apiOperation?: OperationDescriptor,
  ): Promise<GeneratedPageCommit> {
    const rendered = renderHomepage(source, apiOperation);
    const pagePath = resolveOutputPath(
      this.outputDir,
      "app",
      "(site)",
      "page.tsx",
    );
    await fs.ensureDir(path.dirname(pagePath));
    return this.commitRenderedPage(pagePath, rendered);
  }

  async updateSectionIndex(
    sectionSlug: string,
    frontmatter: Record<string, any>,
    mdxContent: string,
    sourcePath?: string,
  ): Promise<GeneratedPageCommit> {
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
}
