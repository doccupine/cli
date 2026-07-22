export const postHogProviderLazyTemplate = `"use client";

import posthog from "posthog-js";
import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import rawAnalyticsConfig from "@/analytics.json";

interface AnalyticsConfig {
  provider?: string;
  posthog?: {
    key?: string;
    host?: string;
  };
}

const analyticsConfig = rawAnalyticsConfig as AnalyticsConfig;

const posthogKey =
  analyticsConfig?.provider === "posthog" ? analyticsConfig.posthog?.key : null;

// \`host\` is the *ingestion* endpoint (us.i.posthog.com); \`ui_host\` wants the
// dashboard it belongs to (us.posthog.com), which is what "view in PostHog"
// links and the toolbar point at. Self-hosted instances serve both from one
// origin, so leaving those untouched is correct.
const uiHost = (analyticsConfig.posthog?.host || "https://us.i.posthog.com")
  .replace(".i.posthog.com", ".posthog.com");

/**
 * Adopt the session id the middleware already decided on (see proxy.ts), so the
 * server's document-load \`$pageview\` and every client event after it land in
 * the same session.
 *
 * Without this the two disagree: the middleware used to forward posthog-js's
 * own session id without checking whether it had expired, so a returning
 * reader's pageview was filed under a dead session and the real new session
 * began with no pageview in it — wrong landing page, wrong bounce rate.
 *
 * Reading document.cookie works on the first request because the middleware
 * sets the cookie on the same response that carries this HTML. Returns
 * undefined if absent or malformed, in which case posthog-js mints its own id
 * as before: degraded, never broken.
 */
// Both the middleware and this file WRITE the session cookie, so these three
// must stay identical to their counterparts in proxy.ts. They are duplicated
// rather than shared because a client component cannot import from the
// middleware. A drifted max-age here would silently expire live sessions.
const SESSION_COOKIE = "dcp_sid";
const SESSION_MAX_MS = 24 * 60 * 60 * 1000;

function isValidSessionId(id: string): boolean {
  return /^[0-9a-f]{32}$/i.test(id.replace(/-/g, ""));
}

function readSessionCookie(): { id: string; startTs: number } | undefined {
  if (typeof document === "undefined") return undefined;

  const match = document.cookie.match(/(?:^|;\\s*)dcp_sid=([^;]*)/);
  if (!match) return undefined;

  // Cookie is \`id.startTs.lastTs\`; posthog-js requires the id be a UUID and
  // logs an error if not, so check before handing it over.
  const [id, startRaw] = decodeURIComponent(match[1]).split(".");
  const startTs = Number(startRaw);
  if (!isValidSessionId(id) || !Number.isFinite(startTs)) return undefined;

  return { id, startTs };
}

function readEdgeSessionId(): string | undefined {
  return readSessionCookie()?.id;
}

/**
 * Keep the session cookie's last-activity fresh, from the browser.
 *
 * This is the half of session upkeep the middleware deliberately does NOT do.
 * A response carrying \`Set-Cookie\` is not cacheable by Vercel's CDN, so
 * refreshing last-activity server-side would have put one on roughly every doc
 * page an engaged reader loads. A \`document.cookie\` write sets no response
 * header at all, so your doc pages stay cacheable — and the browser is the side
 * that actually sees soft navigations and in-page activity.
 *
 * \`startTs\` is carried forward while the id is unchanged, so the 24h hard cap
 * still measures from when the session really began; a rotation restarts it.
 */
function syncSessionCookie(sessionId: string | undefined) {
  if (typeof document === "undefined" || !sessionId) return;
  if (!isValidSessionId(sessionId)) return;

  const now = Date.now();
  const existing = readSessionCookie();
  const startTs = existing?.id === sessionId ? existing.startTs : now;
  const secure = location.protocol === "https:" ? "; secure" : "";

  document.cookie =
    SESSION_COOKIE +
    "=" +
    sessionId +
    "." +
    startTs +
    "." +
    now +
    "; path=/; max-age=" +
    SESSION_MAX_MS / 1000 +
    "; samesite=lax" +
    secure;
}

function PostHogInit({ onReady }: { onReady: () => void }) {
  const initRef = useRef(false);

  useEffect(() => {
    if (!posthogKey) return;

    // The init guard deliberately does NOT wrap the subscription below.
    //
    // Under React StrictMode's dev double-invoke the effect runs, is cleaned
    // up, then runs again. With an early \`return\` here, that second run would
    // skip past the subscription and leave \`onSessionId\` permanently
    // unsubscribed — in dev only, which is precisely where you would go to
    // check that any of this works. Initialising once while re-subscribing on
    // every run is correct in both modes.
    if (!initRef.current) {
      initRef.current = true;

      const sessionID = readEdgeSessionId();

      posthog.init(posthogKey, {
        api_host: "/ingest",
        ui_host: uiHost,
        capture_pageview: false,
        capture_pageleave: true,
        // The middleware owns session identity; this makes the SDK agree.
        ...(sessionID ? { bootstrap: { sessionID } } : {}),
        loaded: (ph) => {
          // Write once at startup so a session the middleware adopted (and
          // therefore did not rewrite) still gets its last-activity advanced.
          syncSessionCookie(ph.get_session_id());
          onReady();
        },
      });
    }

    // Fires when the session id first appears and on every rotation, so the
    // cookie follows posthog-js rather than drifting from it. posthog-js is the
    // better judge of idleness — it sees every captured event, not just
    // navigations. Returning its unsubscribe doubles as the effect cleanup.
    return posthog.onSessionId((id: string) => syncSessionCookie(id));
  }, [onReady]);

  return null;
}

/**
 * Captures soft navigations only.
 *
 * The document load that got the reader here was already captured in the
 * middleware (see proxy.ts), so counting it again here is what produced two
 * \`$pageview\` events per page load. Server owns document loads, client owns
 * soft navigations: disjoint, so neither double-counts nor leaves a gap.
 */
function PostHogPageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (pathname) {
      const url = searchParams?.size
        ? \`\${pathname}?\${searchParams.toString()}\`
        : pathname;
      posthog.capture("$pageview", { $current_url: url });

      // A soft navigation is activity the middleware never sees, and
      // \`onSessionId\` won't fire because the id hasn't changed. Without this, a
      // reader who browses only via client-side links would look idle to the
      // next document load and have their session rotated out from under them.
      syncSessionCookie(posthog.get_session_id());
    }
  }, [pathname, searchParams]);

  return null;
}

export function PostHogSetup() {
  const [ready, setReady] = useState(false);

  if (!posthogKey) {
    return null;
  }

  return (
    <>
      <PostHogInit onReady={() => setReady(true)} />
      <Suspense fallback={null}>{ready && <PostHogPageviewTracker />}</Suspense>
    </>
  );
}
`;
