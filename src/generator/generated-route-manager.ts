import chalk from "chalk";
import fs from "fs-extra";
import path from "node:path";

import {
  GeneratedArtifacts,
  type RouteArtifact,
} from "../lib/generated-artifacts.js";
import { resolveOutputPath } from "../lib/output-safety.js";
import type { PageMeta } from "../lib/types.js";

export class GeneratedRouteManager {
  private generatedSectionIndexSlugs = new Set<string>();
  private pendingStaleMdxRoutes = new Map<string, RouteArtifact>();

  constructor(
    private readonly outputDir: string,
    private readonly artifacts: GeneratedArtifacts,
  ) {}

  private outputPath(...segments: string[]): string {
    return resolveOutputPath(this.outputDir, ...segments);
  }

  routeForMdxSource(source: string): string | undefined {
    return this.artifacts.routeFor("mdx", source);
  }

  async replaceMdxRoutes(realPages: PageMeta[]): Promise<void> {
    await this.artifacts.replaceRoutesAndSave(
      "mdx",
      realPages
        .filter((page) => page.slug !== "")
        .map((page) => ({ source: page.path, slug: page.slug })),
    );
  }

  async removeMdxRoute(source: string): Promise<void> {
    await this.artifacts.removeRouteAndSave("mdx", source);
  }

  async removeOwnedRoute(slug: string): Promise<void> {
    if (!slug) return;
    const siteDir = this.outputPath("app", "(site)");
    const routeDir = resolveOutputPath(siteDir, slug);
    await Promise.all([
      fs.remove(resolveOutputPath(siteDir, slug, "page.tsx")),
      fs.remove(resolveOutputPath(siteDir, slug, "rss.xml")),
    ]);
    await this.removeEmptyDirsUpTo(routeDir, siteDir);
  }

  async removeStaleMdxRoutes(
    realPages: PageMeta[],
    removeOwnedRoute: (slug: string) => Promise<void>,
    previousRoutes: readonly RouteArtifact[] = this.artifacts.routesFor("mdx"),
  ): Promise<void> {
    const nextBySource = new Map(
      realPages
        .filter((page) => page.slug !== "")
        .map((page) => [page.path.replace(/\\/g, "/"), page.slug]),
    );
    const nextSlugs = new Set(nextBySource.values());
    const openApiSlugs = new Set(
      this.artifacts.routesFor("openapi").map((route) => route.slug),
    );

    for (const previous of previousRoutes) {
      if (nextBySource.get(previous.source) === previous.slug) continue;
      if (nextSlugs.has(previous.slug)) continue;
      if (openApiSlugs.has(previous.slug)) continue;
      this.pendingStaleMdxRoutes.set(previous.slug, previous);
    }

    const errors: unknown[] = [];
    for (const [slug] of this.pendingStaleMdxRoutes) {
      if (nextSlugs.has(slug)) {
        this.pendingStaleMdxRoutes.delete(slug);
        continue;
      }
      try {
        if (openApiSlugs.has(slug)) {
          await fs.remove(
            resolveOutputPath(this.outputDir, "app", "(site)", slug, "rss.xml"),
          );
        } else {
          await removeOwnedRoute(slug);
        }
        this.pendingStaleMdxRoutes.delete(slug);
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length > 0) {
      throw new AggregateError(errors, "Unable to remove stale MDX routes");
    }
  }

  async cleanupStaleSectionIndexPages(
    nextSlugs: Set<string>,
    occupiedSlugs: Set<string>,
    removeEmptyDirs: (dir: string, stopDir: string) => Promise<void>,
  ): Promise<void> {
    for (const stale of this.generatedSectionIndexSlugs) {
      if (nextSlugs.has(stale)) continue;
      if (occupiedSlugs.has(stale)) continue;
      const pagePath = resolveOutputPath(
        this.outputDir,
        "app",
        "(site)",
        stale,
        "page.tsx",
      );
      try {
        if (!(await fs.pathExists(pagePath))) continue;
        await fs.remove(pagePath);
        await removeEmptyDirs(
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
  async removeEmptyDirsUpTo(dir: string, stopDir: string): Promise<void> {
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
}
