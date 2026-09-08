import chalk from "chalk";
import fs from "fs-extra";

import { resolveOutputPath } from "../lib/output-safety.js";
import type {
  LanguageConfig,
  PageMeta,
  SectionConfig,
  VersionConfig,
} from "../lib/types.js";
import { isMdxPath, safeMatter, writeFileAtomic } from "../lib/utils.js";
import {
  buildLanguageAlternates,
  joinVariantSlug,
  listVariantPrefixes,
  pageVariantPrefix,
  resolveVariantFromSlug,
  type VariantSet,
} from "../lib/variants.js";
import { robotsTemplate } from "../templates/app/robots.js";
import {
  sitemapTemplate,
  type SitemapEntry,
} from "../templates/app/sitemap.js";
import {
  llmsFullTemplate,
  type PageWithBody,
} from "../templates/llms/llmsFull.js";
import {
  llmsIndexTemplate,
  type LlmsVariantLink,
} from "../templates/llms/llmsIndex.js";
import { skillMdTemplate } from "../templates/llms/skillMd.js";
import type { PublicAssetManager } from "./public-asset-manager.js";

export interface SiteMetadata {
  url: string | null;
  name: string;
  description: string;
}

type ResolvePages = () => Promise<PageMeta[]>;
type ReadMdxSource = (filePath: string) => Promise<{ content: string }>;
type ReadOpenApiBody = (slug: string) => string | undefined;
type ReadConfigSource = () => Promise<string | null>;

export async function loadSiteUrl(
  readConfigSource: ReadConfigSource,
): Promise<string | null> {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  try {
    const content = await readConfigSource();
    if (content !== null) {
      const parsed = JSON.parse(content) as { url?: unknown };
      if (typeof parsed.url === "string" && parsed.url.trim() !== "") {
        return parsed.url.trim().replace(/\/$/, "");
      }
    }
  } catch (error) {
    console.warn(chalk.yellow("⚠️ Error reading config.json"), error);
  }

  return null;
}

export async function loadSiteMetadata(
  readConfigSource: ReadConfigSource,
): Promise<SiteMetadata> {
  let url: string | null = null;
  let name = "Documentation";
  let description = "";

  try {
    const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (fromEnv) url = fromEnv.replace(/\/$/, "");
    const content = await readConfigSource();
    if (content !== null) {
      const parsed = JSON.parse(content) as {
        url?: unknown;
        name?: unknown;
        title?: unknown;
        description?: unknown;
      };
      if (!url && typeof parsed.url === "string" && parsed.url.trim() !== "") {
        url = parsed.url.trim().replace(/\/$/, "");
      }
      if (typeof parsed.name === "string" && parsed.name.trim() !== "") {
        name = parsed.name.trim();
      } else if (
        typeof parsed.title === "string" &&
        parsed.title.trim() !== ""
      ) {
        name = parsed.title.trim();
      }
      if (
        typeof parsed.description === "string" &&
        parsed.description.trim() !== ""
      ) {
        description = parsed.description.trim();
      }
    }
  } catch (error) {
    console.warn(
      chalk.yellow("⚠️ Error reading config.json for llms metadata"),
      error,
    );
  }

  return { url, name, description };
}

export function buildSitemapEntries(
  pages: PageMeta[],
  sectionsConfig: SectionConfig[] | null,
  variants: VariantSet | null = null,
): SitemapEntry[] {
  const sectionSlugs = new Set(
    (sectionsConfig || [])
      .map((section) => section.slug)
      .filter(
        (slug): slug is string => typeof slug === "string" && slug !== "",
      ),
  );
  // Section indexes rank 0.8 in every language/version, as do the variant
  // homes themselves (`de`, `v1`).
  const prominentSlugs = new Set<string>();
  for (const prefix of listVariantPrefixes(
    variants?.languages ?? null,
    variants?.versions ?? null,
  )) {
    if (prefix !== "") prominentSlugs.add(prefix);
    for (const slug of sectionSlugs) {
      prominentSlugs.add(joinVariantSlug(prefix, slug));
    }
  }
  const alternates = buildLanguageAlternates(
    pages,
    variants?.languages ?? null,
  );

  const entries: SitemapEntry[] = pages.map((page) => {
    let priority = 0.5;
    if (page.slug === "") {
      priority = 1.0;
    } else if (prominentSlugs.has(page.slug)) {
      priority = 0.8;
    }
    const pageAlternates = alternates.get(page.slug);
    return {
      slug: page.slug,
      lastModified: page.lastModified,
      changeFrequency: "weekly",
      priority,
      ...(pageAlternates
        ? {
            alternates: Object.fromEntries(
              Object.entries(pageAlternates).map(([lang, href]) => [
                lang,
                href.replace(/^\/+/, ""),
              ]),
            ),
          }
        : {}),
    };
  });

  if (!entries.some((entry) => entry.slug === "")) {
    entries.unshift({
      slug: "",
      changeFrequency: "weekly",
      priority: 1.0,
    });
  }

  return entries;
}

export async function writeSitemap(
  outputDir: string,
  sectionsConfig: SectionConfig[] | null,
  resolvePages: ResolvePages,
  resolveSiteUrl: () => Promise<string | null>,
  variants: VariantSet | null = null,
): Promise<void> {
  const siteUrl = await resolveSiteUrl();
  const entries = buildSitemapEntries(
    await resolvePages(),
    sectionsConfig,
    variants,
  );
  await writeFileAtomic(
    resolveOutputPath(outputDir, "app", "sitemap.ts"),
    sitemapTemplate(entries),
  );
  console.log(
    chalk.green(
      `🗺️ Generated sitemap.ts with ${entries.length} page(s)${
        siteUrl ? ` using ${siteUrl}` : " (waiting for a deployment URL)"
      }`,
    ),
  );
}

export async function writeRobots(
  outputDir: string,
  resolveSiteUrl: () => Promise<string | null>,
): Promise<void> {
  const siteUrl = await resolveSiteUrl();
  await writeFileAtomic(
    resolveOutputPath(outputDir, "app", "robots.ts"),
    robotsTemplate,
  );
  console.log(
    chalk.green(
      siteUrl
        ? `🤖 Regenerated robots.ts with sitemap link`
        : `🤖 Regenerated robots.ts (no sitemap link)`,
    ),
  );
}

export async function collectPageBodies(
  pages: PageMeta[],
  readMdxSource: ReadMdxSource,
  readOpenApiBody: ReadOpenApiBody,
): Promise<PageWithBody[]> {
  return Promise.all(
    pages.map(async (page) => {
      if (!isMdxPath(page.path)) {
        return { ...page, body: readOpenApiBody(page.slug) ?? "" };
      }
      const { content: raw } = await readMdxSource(page.path);
      const { content: body } = safeMatter(raw, page.path);
      return { ...page, body };
    }),
  );
}

/** "Deutsch", "v1.0", or "Deutsch (v1.0)": the label of a variant prefix. */
function variantLabel(
  prefix: string,
  languages: LanguageConfig[] | null,
  versions: VersionConfig[] | null,
): string {
  const { locale, version } = resolveVariantFromSlug(
    prefix,
    languages,
    versions,
  );
  const language = languages?.find((entry) => entry.code === locale)?.label;
  const versionLabel = versions?.find((entry) => entry.slug === version)?.label;
  if (language && versionLabel) return `${language} (${versionLabel})`;
  return language ?? versionLabel ?? prefix;
}

export async function writeLlmsFiles(
  outputDir: string,
  sectionsConfig: SectionConfig[] | null,
  resolvePages: ResolvePages,
  readMdxSource: ReadMdxSource,
  readOpenApiBody: ReadOpenApiBody,
  resolveSiteMetadata: () => Promise<SiteMetadata>,
  publicAssetManager: PublicAssetManager,
  variants: VariantSet | null = null,
): Promise<void> {
  await fs.ensureDir(resolveOutputPath(outputDir, "public"));

  const { url: baseUrl, name, description } = await resolveSiteMetadata();
  const resolvedPages = await resolvePages();
  const pagesWithBodies = await collectPageBodies(
    resolvedPages,
    readMdxSource,
    readOpenApiBody,
  );
  const docsContent = pagesWithBodies.map((page) => {
    const route = page.slug.replace(/^\/+|\/+$/g, "");
    const pagePath = route
      ? `app/(site)/${route}/page.tsx`
      : "app/(site)/page.tsx";
    return {
      uri: `docs://${route || "/"}`,
      name: page.title,
      path: pagePath,
      content: page.body,
      // Present only on sites that configure languages.json / versions.json.
      ...(page.locale !== undefined ? { locale: page.locale } : {}),
      ...(page.version !== undefined ? { version: page.version } : {}),
    };
  });
  await writeFileAtomic(
    resolveOutputPath(outputDir, "services", "mcp", "docs-content.json"),
    JSON.stringify(docsContent, null, 2) + "\n",
  );

  // Each language/version gets its own llms.txt and llms-full.txt under its
  // URL prefix; the root files describe the default variant and link to the
  // others. Without variants there is exactly one group, the root.
  const languages = variants?.languages ?? null;
  const versions = variants?.versions ?? null;
  const prefixes = listVariantPrefixes(languages, versions);
  const pagesByPrefix = new Map<string, PageWithBody[]>(
    prefixes.map((prefix) => [prefix, []]),
  );
  for (const page of pagesWithBodies) {
    const prefix = variants ? pageVariantPrefix(page, languages, versions) : "";
    pagesByPrefix.get(prefix)?.push(page);
  }
  const urlPrefix = baseUrl ?? "";
  const linksFor = (current: string) =>
    prefixes.length > 1
      ? {
          heading: "Other languages and versions",
          links: prefixes
            .filter((prefix) => prefix !== current)
            .map((prefix): LlmsVariantLink => ({
              label: variantLabel(prefix, languages, versions),
              url: `${urlPrefix}/${joinVariantSlug(prefix, "llms.txt")}`,
            })),
        }
      : undefined;

  const rootPages = pagesByPrefix.get("") ?? [];
  const indexContent = llmsIndexTemplate({
    siteName: name,
    siteDescription: description,
    baseUrl,
    pages: rootPages,
    sectionsConfig,
    variantLinks: linksFor(""),
  });
  const fullContent = llmsFullTemplate({
    siteName: name,
    siteDescription: description,
    baseUrl,
    pages: rootPages,
    sectionsConfig,
  });

  await publicAssetManager.writePublicAggregate("llms.txt", indexContent);
  await publicAssetManager.writePublicAggregate("llms-full.txt", fullContent);

  const variantAggregates = new Map<string, string>();
  for (const prefix of prefixes) {
    if (prefix === "") continue;
    const variantPages = pagesByPrefix.get(prefix) ?? [];
    variantAggregates.set(
      `${prefix}/llms.txt`,
      llmsIndexTemplate({
        siteName: name,
        siteDescription: description,
        baseUrl,
        pages: variantPages,
        sectionsConfig,
        variantLinks: linksFor(prefix),
        variantPrefix: prefix,
      }),
    );
    variantAggregates.set(
      `${prefix}/llms-full.txt`,
      llmsFullTemplate({
        siteName: name,
        siteDescription: description,
        baseUrl,
        pages: variantPages,
        sectionsConfig,
      }),
    );
  }
  // Also runs when the variant files were just removed, so the aggregates of
  // a previous run are cleaned up; a site that never had any skips it.
  if (variantAggregates.size > 0 || publicAssetManager.hasVariantAggregates()) {
    await publicAssetManager.syncVariantAggregates(variantAggregates);
  }

  const skillContent = skillMdTemplate({
    siteName: name,
    siteDescription: description,
    baseUrl,
    pages: rootPages,
    sectionsConfig,
  });
  await publicAssetManager.writePublicAggregate("skill.md", skillContent);

  await publicAssetManager.syncMcpManifest(baseUrl, name);
  await publicAssetManager.syncLlmsPageFiles(pagesWithBodies, baseUrl);

  console.log(
    chalk.green(
      `🤖 Generated llms.txt and llms-full.txt with ${resolvedPages.length} page(s)${
        baseUrl ? ` using ${baseUrl}` : " (relative URLs)"
      }`,
    ),
  );
}
