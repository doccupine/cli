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

function PostHogInit({ onReady }: { onReady: () => void }) {
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current || !posthogKey) return;
    initRef.current = true;

    posthog.init(posthogKey, {
      api_host: "/ingest",
      ui_host: uiHost,
      capture_pageview: false,
      capture_pageleave: true,
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
