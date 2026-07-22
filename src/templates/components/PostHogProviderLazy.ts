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
function readEdgeSessionId(): string | undefined {
  if (typeof document === "undefined") return undefined;

  const match = document.cookie.match(/(?:^|;\\s*)dcp_sid=([^;]*)/);
  if (!match) return undefined;

  // Cookie is \`id.startTs.lastTs\`; posthog-js requires the id be a UUID and
  // logs an error if not, so check before handing it over.
  const id = decodeURIComponent(match[1]).split(".")[0];
  return /^[0-9a-f]{32}$/i.test(id.replace(/-/g, "")) ? id : undefined;
}

function PostHogInit({ onReady }: { onReady: () => void }) {
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current || !posthogKey) return;
    initRef.current = true;

    const sessionID = readEdgeSessionId();

    posthog.init(posthogKey, {
      api_host: "/ingest",
      ui_host: uiHost,
      capture_pageview: false,
      capture_pageleave: true,
      // The edge owns session identity; this makes the SDK agree with it.
      ...(sessionID ? { bootstrap: { sessionID } } : {}),
      loaded: onReady,
    });
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
