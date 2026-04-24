import type { AnalyticsConfig } from "../lib/types.js";

export const proxyTemplate = (
  analyticsConfig: AnalyticsConfig | null = null,
): string => {
  const hasPostHog =
    analyticsConfig?.provider === "posthog" && !!analyticsConfig.posthog?.key;

  const posthogImport = hasPostHog
    ? `import { getPostHogServerClient } from "@/lib/posthog";\n`
    : "";

  const posthogPageviewFn = hasPostHog
    ? `
const SKIP_PAGEVIEW_PATTERN = /^\\/(api|ingest|_next)\\//;

function captureServerPageview(req: NextRequest, event: NextFetchEvent) {
  const pathname = req.nextUrl.pathname;

  if (SKIP_PAGEVIEW_PATTERN.test(pathname)) return;

  const isPrefetch =
    req.headers.get("next-router-prefetch") === "1" ||
    req.headers.get("purpose") === "prefetch";
  if (isPrefetch) return;

  const posthog = getPostHogServerClient();
  if (!posthog) return;

  const phCookie = req.cookies.get(
    "ph_${analyticsConfig!.posthog.key}_posthog",
  )?.value;
  let distinctId: string | undefined;
  if (phCookie) {
    try {
      distinctId = JSON.parse(phCookie).distinct_id;
    } catch {
      // ignore malformed cookie
    }
  }
  if (!distinctId) {
    distinctId = crypto.randomUUID();
  }

  posthog.capture({
    distinctId,
    event: "$pageview",
    properties: {
      $current_url: req.url,
      $pathname: pathname,
      $host: req.headers.get("host") ?? undefined,
      $referrer: req.headers.get("referer") ?? undefined,
      $user_agent: req.headers.get("user-agent") ?? undefined,
      _server_side: true,
    },
  });
  event.waitUntil(posthog.flush());
}
`
    : "";

  const posthogCall = hasPostHog
    ? `  captureServerPageview(req, event);\n`
    : "";

  const fnSignature = hasPostHog
    ? `export function proxy(req: NextRequest, event: NextFetchEvent)`
    : `export function proxy(req: NextRequest)`;

  const eventImport = hasPostHog ? ", NextFetchEvent" : "";

  // Matcher scope:
  //   - With PostHog server-side tracking: run on every path so pageviews
  //     fire (the capture function uses event.waitUntil and never mutates
  //     the response, so doc pages remain edge-cacheable).
  //   - Otherwise: only run on /api/* — the only routes that need middleware
  //     (e.g. MCP key auth). Doc pages bypass middleware entirely.
  //
  // Theme detection happens client-side via the theme-init blocking script
  // in the root layout (sets a "dark" class on <html>). Middleware no longer
  // sets Vary, Accept-CH, or a theme cookie, because doing so would mark
  // every response as dynamic and disable caching at Vercel/Cloudflare.
  const matcher = hasPostHog ? `["/:path*"]` : `["/api/:path*"]`;

  return `import { NextResponse } from "next/server";
import type { NextRequest${eventImport} } from "next/server";
${posthogImport}${posthogPageviewFn}
${fnSignature} {
${posthogCall}  // API key auth for /api/mcp when DOCS_API_KEY is configured
  if (req.nextUrl.pathname.startsWith("/api/mcp")) {
    const apiKey = process.env.DOCS_API_KEY;
    if (apiKey) {
      const authHeader = req.headers.get("authorization");
      const token = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;

      if (token !== apiKey) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ${matcher},
};
`;
};
