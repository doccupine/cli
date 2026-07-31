import fs from "fs-extra";

import type { PageMeta, SectionConfig } from "../lib/types.js";
import {
  readOutputFileIfPresent,
  resolveOutputPath,
} from "../lib/output-safety.js";
import { writeFileAtomic } from "../lib/utils.js";
import { GeneratedRouteManager } from "./generated-route-manager.js";

type WriteRedirect = (slug: string, target: string) => Promise<void>;

export class SectionIndexGenerator {
  constructor(
    private readonly outputDir: string,
    private readonly routeManager: GeneratedRouteManager,
  ) {}

  async generate(
    pages: PageMeta[],
    sections: SectionConfig[] | null,
    declaredSlugs: Set<string> | undefined,
    writeRedirect: WriteRedirect,
  ): Promise<void> {
    const occupiedSlugs = new Set(pages.map((page) => page.slug));
    const resolvedDeclaredSlugs = new Set(occupiedSlugs);
    for (const slug of declaredSlugs ?? []) resolvedDeclaredSlugs.add(slug);
    const redirects = new Map<string, string>();

    for (const section of sections ?? []) {
      if (section.slug === "" || resolvedDeclaredSlugs.has(section.slug)) {
        continue;
      }
      const sectionPages = pages
        .filter((page) => page.section === section.slug)
        .sort((a, b) => {
          if (a.categoryOrder !== b.categoryOrder) {
            return a.categoryOrder - b.categoryOrder;
          }
          return a.order - b.order;
        });
      const firstPage = sectionPages[0];
      if (firstPage) redirects.set(section.slug, firstPage.slug);
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
