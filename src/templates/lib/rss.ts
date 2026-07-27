export const rssLibTemplate = `import { config } from "@/utils/config";

export interface RssItem {
  title: string;
  anchor: string;
  description: string;
}

export interface RssFeedData {
  // Page path relative to the site root, e.g. "update" or "guides/setup".
  pagePath: string;
  // Channel title; null falls back to the site name from config.json.
  title: string | null;
  // Channel description; null falls back to the config.json description.
  description: string | null;
  items: RssItem[];
}

// Same base-URL resolution as sitemap.ts/robots.ts: env override first, then
// config.json. Without either, feed links degrade to root-relative paths.
function resolveBaseUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? config.url;
  if (!raw) return null;
  return raw.replace(/\\/$/, "");
}

// Ampersand first, or it would re-escape the other entities.
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Builds the RSS 2.0 document for a page's subscribable changelog. Entry
// descriptions arrive as pure Markdown (components, code, and HTML were
// removed at generation time) and are entity-escaped here, so no CDATA
// sections are needed. Entries carry no pubDate: the guid is the entry's
// permalink, so feed readers surface new entries when new guids appear.
export function buildRssFeed(feed: RssFeedData): string {
  const base = resolveBaseUrl();
  const pageUrl = base ? \`\${base}/\${feed.pagePath}\` : \`/\${feed.pagePath}\`;
  const feedUrl = \`\${pageUrl}/rss.xml\`;
  const siteName = config.name || "Documentation";
  const title = feed.title ?? siteName;
  const description = feed.description ?? config.description ?? title;

  const items = feed.items.map((item) => {
    const link = \`\${pageUrl}#\${item.anchor}\`;
    return [
      "    <item>",
      \`      <title>\${escapeXml(item.title)}</title>\`,
      \`      <link>\${escapeXml(link)}</link>\`,
      \`      <guid isPermaLink="true">\${escapeXml(link)}</guid>\`,
      \`      <description>\${escapeXml(item.description)}</description>\`,
      "    </item>",
    ].join("\\n");
  });

  return [
    \`<?xml version="1.0" encoding="UTF-8"?>\`,
    \`<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\`,
    "  <channel>",
    \`    <title>\${escapeXml(title)}</title>\`,
    \`    <link>\${escapeXml(pageUrl)}</link>\`,
    \`    <description>\${escapeXml(description)}</description>\`,
    \`    <atom:link href="\${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />\`,
    \`    <lastBuildDate>\${new Date().toUTCString()}</lastBuildDate>\`,
    \`    <copyright>\${escapeXml(siteName)}</copyright>\`,
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\\n");
}
`;
