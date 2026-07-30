import chalk from "chalk";
import fs from "fs-extra";
import path from "node:path";

import { resolveOutputPath } from "../lib/output-safety.js";
import type { PageMeta, SectionConfig } from "../lib/types.js";
import { safeMatter, writeFileAtomic } from "../lib/utils.js";
import { robotsTemplate } from "../templates/app/robots.js";
import {
  sitemapTemplate,
  type SitemapEntry,
} from "../templates/app/sitemap.js";
import {
  llmsFullTemplate,
  type PageWithBody,
} from "../templates/llms/llmsFull.js";
import { llmsIndexTemplate } from "../templates/llms/llmsIndex.js";
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

export async function loadSiteUrl(rootDir: string): Promise<string | null> {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const configPath = path.join(rootDir, "config.json");

  try {
    if (await fs.pathExists(configPath)) {
      const content = await fs.readFile(configPath, "utf8");
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

export async function loadSiteMetadata(rootDir: string): Promise<SiteMetadata> {
  const configPath = path.join(rootDir, "config.json");
  let url: string | null = null;
  let name = "Documentation";
  let description = "";

  try {
    const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (fromEnv) url = fromEnv.replace(/\/$/, "");
    if (await fs.pathExists(configPath)) {
      const content = await fs.readFile(configPath, "utf8");
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
): SitemapEntry[] {
  const sectionSlugs = new Set(
    (sectionsConfig || [])
      .map((section) => section.slug)
      .filter(
        (slug): slug is string => typeof slug === "string" && slug !== "",
      ),
  );

  const entries: SitemapEntry[] = pages.map((page) => {
    let priority = 0.5;
    if (page.slug === "") {
      priority = 1.0;
    } else if (sectionSlugs.has(page.slug)) {
      priority = 0.8;
    }
    return {
      slug: page.slug,
      lastModified: page.lastModified,
      changeFrequency: "weekly",
      priority,
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
): Promise<void> {
  const siteUrl = await resolveSiteUrl();
  const entries = buildSitemapEntries(await resolvePages(), sectionsConfig);
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
      if (!page.path.endsWith(".mdx")) {
        return { ...page, body: readOpenApiBody(page.slug) ?? "" };
      }
      const { content: raw } = await readMdxSource(page.path);
      const { content: body } = safeMatter(raw, page.path);
      return { ...page, body };
    }),
  );
}

export async function writeLlmsFiles(
  outputDir: string,
  sectionsConfig: SectionConfig[] | null,
  resolvePages: ResolvePages,
  readMdxSource: ReadMdxSource,
  readOpenApiBody: ReadOpenApiBody,
  resolveSiteMetadata: () => Promise<SiteMetadata>,
  publicAssetManager: PublicAssetManager,
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
    };
  });
  await writeFileAtomic(
    resolveOutputPath(outputDir, "services", "mcp", "docs-content.json"),
    JSON.stringify(docsContent, null, 2) + "\n",
  );

  const indexContent = llmsIndexTemplate({
    siteName: name,
    siteDescription: description,
    baseUrl,
    pages: resolvedPages,
    sectionsConfig,
  });
  const fullContent = llmsFullTemplate({
    siteName: name,
    siteDescription: description,
    baseUrl,
    pages: pagesWithBodies,
    sectionsConfig,
  });

  await publicAssetManager.writePublicAggregate("llms.txt", indexContent);
  await publicAssetManager.writePublicAggregate("llms-full.txt", fullContent);

  const skillContent = skillMdTemplate({
    siteName: name,
    siteDescription: description,
    baseUrl,
    pages: resolvedPages,
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
