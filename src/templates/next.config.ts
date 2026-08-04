import type { AnalyticsConfig } from "../lib/types.js";

export const nextConfigTemplate = (
  analyticsConfig: AnalyticsConfig | null = null,
): string => {
  const hasPostHog =
    analyticsConfig?.provider === "posthog" && !!analyticsConfig.posthog?.key;

  if (!hasPostHog) {
    return `import type { NextConfig } from "next";

// Dev-only allowlist for reaching the dev server through a non-localhost
// hostname (a LAN IP, a Tailscale/VPN name, ...). Next blocks its dev
// resources - including the HMR socket Turbopack needs before it hydrates
// the page - for hosts it does not know, which leaves the site rendered but
// inert. Comma-separated hostnames, set via ALLOWED_DEV_ORIGINS in .env;
// production builds ignore it.
const allowedDevOrigins = (process.env.ALLOWED_DEV_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  ...(allowedDevOrigins.length > 0 ? { allowedDevOrigins } : {}),
  compiler: {
    styledComponents: true,
  },
  // Type-checking runs through TypeScript 6's compiler API (the \`typescript\`
  // dependency is aliased to @typescript/typescript6, whose only binary is
  // \`tsc6\`). Next 16.3 defaults experimental.useTypeScriptCli to true, and
  // that path requires a \`tsc\` bin, so builds fail with a "typescript is not
  // installed" prompt unless the CLI path stays off.
  experimental: {
    useTypeScriptCli: false,
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

// Dev-only allowlist for reaching the dev server through a non-localhost
// hostname (a LAN IP, a Tailscale/VPN name, ...). Next blocks its dev
// resources - including the HMR socket Turbopack needs before it hydrates
// the page - for hosts it does not know, which leaves the site rendered but
// inert. Comma-separated hostnames, set via ALLOWED_DEV_ORIGINS in .env;
// production builds ignore it.
const allowedDevOrigins = (process.env.ALLOWED_DEV_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  ...(allowedDevOrigins.length > 0 ? { allowedDevOrigins } : {}),
  compiler: {
    styledComponents: true,
  },
  // Type-checking runs through TypeScript 6's compiler API (the \`typescript\`
  // dependency is aliased to @typescript/typescript6, whose only binary is
  // \`tsc6\`). Next 16.3 defaults experimental.useTypeScriptCli to true, and
  // that path requires a \`tsc\` bin, so builds fail with a "typescript is not
  // installed" prompt unless the CLI path stays off.
  experimental: {
    useTypeScriptCli: false,
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
        destination: ${JSON.stringify(`${assetsHost}/static/:path*`)},
      },
      {
        source: "/ingest/:path*",
        destination: ${JSON.stringify(`${host}/:path*`)},
      },
    ];
  },
};

export default nextConfig;
`;
};
