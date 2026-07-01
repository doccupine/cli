import type { AnalyticsConfig } from "../lib/types.js";

export const proxyTemplate = (
  analyticsConfig: AnalyticsConfig | null = null,
): string => {
  const hasPostHog =
    analyticsConfig?.provider === "posthog" && !!analyticsConfig.posthog?.key;

  const posthogImport = hasPostHog
    ? `import { getPostHogServerClient } from "@/lib/posthog";\n`
    : "";

  const gateImport = `import { GATE_COOKIE_NAME, isGateUnlocked } from "@/lib/siteGate";\n`;

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
    ? `export async function proxy(req: NextRequest, event: NextFetchEvent)`
    : `export async function proxy(req: NextRequest)`;

  const eventImport = hasPostHog ? ", NextFetchEvent" : "";

  // Matcher scope: run on every path. The middleware handles MCP key auth,
  // the SITE_PASSWORD gate for the content APIs, PostHog pageviews, and the
  // X-Robots-Tag backstop while password protection is active — all of which
  // need to see page and API requests alike. When SITE_PASSWORD is unset and
  // PostHog is off the middleware just returns NextResponse.next() without
  // mutating the response, so doc pages remain edge-cacheable.
  //
  // Theme detection happens client-side via the theme-init blocking script
  // in the root layout (sets a "dark" class on <html>). Middleware never sets
  // Vary, Accept-CH, or a theme cookie, because doing so would mark every
  // response as dynamic and disable caching at Vercel/Cloudflare.
  const matcher = `["/:path*"]`;

  return `import { NextResponse } from "next/server";
import type { NextRequest${eventImport} } from "next/server";
${gateImport}${posthogImport}${posthogPageviewFn}
${fnSignature} {
${posthogCall}  const pathname = req.nextUrl.pathname;
  const sitePassword = process.env.SITE_PASSWORD;

  // API key auth for /api/mcp when DOCS_API_KEY is configured
  if (pathname.startsWith("/api/mcp")) {
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

  // SITE_PASSWORD gate. Enforced here in the middleware (not the layout) so it
  // works even though the doc pages render statically: pages can't read the
  // request cookie, but the middleware always can. Skip Next internals so the
  // gate screen's own assets keep loading.
  if (sitePassword && !pathname.startsWith("/_next")) {
    const unlocked = await isGateUnlocked(
      req.cookies.get(GATE_COOKIE_NAME)?.value,
      sitePassword,
    );

    // Content APIs (RAG chat + search) return 401 without a valid cookie so the
    // docs can't be scraped around the login screen. /api/mcp keeps its own key
    // auth above; /api/gate and /api/theme stay open so the gate can unlock and
    // the theme can toggle.
    if (
      !unlocked &&
      (pathname.startsWith("/api/rag") || pathname.startsWith("/api/search"))
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Locked visitors see the gate screen. Rewrite (not redirect) so the URL is
    // preserved — after unlocking, a reload lands them back on the page they
    // asked for. API routes are never rewritten to HTML.
    if (!unlocked && !pathname.startsWith("/api") && pathname !== "/gate") {
      const res = NextResponse.rewrite(new URL("/gate", req.url));
      res.headers.set("X-Robots-Tag", "noindex, nofollow");
      return res;
    }

    // Unlocked visitors never need the gate screen.
    if (unlocked && pathname === "/gate") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  const res = NextResponse.next();

  // While password protection is active, keep the whole site out of search
  // indexes as a header-level backstop to robots.txt's disallow rule.
  if (sitePassword) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return res;
}

export const config = {
  matcher: ${matcher},
};
`;
};
