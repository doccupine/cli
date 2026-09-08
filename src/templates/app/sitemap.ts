export interface SitemapEntry {
  slug: string;
  lastModified?: string;
  changeFrequency: "weekly";
  priority: number;
  /** hreflang -> slug of the same page in that language (languages.json). */
  alternates?: Record<string, string>;
}

function formatAlternates(alternates: Record<string, string>): string {
  const entries = Object.entries(alternates).map(([lang, slug]) => {
    const key = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(lang)
      ? lang
      : JSON.stringify(lang);
    return `${key}: ${JSON.stringify(slug)}`;
  });
  const inline = `    alternates: { ${entries.join(", ")} }`;
  // The caller appends a comma, which Prettier counts against the width.
  if (inline.length + 1 <= 80) return inline;
  return `    alternates: {\n${entries.map((entry) => `      ${entry},`).join("\n")}\n    }`;
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
      entry.alternates ? formatAlternates(entry.alternates) : null,
    ].filter(Boolean);
    return `  {\n${parts.join(",\n")},\n  }`;
  });
  return `[\n${lines.join(",\n")},\n]`;
}

export const sitemapTemplate = (entries: SitemapEntry[]): string => {
  const entriesLiteral = formatEntries(entries);
  const hasAlternates = entries.some((entry) => entry.alternates);

  // The hreflang mapping is emitted only for sites with translated pages, so
  // every other site's sitemap.ts is unchanged.
  const alternatesField = hasAlternates
    ? `
  alternates?: Record<string, string>;`
    : "";
  const alternatesHelper = hasAlternates
    ? `
function languageAlternates(
  base: string,
  alternates: Record<string, string>,
): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const [lang, slug] of Object.entries(alternates)) {
    languages[lang] = slug === "" ? base : \`\${base}/\${slug}\`;
  }
  return languages;
}
`
    : "";
  const alternatesSpread = hasAlternates
    ? `
    ...(entry.alternates
      ? {
          alternates: {
            languages: languageAlternates(base, entry.alternates),
          },
        }
      : {}),`
    : "";

  return `import type { MetadataRoute } from "next";
import { config } from "@/utils/config";

type ChangeFrequency =
  "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

interface Entry {
  slug: string;
  lastModified?: string;
  changeFrequency: ChangeFrequency;
  priority: number;${alternatesField}
}

const ENTRIES: Entry[] = ${entriesLiteral};

function resolveBaseUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? config.url;
  if (!raw) return null;
  return raw.replace(/\\/$/, "");
}
${alternatesHelper}
export default function sitemap(): MetadataRoute.Sitemap {
  const base = resolveBaseUrl();
  if (!base) return [];

  return ENTRIES.map((entry) => ({
    url: entry.slug === "" ? base : \`\${base}/\${entry.slug}\`,
    lastModified: entry.lastModified ? new Date(entry.lastModified) : undefined,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,${alternatesSpread}
  }));
}
`;
};
