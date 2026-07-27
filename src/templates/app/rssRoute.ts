import { toJsStringLiteral } from "../../lib/utils.js";

export interface RssRouteData {
  pagePath: string;
  title: string | null;
  description: string | null;
  items: { title: string; anchor: string; description: string }[];
}

export const rssRouteTemplate = (feed: RssRouteData): string => {
  // JSON.stringify + toJsStringLiteral is total escaping for arbitrary entry
  // strings (quotes, newlines, backticks), and JSON.parse at load undoes it -
  // the same trick as the OpenAPI operation embed in generatePageFromMDX.
  // The call always overflows 80 cols, so emit it pre-wrapped in the shape
  // Prettier produces (argument on its own line with a trailing comma) to
  // keep generated routes format-stable without running a formatter.
  const arg = toJsStringLiteral(JSON.stringify(feed));
  const inline = `const FEED: RssFeedData = JSON.parse(${arg});`;
  const decl =
    inline.length <= 80
      ? inline
      : `const FEED: RssFeedData = JSON.parse(\n  ${arg},\n);`;

  return `import { buildRssFeed, type RssFeedData } from "@/lib/rss";

// Feed data is extracted from this page's MDX at generation time.
${decl}

// The feed derives entirely from generation-time content, so it renders once
// at build and serves from the static cache like the page it belongs to.
export const dynamic = "force-static";
export const revalidate = false;

export function GET(): Response {
  return new Response(buildRssFeed(FEED), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
`;
};
