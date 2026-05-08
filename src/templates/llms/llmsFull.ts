import type { PageMeta, SectionConfig } from "../../lib/types.js";

export interface PageWithBody extends PageMeta {
  body: string;
}

export interface LlmsFullArgs {
  siteName: string;
  siteDescription?: string;
  baseUrl: string | null;
  pages: PageWithBody[];
  sectionsConfig: SectionConfig[] | null;
}

function pageUrl(slug: string, baseUrl: string | null): string {
  if (baseUrl) {
    return slug === "" ? `${baseUrl}/` : `${baseUrl}/${slug}`;
  }
  return slug === "" ? "/" : `/${slug}`;
}

function orderedPages(
  pages: PageWithBody[],
  sectionsConfig: SectionConfig[] | null,
): PageWithBody[] {
  const sectionOrderIndex = new Map<string, number>();
  sectionOrderIndex.set("", 0);
  if (sectionsConfig) {
    sectionsConfig.forEach((section, idx) => {
      sectionOrderIndex.set(section.slug, idx + 1);
    });
  }

  return [...pages].sort((a, b) => {
    const sa = sectionOrderIndex.get(a.section) ?? 999;
    const sb = sectionOrderIndex.get(b.section) ?? 999;
    if (sa !== sb) return sa - sb;
    if (a.categoryOrder !== b.categoryOrder)
      return a.categoryOrder - b.categoryOrder;
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    if (a.order !== b.order) return a.order - b.order;
    return a.title.localeCompare(b.title);
  });
}

export function llmsFullTemplate(args: LlmsFullArgs): string {
  const { siteName, siteDescription, baseUrl, pages, sectionsConfig } = args;
  const lines: string[] = [];

  lines.push(`# ${siteName}`);
  lines.push("");
  lines.push(`> Full documentation for ${siteName}.`);
  if (siteDescription && siteDescription.trim() !== "") {
    lines.push("");
    lines.push(siteDescription.trim());
  }
  lines.push("");

  if (pages.length === 0) {
    return lines.join("\n") + "\n";
  }

  const sorted = orderedPages(pages, sectionsConfig);

  for (const page of sorted) {
    lines.push("---");
    lines.push("");
    lines.push(`# ${page.title}`);
    lines.push("");
    if (page.description && page.description.trim() !== "") {
      lines.push(`> ${page.description.trim()}`);
      lines.push("");
    }
    lines.push(`Source: ${pageUrl(page.slug, baseUrl)}`);
    lines.push("");
    lines.push(page.body.trim());
    lines.push("");
  }

  return lines.join("\n").replace(/\n+$/, "\n");
}
