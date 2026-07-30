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
  turbopack: {
    // Every painted color is a var(--color-*) reference, which polished cannot
    // parse - see utils/polishedCompat.ts. Older cherry-styled-components
    // releases call polished at render time, so route it through the shim.
    resolveAlias: {
      polished: "./utils/polishedCompat.ts",
    },
  },
  // Trace the runtime-loaded corpus and precomputed embeddings index into the
  // serverless functions (dynamic fs reads are invisible to automatic tracing).
  outputFileTracingIncludes: {
    "/api/rag": [
      "./services/mcp/docs-content.json",
      "./services/mcp/docs-index.json",
    ],
    "/api/mcp": [
      "./services/mcp/docs-content.json",
      "./services/mcp/docs-index.json",
    ],
  },
  // Discovery alias: agents probe /mcp for an MCP server. Auth for the alias
  // is handled in the middleware, which runs before this rewrite.
  async rewrites() {
    return [
      {
        source: "/mcp",
        destination: "/api/mcp",
      },
    ];
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
  turbopack: {
    // Every painted color is a var(--color-*) reference, which polished cannot
    // parse - see utils/polishedCompat.ts. Older cherry-styled-components
    // releases call polished at render time, so route it through the shim.
    resolveAlias: {
      polished: "./utils/polishedCompat.ts",
    },
  },
  // Trace the runtime-loaded corpus and precomputed embeddings index into the
  // serverless functions (dynamic fs reads are invisible to automatic tracing).
  outputFileTracingIncludes: {
    "/api/rag": [
      "./services/mcp/docs-content.json",
      "./services/mcp/docs-index.json",
    ],
    "/api/mcp": [
      "./services/mcp/docs-content.json",
      "./services/mcp/docs-index.json",
    ],
  },
  // The /mcp entry is a discovery alias: agents probe /mcp for an MCP server.
  // Auth for the alias is handled in the middleware, which runs before this
  // rewrite.
  async rewrites() {
    return [
      {
        source: "/mcp",
        destination: "/api/mcp",
      },
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
