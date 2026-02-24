import type { AnalyticsConfig } from "../lib/types.js";

export const nextConfigTemplate = (
  analyticsConfig: AnalyticsConfig | null = null,
): string => {
  const hasPostHog =
    analyticsConfig?.provider === "posthog" && !!analyticsConfig.posthog?.key;

  if (!hasPostHog) {
    return `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true,
  },
};

export default nextConfig;
`;
  }

  const host = analyticsConfig.posthog.host || "https://us.i.posthog.com";
  // Derive the assets host from the API host (e.g. https://us.i.posthog.com -> https://us-assets.i.posthog.com)
  const assetsHost = host
    .replace("://", "://" + "")
    .replace(".i.", "-assets.i.");

  return `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true,
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "${assetsHost}/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "${host}/:path*",
      },
    ];
  },
};

export default nextConfig;
`;
};
