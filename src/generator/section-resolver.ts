import { generateSlug } from "../lib/utils.js";
import { slugifySegment } from "../lib/openapi.js";
import type { SectionConfig } from "../lib/types.js";

export interface SectionDocument {
  filePath: string;
  frontmatter: Record<string, any>;
}

export interface SectionRoute {
  sectionSlug: string;
  pageSlug: string;
}

export function validateSectionsConfig(
  parsed: unknown,
): SectionConfig[] | null {
  if (!Array.isArray(parsed) || parsed.length === 0) return null;

  const seenLabels = new Set<string>();
  const seenSlugs = new Set<string>();
  return parsed.map((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw new Error(`sections.json entry ${index + 1} must be an object`);
    }
    const candidate = entry as Record<string, unknown>;
    const label =
      typeof candidate.label === "string" ? candidate.label.trim() : "";
    const slug =
      typeof candidate.slug === "string" ? candidate.slug.trim() : "";
    if (!label) {
      throw new Error(
        `sections.json entry ${index + 1} needs a non-empty label`,
      );
    }
    if (
      slug !== "" &&
      (slug !== slugifySegment(slug) ||
        slug.includes("/") ||
        slug === "." ||
        slug === "..")
    ) {
      throw new Error(
        `Unsafe section slug "${slug}"; use a lowercase URL segment such as "${slugifySegment(slug)}"`,
      );
    }
    if (seenLabels.has(label) || seenSlugs.has(slug)) {
      throw new Error(`Duplicate section label or slug at entry ${index + 1}`);
    }
    seenLabels.add(label);
    seenSlugs.add(slug);

    let directory: string | undefined;
    if (candidate.directory !== undefined) {
      if (typeof candidate.directory !== "string") {
        throw new Error(
          `sections.json directory at entry ${index + 1} must be a string`,
        );
      }
      directory = candidate.directory
        .replace(/\\/g, "/")
        .replace(/^\/+|\/+$/g, "");
      const parts = directory.split("/");
      if (
        !directory ||
        parts.some(
          (part) =>
            part === "." || part === ".." || part !== slugifySegment(part),
        )
      ) {
        throw new Error(`Unsafe section directory "${candidate.directory}"`);
      }
    }

    return { label, slug, ...(directory ? { directory } : {}) };
  });
}

export function discoverSections(
  documents: SectionDocument[],
): SectionConfig[] | null {
  const sectionMap = new Map<string, { label: string; order: number }>();
  let hasUnsectionedPages = false;
  let defaultSectionLabel = "Docs";

  for (const { filePath, frontmatter } of documents) {
    if (typeof frontmatter.section === "string" && frontmatter.section.trim()) {
      const label = frontmatter.section.trim();
      const order =
        typeof frontmatter.sectionOrder === "number"
          ? frontmatter.sectionOrder
          : 0;
      const existing = sectionMap.get(label);
      if (!existing || order < existing.order) {
        sectionMap.set(label, { label, order });
      }
    } else {
      hasUnsectionedPages = true;
    }

    if (
      (filePath === "index.mdx" || filePath === "./index.mdx") &&
      typeof frontmatter.sectionLabel === "string" &&
      frontmatter.sectionLabel.trim()
    ) {
      defaultSectionLabel = frontmatter.sectionLabel.trim();
    }
  }

  if (sectionMap.size === 0) return null;

  const sorted = [...sectionMap.values()].sort((a, b) => a.order - b.order);
  const sections: SectionConfig[] = [];

  if (hasUnsectionedPages) {
    sections.push({ label: defaultSectionLabel, slug: "" });
  }

  const usedSlugs = new Set<string>(sections.map((section) => section.slug));
  for (const section of sorted) {
    const slug = slugifySegment(section.label);
    if (usedSlugs.has(slug)) {
      throw new Error(
        `Section labels resolve to the same slug "${slug}". Rename one section or define sections.json explicitly.`,
      );
    }
    usedSlugs.add(slug);
    sections.push({ label: section.label, slug });
  }

  return sections;
}

export function addApiReferenceSection(
  sections: SectionConfig[] | null,
  hasApiReference: boolean,
  apiBaseSlug: string,
): SectionConfig[] | null {
  if (!hasApiReference) return sections;
  const apiSection: SectionConfig = {
    label: "API Reference",
    slug: apiBaseSlug,
  };
  if (!sections || sections.length === 0) {
    return [{ label: "Documentation", slug: "" }, apiSection];
  }
  if (sections.some((section) => section.slug === apiBaseSlug)) return sections;
  return [...sections, apiSection];
}

export function determineSectionRoute(
  filePath: string,
  frontmatter: Record<string, any>,
  sections: SectionConfig[] | null,
): SectionRoute {
  if (!sections || sections.length === 0) {
    return { sectionSlug: "", pageSlug: generateSlug(filePath) };
  }

  const normalizedPath = filePath.replace(/\\/g, "/");
  const firstDir = normalizedPath.includes("/")
    ? normalizedPath.split("/")[0]
    : "";

  for (const section of sections) {
    if (!section.directory) continue;
    const dirPrefix = section.directory + "/";
    if (normalizedPath.startsWith(dirPrefix)) {
      return {
        sectionSlug: section.slug,
        pageSlug: generateSlug(normalizedPath.slice(dirPrefix.length)),
      };
    }
  }

  if (firstDir) {
    const match = sections.find((section) => section.slug === firstDir);
    if (match) {
      const pathForSlug = normalizedPath.slice(firstDir.length + 1);
      return {
        sectionSlug: match.slug,
        pageSlug: generateSlug(pathForSlug),
      };
    }
  }

  if (frontmatter.section) {
    const label = frontmatter.section as string;
    const match = sections.find((section) => section.label === label);
    if (match) {
      let pathForSlug = filePath;
      if (firstDir && firstDir === match.slug) {
        pathForSlug = normalizedPath.slice(firstDir.length + 1);
      }

      return {
        sectionSlug: match.slug,
        pageSlug: generateSlug(pathForSlug),
      };
    }
  }

  return {
    sectionSlug: "",
    pageSlug: generateSlug(filePath),
  };
}
