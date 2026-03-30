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

function PostHogInit({ onReady }: { onReady: () => void }) {
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current || !posthogKey) return;
    initRef.current = true;

    posthog.init(posthogKey, {
      api_host: "/ingest",
      ui_host: analyticsConfig.posthog?.host || "https://us.posthog.com",
      capture_pageview: false,
      capture_pageleave: true,
      loaded: onReady,
    });
  }, [onReady]);

  return null;
}

function PostHogPageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
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
