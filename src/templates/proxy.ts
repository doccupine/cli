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

/**
 * First-party anonymous id.
 *
 * posthog-js keeps its own id in \`ph_<key>_posthog\`, but an ad blocker stops
 * that script from ever running, so a blocked reader never gets one. Without an
 * id of our own we minted a fresh UUID per request, which made every single
 * pageview a brand-new "person" and badly inflated unique-visitor counts. This
 * cookie is what makes one anonymous reader one person across requests.
 *
 * It is first-party and httpOnly: only the edge reads it, and it never leaves
 * your domain except as a PostHog distinct_id.
 */
const ANON_ID_COOKIE = "dcp_anon_id";

const ANON_ID_MAX_AGE = 60 * 60 * 24 * 365;

interface TrackingIdentity {
  distinctId: string;
  /** Set only when the id was just minted and still needs writing to a cookie. */
  anonIdToPersist?: string;
  sessionId?: string;
  deviceId?: string;
}

/**
 * Resolves who this pageview belongs to: whatever posthog-js already
 * established for this browser, else our own anonymous cookie, else a fresh id
 * that the caller persists.
 */
function resolveTrackingIdentity(req: NextRequest): TrackingIdentity {
  let distinctId: string | undefined;
  let sessionId: string | undefined;
  let deviceId: string | undefined;

  const phCookie = req.cookies.get(
    "ph_${analyticsConfig!.posthog.key}_posthog",
  )?.value;
  if (phCookie) {
    try {
      const parsed = JSON.parse(phCookie);
      if (typeof parsed.distinct_id === "string") distinctId = parsed.distinct_id;
      // \`$sesid\` is [lastActivityTs, sessionId, sessionStartTs]. Forwarding it
      // keeps server events inside the client's session instead of floating free.
      if (Array.isArray(parsed.$sesid) && typeof parsed.$sesid[1] === "string") {
        sessionId = parsed.$sesid[1];
      }
      if (typeof parsed.$device_id === "string") deviceId = parsed.$device_id;
    } catch {
      // ignore malformed cookie
    }
  }

  if (distinctId) return { distinctId, sessionId, deviceId };

  const anonId = req.cookies.get(ANON_ID_COOKIE)?.value;
  if (anonId) return { distinctId: anonId, sessionId, deviceId };

  const minted = crypto.randomUUID();
  return { distinctId: minted, anonIdToPersist: minted, sessionId, deviceId };
}

/**
 * Server captures document loads; the client tracker captures soft navigations.
 * Splitting by navigation type is what stops the two from both counting the
 * same view — previously every page load produced two \`$pageview\` events.
 */
function captureServerPageview(
  req: NextRequest,
  event: NextFetchEvent,
): TrackingIdentity | null {
  const pathname = req.nextUrl.pathname;

  if (SKIP_PAGEVIEW_PATTERN.test(pathname)) return null;

  const isPrefetch =
    req.headers.get("next-router-prefetch") === "1" ||
    req.headers.get("purpose") === "prefetch";
  if (isPrefetch) return null;

  // A soft navigation fetches an RSC payload rather than a document, and
  // carries this header. The client tracker owns those.
  if (req.headers.get("RSC")) return null;

  const posthog = getPostHogServerClient();
  if (!posthog) return null;

  const identity = resolveTrackingIdentity(req);

  posthog.capture({
    distinctId: identity.distinctId,
    event: "$pageview",
    properties: {
      $current_url: req.url,
      $pathname: pathname,
      $host: req.headers.get("host") ?? undefined,
      $referrer: req.headers.get("referer") ?? undefined,
      $user_agent: req.headers.get("user-agent") ?? undefined,
      $session_id: identity.sessionId,
      $device_id: identity.deviceId,
      _server_side: true,
    },
  });
  event.waitUntil(posthog.flush());

  return identity;
}
`
    : "";

  // Applied at every exit so the anonymous id is persisted whichever branch the
  // request takes (gate rewrite, redirect, or the normal response). Without it
  // a reader stuck behind the password gate would keep minting new ids.
  const applyTrackingFn = hasPostHog
    ? `
function applyTracking(
  res: NextResponse,
  tracking: TrackingIdentity | null,
): NextResponse {
  if (tracking?.anonIdToPersist) {
    res.cookies.set(ANON_ID_COOKIE, tracking.anonIdToPersist, {
      path: "/",
      maxAge: ANON_ID_MAX_AGE,
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
  }
  return res;
}
`
    : `
function applyTracking(res: NextResponse, _tracking: null): NextResponse {
  return res;
}
`;

  const trackingInit = hasPostHog
    ? `  const tracking = captureServerPageview(req, event);\n`
    : `  const tracking = null;\n`;

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
${gateImport}${posthogImport}${posthogPageviewFn}${applyTrackingFn}
${fnSignature} {
${trackingInit}  const pathname = req.nextUrl.pathname;
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
    // auth above; /api/gate stays open so the gate can unlock.
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
      return applyTracking(res, tracking);
    }

    // Unlocked visitors never need the gate screen.
    if (unlocked && pathname === "/gate") {
      return applyTracking(
        NextResponse.redirect(new URL("/", req.url)),
        tracking,
      );
    }
  }

  const res = NextResponse.next();

  // While password protection is active, keep the whole site out of search
  // indexes as a header-level backstop to robots.txt's disallow rule.
  if (sitePassword) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return applyTracking(res, tracking);
}

export const config = {
  matcher: ${matcher},
};
`;
};
