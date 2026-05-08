import type { PageWithBody } from "./llmsFull.js";

function pageUrl(slug: string, baseUrl: string | null): string {
  if (baseUrl) {
    return slug === "" ? `${baseUrl}/` : `${baseUrl}/${slug}`;
  }
  return slug === "" ? "/" : `/${slug}`;
}

export function llmsPageTemplate(
  page: PageWithBody,
  baseUrl: string | null,
): string {
  const lines: string[] = [];
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
  return lines.join("\n");
}
