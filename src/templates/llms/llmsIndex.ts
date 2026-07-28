import type { PageMeta, SectionConfig } from "../../lib/types.js";

export interface LlmsIndexArgs {
  siteName: string;
  siteDescription?: string;
  baseUrl: string | null;
  pages: PageMeta[];
  sectionsConfig: SectionConfig[] | null;
}

export interface CategoryGroup {
  category: string;
  minCategoryOrder: number;
  pages: PageMeta[];
}

export interface SectionGroup {
  sectionSlug: string;
  sectionLabel: string;
  sectionOrder: number;
  categories: CategoryGroup[];
}

// Index links point at the static markdown mirrors (public/{slug}.md) so
// agents get clean markdown directly; the HTML page is the same URL without
// the .md suffix.
export function pageUrl(slug: string, baseUrl: string | null): string {
  const prefix = baseUrl ?? "";
  return slug === "" ? `${prefix}/index.md` : `${prefix}/${slug}.md`;
}

function comparePages(a: PageMeta, b: PageMeta): number {
  if (a.order !== b.order) return a.order - b.order;
  return a.title.localeCompare(b.title);
}

export function buildSectionGroups(
  pages: PageMeta[],
  sectionsConfig: SectionConfig[] | null,
): SectionGroup[] {
  const sectionOrderIndex = new Map<string, number>();
  sectionOrderIndex.set("", 0);
  if (sectionsConfig) {
    sectionsConfig.forEach((section, idx) => {
      sectionOrderIndex.set(section.slug, idx + 1);
    });
  }

  const sectionLabelByslug = new Map<string, string>();
  if (sectionsConfig) {
    for (const section of sectionsConfig) {
      sectionLabelByslug.set(section.slug, section.label);
    }
  }

  const bySection = new Map<string, PageMeta[]>();
  for (const page of pages) {
    const key = page.section || "";
    const list = bySection.get(key) ?? [];
    list.push(page);
    bySection.set(key, list);
  }

  const groups: SectionGroup[] = [];
  for (const [sectionSlug, sectionPages] of bySection) {
    const byCategory = new Map<string, PageMeta[]>();
    for (const page of sectionPages) {
      const key = page.category || "";
      const list = byCategory.get(key) ?? [];
      list.push(page);
      byCategory.set(key, list);
    }

    const categories: CategoryGroup[] = [];
    for (const [category, catPages] of byCategory) {
      catPages.sort(comparePages);
      const minCategoryOrder = catPages.reduce(
        (min, p) => Math.min(min, p.categoryOrder),
        Number.POSITIVE_INFINITY,
      );
      categories.push({
        category,
        minCategoryOrder: Number.isFinite(minCategoryOrder)
          ? minCategoryOrder
          : 0,
        pages: catPages,
      });
    }

    categories.sort((a, b) => {
      if (a.minCategoryOrder !== b.minCategoryOrder) {
        return a.minCategoryOrder - b.minCategoryOrder;
      }
      return a.category.localeCompare(b.category);
    });

    groups.push({
      sectionSlug,
      sectionLabel:
        sectionLabelByslug.get(sectionSlug) ??
        (sectionSlug === "" ? "Documentation" : sectionSlug),
      sectionOrder: sectionOrderIndex.get(sectionSlug) ?? 999,
      categories,
    });
  }

  groups.sort((a, b) => a.sectionOrder - b.sectionOrder);
  return groups;
}

export function llmsIndexTemplate(args: LlmsIndexArgs): string {
  const { siteName, siteDescription, baseUrl, pages, sectionsConfig } = args;
  const lines: string[] = [];

  const prefix = baseUrl ?? "";

  lines.push(`# ${siteName}`);
  lines.push("");
  const summary =
    siteDescription && siteDescription.trim() !== ""
      ? siteDescription.trim()
      : `Documentation for ${siteName}.`;
  lines.push(`> ${summary}`);
  lines.push("");
  lines.push(
    "Every page link below points to a markdown mirror; drop the .md suffix for the HTML version.",
  );
  lines.push(`Full corpus in one file: ${prefix}/llms-full.txt`);
  lines.push(`Agent skill: ${prefix}/skill.md`);
  lines.push(
    `MCP server (streamable HTTP; tools: search_docs, get_doc, list_docs): ${prefix}/api/mcp`,
  );
  lines.push("");

  if (pages.length === 0) {
    return lines.join("\n") + "\n";
  }

  const groups = buildSectionGroups(pages, sectionsConfig);

  for (const group of groups) {
    lines.push(`## ${group.sectionLabel}`);
    lines.push("");

    const useCategoryHeadings =
      group.categories.length > 1 ||
      (group.categories.length === 1 && group.categories[0].category !== "");

    for (const cat of group.categories) {
      if (useCategoryHeadings && cat.category !== "") {
        lines.push(`### ${cat.category}`);
        lines.push("");
      }
      for (const page of cat.pages) {
        const url = pageUrl(page.slug, baseUrl);
        const desc =
          page.description && page.description.trim() !== ""
            ? `: ${page.description.trim()}`
            : "";
        lines.push(`- [${page.title}](${url})${desc}`);
      }
      lines.push("");
    }
  }

  return lines.join("\n").replace(/\n+$/, "\n");
}
