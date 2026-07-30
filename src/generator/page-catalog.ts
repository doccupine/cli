import chalk from "chalk";

import type { PageMeta } from "../lib/types.js";
import { getFullSlug, safeMatter } from "../lib/utils.js";

type ReadMdxSource = (
  filePath: string,
) => Promise<{ content: string; stat: { mtime: Date } }>;

type ResolveSectionRoute = (
  filePath: string,
  frontmatter: Record<string, any>,
) => { sectionSlug: string; pageSlug: string };

type ResolveHttpMethod = (reference: string) => string | undefined;

export async function parseMdxPageMeta(
  filePath: string,
  readMdxSource: ReadMdxSource,
  resolveSectionRoute: ResolveSectionRoute,
  resolveHttpMethod: ResolveHttpMethod,
): Promise<PageMeta> {
  const { content, stat } = await readMdxSource(filePath);
  const { data: frontmatter } = safeMatter(content, filePath);
  const { sectionSlug, pageSlug } = resolveSectionRoute(filePath, frontmatter);
  const fullSlug = getFullSlug(pageSlug, sectionSlug);

  let lastModified: string | undefined;
  const authoredLastModified = frontmatter.updated ?? frontmatter.date;
  if (authoredLastModified) {
    const parsed = new Date(authoredLastModified);
    if (!Number.isNaN(parsed.getTime())) {
      lastModified = parsed.toISOString();
    }
  }
  if (!lastModified) {
    lastModified = stat.mtime.toISOString();
  }

  // Hand-written OpenAPI pages receive the same method badge as generated ones.
  const httpMethod = frontmatter.openapi
    ? resolveHttpMethod(String(frontmatter.openapi))?.toUpperCase()
    : undefined;

  return {
    slug: fullSlug,
    title: frontmatter.title || "Untitled",
    description: frontmatter.description || "",
    date: frontmatter.date || null,
    category: frontmatter.category || "",
    path: filePath,
    categoryOrder: frontmatter.categoryOrder || 0,
    order: frontmatter.order || 0,
    section: sectionSlug,
    ...(frontmatter.navIcon ? { navIcon: String(frontmatter.navIcon) } : {}),
    ...(frontmatter.categoryIcon
      ? { categoryIcon: String(frontmatter.categoryIcon) }
      : {}),
    ...(httpMethod ? { httpMethod } : {}),
    lastModified,
  };
}

export function validateRouteCollisions(pages: PageMeta[]): void {
  const bySlug = new Map<string, string>();
  for (const page of pages) {
    const existing = bySlug.get(page.slug);
    if (existing) {
      throw new Error(
        `Route collision at "/${page.slug}": both "${existing}" and "${page.path}" generate the same page.`,
      );
    }
    bySlug.set(page.slug, page.path);
  }
}

export async function buildRealPagesMeta(
  files: string[],
  parsePage: (filePath: string) => Promise<PageMeta>,
): Promise<PageMeta[]> {
  const pages = await Promise.all(files.map((file) => parsePage(file)));
  validateRouteCollisions(pages);
  return pages;
}

export function mergePages(
  realPages: PageMeta[],
  syntheticPages: PageMeta[],
): PageMeta[] {
  if (syntheticPages.length === 0) return realPages;

  const realSlugs = new Set(realPages.map((page) => page.slug));
  const unshadowedSyntheticPages = syntheticPages.filter((page) => {
    if (realSlugs.has(page.slug)) {
      console.log(
        chalk.yellow(
          `⚠️ API page ${page.slug} is shadowed by a hand-written page; skipping`,
        ),
      );
      return false;
    }
    return true;
  });
  return [...realPages, ...unshadowedSyntheticPages];
}
