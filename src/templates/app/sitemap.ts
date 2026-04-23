export interface SitemapEntry {
  slug: string;
  lastModified?: string;
  changeFrequency: "weekly";
  priority: number;
}

function formatEntries(entries: SitemapEntry[]): string {
  const lines = entries.map((entry) => {
    const parts = [
      `    slug: ${JSON.stringify(entry.slug)}`,
      entry.lastModified
        ? `    lastModified: ${JSON.stringify(entry.lastModified)}`
        : null,
      `    changeFrequency: ${JSON.stringify(entry.changeFrequency)}`,
      `    priority: ${entry.priority}`,
    ].filter(Boolean);
    return `  {\n${parts.join(",\n")},\n  }`;
  });
  return `[\n${lines.join(",\n")},\n]`;
}

export const sitemapTemplate = (entries: SitemapEntry[]): string => {
  const entriesLiteral = formatEntries(entries);

  return `import type { MetadataRoute } from "next";
import { config } from "@/utils/config";

type ChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

interface Entry {
  slug: string;
  lastModified?: string;
  changeFrequency: ChangeFrequency;
  priority: number;
}

const ENTRIES: Entry[] = ${entriesLiteral};

function resolveBaseUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? config.url;
  if (!raw) return null;
  return raw.replace(/\\/$/, "");
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = resolveBaseUrl();
  if (!base) return [];

  return ENTRIES.map((entry) => ({
    url: entry.slug === "" ? base : \`\${base}/\${entry.slug}\`,
    lastModified: entry.lastModified ? new Date(entry.lastModified) : undefined,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}
`;
};
