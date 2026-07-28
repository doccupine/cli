import type { PageMeta, SectionConfig } from "../../lib/types.js";
import { buildSectionGroups, pageUrl } from "./llmsIndex.js";

export interface SkillMdArgs {
  siteName: string;
  siteDescription?: string;
  baseUrl: string | null;
  pages: PageMeta[];
  sectionsConfig: SectionConfig[] | null;
}

const KEY_PAGE_LIMIT = 8;

function slugifySiteName(siteName: string): string {
  const slug = siteName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug === "" ? "docs" : slug;
}

// Identifier for the skill name and the MCP discovery manifest. Skips the
// -docs suffix when the site name already ends in "docs" ("Acme Docs" ->
// acme-docs, not acme-docs-docs).
export function siteDocsSlug(siteName: string): string {
  const slug = slugifySiteName(siteName);
  return slug === "docs" || slug.endsWith("-docs") ? slug : `${slug}-docs`;
}

// Agent skill definition served at /skill.md: tells agents how to read the
// docs (llms.txt index, .md mirrors, MCP server) and lists the first pages in
// navigation order as entry points. A user-authored public/skill.md in the
// watch dir overrides this file, since public assets are copied afterwards.
export function skillMdTemplate(args: SkillMdArgs): string {
  const { siteName, siteDescription, baseUrl, pages, sectionsConfig } = args;
  const prefix = baseUrl ?? "";
  const description = `Navigate and use the ${siteName} documentation. Use when answering questions about ${siteName} or working with its docs.`;

  const keyPages = buildSectionGroups(pages, sectionsConfig)
    .flatMap((group) => group.categories)
    .flatMap((cat) => cat.pages)
    .slice(0, KEY_PAGE_LIMIT);

  const lines: string[] = [];
  lines.push("---");
  lines.push(`name: ${siteDocsSlug(siteName)}`);
  lines.push(`description: ${JSON.stringify(description)}`);
  lines.push("---");
  lines.push("");
  lines.push(`# ${siteName} documentation`);
  lines.push("");
  if (siteDescription && siteDescription.trim() !== "") {
    lines.push(siteDescription.trim());
    lines.push("");
  }
  lines.push("## Reading these docs");
  lines.push("");
  lines.push(
    `- Documentation index: ${prefix}/llms.txt (full corpus: ${prefix}/llms-full.txt)`,
  );
  lines.push("- Every page has a markdown mirror: append .md to the page URL");
  lines.push(
    `- MCP server with search_docs, get_doc, and list_docs tools: ${prefix}/api/mcp (streamable HTTP)`,
  );
  lines.push("");
  if (keyPages.length > 0) {
    lines.push("## Key pages");
    lines.push("");
    for (const page of keyPages) {
      const desc =
        page.description && page.description.trim() !== ""
          ? ` - ${page.description.trim()}`
          : "";
      lines.push(`- [${page.title}](${pageUrl(page.slug, baseUrl)})${desc}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}
