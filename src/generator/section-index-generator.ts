import fs from "fs-extra";

import type { PageMeta, SectionConfig } from "../lib/types.js";
import {
  readOutputFileIfPresent,
  resolveOutputPath,
} from "../lib/output-safety.js";
import { writeFileAtomic } from "../lib/utils.js";
import {
  joinVariantSlug,
  listVariantPrefixes,
  pageVariantPrefix,
  type VariantSet,
} from "../lib/variants.js";
import { GeneratedRouteManager } from "./generated-route-manager.js";

type WriteRedirect = (slug: string, target: string) => Promise<void>;

function byNavOrder(a: PageMeta, b: PageMeta): number {
  if (a.categoryOrder !== b.categoryOrder) {
    return a.categoryOrder - b.categoryOrder;
  }
  return a.order - b.order;
}

export class SectionIndexGenerator {
  constructor(
    private readonly outputDir: string,
    private readonly routeManager: GeneratedRouteManager,
  ) {}

  /**
   * Redirect pages for every route that has pages beneath it but no page of
   * its own: each section's index (`/api` -> its first page) and, when
   * languages or versions are configured, each variant's home (`/de`,
   * `/v1`, `/de/v1`) and the section indexes inside it (`/de/api`). A real
   * page at that route (`docs/de/index.mdx`, `docs/api/index.mdx`) always
   * wins. Without variants this reproduces the single-tree behaviour exactly.
   */
  async generate(
    pages: PageMeta[],
    sections: SectionConfig[] | null,
    declaredSlugs: Set<string> | undefined,
    writeRedirect: WriteRedirect,
    variants: VariantSet | null = null,
  ): Promise<void> {
    const occupiedSlugs = new Set(pages.map((page) => page.slug));
    const resolvedDeclaredSlugs = new Set(occupiedSlugs);
    for (const slug of declaredSlugs ?? []) resolvedDeclaredSlugs.add(slug);
    const redirects = new Map<string, string>();
    const languages = variants?.languages ?? null;
    const versions = variants?.versions ?? null;
    const sectionOrder = new Map(
      (sections ?? []).map((section, index) => [section.slug, index]),
    );

    for (const prefix of listVariantPrefixes(languages, versions)) {
      const variantPages = variants
        ? pages.filter(
            (page) => pageVariantPrefix(page, languages, versions) === prefix,
          )
        : pages;

      if (prefix !== "" && !resolvedDeclaredSlugs.has(prefix)) {
        const firstPage = [...variantPages].sort((a, b) => {
          const sectionDelta =
            (sectionOrder.get(a.section) ?? Number.MAX_SAFE_INTEGER) -
            (sectionOrder.get(b.section) ?? Number.MAX_SAFE_INTEGER);
          return sectionDelta !== 0 ? sectionDelta : byNavOrder(a, b);
        })[0];
        if (firstPage) redirects.set(prefix, firstPage.slug);
      }

      for (const section of sections ?? []) {
        if (section.slug === "") continue;
        const route = joinVariantSlug(prefix, section.slug);
        if (resolvedDeclaredSlugs.has(route)) continue;
        const firstPage = variantPages
          .filter((page) => page.section === section.slug)
          .sort(byNavOrder)[0];
        if (firstPage) redirects.set(route, firstPage.slug);
      }
    }

    const previousSlugs = this.routeManager.sectionIndexSlugs();
    const touchedSlugs = new Set([...previousSlugs, ...redirects.keys()]);
    const previousFiles = new Map<string, string | null>();
    for (const slug of touchedSlugs) {
      previousFiles.set(
        slug,
        await readOutputFileIfPresent(
          this.outputDir,
          "app",
          "(site)",
          slug,
          "page.tsx",
        ),
      );
    }

    try {
      for (const [slug, target] of redirects) {
        await writeRedirect(slug, target);
      }
      await this.routeManager.cleanupStaleSectionIndexPages(
        new Set(redirects.keys()),
        occupiedSlugs,
        (dir, stopDir) => this.routeManager.removeEmptyDirsUpTo(dir, stopDir),
      );
    } catch (error) {
      const rollbackErrors: unknown[] = [];
      this.routeManager.replaceSectionIndexSlugs(previousSlugs);
      for (const [slug, content] of previousFiles) {
        try {
          const target = resolveOutputPath(
            this.outputDir,
            "app",
            "(site)",
            slug,
            "page.tsx",
          );
          if (content === null) {
            await fs.remove(target);
          } else {
            await writeFileAtomic(target, content);
          }
        } catch (rollbackError) {
          rollbackErrors.push(rollbackError);
        }
      }
      if (rollbackErrors.length > 0) {
        throw new AggregateError(
          [error, ...rollbackErrors],
          "Unable to generate or restore section index redirects",
        );
      }
      throw error;
    }
  }
}
