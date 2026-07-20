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
  // Bundle the precomputed embeddings index into the serverless functions that
  // read it (a dynamic fs read is invisible to Next's file tracing).
  outputFileTracingIncludes: {
    "/api/rag": ["./services/mcp/docs-index.json"],
    "/api/mcp": ["./services/mcp/docs-index.json"],
  },
};

export default nextConfig;
`;
  }

  const host = analyticsConfig.posthog.host || "https://us.i.posthog.com";
  // Derive the assets host from the API host
  // (https://us.i.posthog.com -> https://us-assets.i.posthog.com). Self-hosted
  // instances have no ".i." segment and serve assets from the same origin, so
  // they correctly fall through unchanged.
  const assetsHost = host.replace(".i.", "-assets.i.");

  return `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true,
  },
  // Bundle the precomputed embeddings index into the serverless functions that
  // read it (a dynamic fs read is invisible to Next's file tracing).
  outputFileTracingIncludes: {
    "/api/rag": ["./services/mcp/docs-index.json"],
    "/api/mcp": ["./services/mcp/docs-index.json"],
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
