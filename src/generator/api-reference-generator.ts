import chalk from "chalk";
import fs from "fs-extra";
import path from "node:path";

import { GeneratedArtifacts } from "../lib/generated-artifacts.js";
import type { RouteArtifact } from "../lib/generated-artifacts.js";
import { buildEndpointDoc, OpenApiRegistry } from "../lib/openapi.js";
import type { OperationDescriptor } from "../lib/openapi-types.js";
import { resolveOutputPath } from "../lib/output-safety.js";
import type { MDXFile, PageMeta } from "../lib/types.js";
import { writeFileAtomic } from "../lib/utils.js";
import { mergePages as mergePageCatalog } from "./page-catalog.js";

type GeneratePage = (
  mdxFile: MDXFile,
  options?: { apiOperation?: OperationDescriptor },
) => Promise<void>;

type RemoveOwnedRoute = (slug: string) => Promise<void>;

type WriteAllowlist = () => Promise<void>;

type CleanupStalePages = (
  nextRoutes: Map<string, string>,
  realSlugs: Set<string>,
) => Promise<void>;

export class ApiReferenceGenerator {
  private pendingStaleRoutes = new Map<string, RouteArtifact>();

  constructor(
    private readonly outputDir: string,
    private readonly artifacts: GeneratedArtifacts,
  ) {}

  mergePages(registry: OpenApiRegistry, realPages: PageMeta[]): PageMeta[] {
    return mergePageCatalog(
      realPages,
      registry.isEmpty ? [] : registry.syntheticPages(),
    );
  }

  async writePages(
    registry: OpenApiRegistry,
    apiBaseSlug: string,
    realPages: PageMeta[],
    generatePage: GeneratePage,
    writeAllowlist: WriteAllowlist,
    cleanupStalePages: CleanupStalePages,
    writtenRoutes: Map<string, string> = new Map(),
  ): Promise<Map<string, string>> {
    const realSlugs = new Set(realPages.map((page) => page.slug));
    const nextRoutes = writtenRoutes;

    const indexPage = registry
      .syntheticPages()
      .find((page) => page.slug === apiBaseSlug);
    if (indexPage && !realSlugs.has(indexPage.slug)) {
      await generatePage({
        path: indexPage.path,
        content: registry.bodyForSlug(indexPage.slug) ?? "",
        frontmatter: {
          title: indexPage.title,
          description: indexPage.description,
        },
        slug: indexPage.slug,
      });
      nextRoutes.set(`@openapi/${indexPage.slug}`, indexPage.slug);
    }

    for (const op of registry.all) {
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
      await generatePage(mdxFile, { apiOperation: op });
      nextRoutes.set(`@openapi/${op.slug}`, op.slug);
    }

    await writeAllowlist();
    await cleanupStalePages(nextRoutes, realSlugs);

    if (registry.all.length > 0) {
      console.log(
        chalk.green(`🧩 Generated ${nextRoutes.size} API reference page(s)`),
      );
    }
    return nextRoutes;
  }

  async writeAllowlist(registry: OpenApiRegistry): Promise<void> {
    const target = resolveOutputPath(
      this.outputDir,
      "services",
      "openapi",
      "playground-allowlist.json",
    );
    await fs.ensureDir(path.dirname(target));
    await writeFileAtomic(
      target,
      `${JSON.stringify(registry.allowlist(), null, 2)}\n`,
    );
  }

  async cleanupStalePages(
    nextRoutes: Map<string, string>,
    occupiedMdxSlugs: Set<string>,
    removeOwnedRoute: RemoveOwnedRoute,
    additionalPreviousRoutes: Iterable<RouteArtifact> = [],
  ): Promise<void> {
    const previousRoutes = new Map(
      [
        ...this.artifacts.routesFor("openapi"),
        ...additionalPreviousRoutes,
        ...this.pendingStaleRoutes.values(),
      ].map((route) => [route.source, route]),
    );
    await this.artifacts.replaceRoutesAndSave(
      "openapi",
      [...nextRoutes].map(([source, slug]) => ({ source, slug })),
    );

    const nextSlugs = new Set(nextRoutes.values());
    for (const previous of previousRoutes.values()) {
      if (nextRoutes.has(previous.source) || nextSlugs.has(previous.slug)) {
        this.pendingStaleRoutes.delete(previous.source);
        continue;
      }
      // A hand-written page may have taken ownership of this route since the
      // previous OpenAPI pass. Never remove an output now claimed by MDX.
      if (occupiedMdxSlugs.has(previous.slug)) {
        this.pendingStaleRoutes.delete(previous.source);
        continue;
      }
      this.pendingStaleRoutes.set(previous.source, previous);
      try {
        await removeOwnedRoute(previous.slug);
        this.pendingStaleRoutes.delete(previous.source);
      } catch (error) {
        throw error;
      }
    }
  }
}
