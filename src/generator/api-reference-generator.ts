import chalk from "chalk";
import fs from "fs-extra";
import path from "node:path";

import { GeneratedArtifacts } from "../lib/generated-artifacts.js";
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
  ): Promise<void> {
    const realSlugs = new Set(realPages.map((page) => page.slug));
    const nextRoutes = new Map<string, string>();

    const indexPage = registry
      .syntheticPages()
      .find((page) => page.slug === apiBaseSlug);
    if (indexPage && !realSlugs.has(indexPage.slug)) {
      try {
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
      } catch (error) {
        console.error(
          chalk.red(`❌ Error generating API index ${indexPage.slug}:`),
          error,
        );
      }
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
      try {
        await generatePage(mdxFile, { apiOperation: op });
        nextRoutes.set(`@openapi/${op.slug}`, op.slug);
      } catch (error) {
        console.error(
          chalk.red(`❌ Error generating API page ${op.slug}:`),
          error,
        );
      }
    }

    await writeAllowlist();
    await cleanupStalePages(nextRoutes, realSlugs);

    if (registry.all.length > 0) {
      console.log(
        chalk.green(`🧩 Generated ${nextRoutes.size} API reference page(s)`),
      );
    }
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
  ): Promise<void> {
    const nextSlugs = new Set(nextRoutes.values());
    for (const previous of this.artifacts.routesFor("openapi")) {
      if (nextRoutes.has(previous.source) || nextSlugs.has(previous.slug)) {
        continue;
      }
      // A hand-written page may have taken ownership of this route since the
      // previous OpenAPI pass. Never remove an output now claimed by MDX.
      if (occupiedMdxSlugs.has(previous.slug)) continue;
      try {
        await removeOwnedRoute(previous.slug);
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
}
