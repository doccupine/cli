export const robotsTemplate = (hasSiteUrl: boolean): string => {
  if (!hasSiteUrl) {
    return `import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
  };
}
`;
  }

  return `import type { MetadataRoute } from "next";
import { config } from "@/utils/config";

function resolveBaseUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? config.url;
  if (!raw) return null;
  return raw.replace(/\\/$/, "");
}

export default function robots(): MetadataRoute.Robots {
  const base = resolveBaseUrl();
  const rules: MetadataRoute.Robots = {
    rules: {
      userAgent: "*",
      allow: "/",
    },
  };
  if (base) {
    rules.sitemap = \`\${base}/sitemap.xml\`;
  }
  return rules;
}
`;
};
