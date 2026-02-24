export const posthogServerTemplate = `import { PostHog } from "posthog-node";
import rawAnalyticsConfig from "@/analytics.json";

interface AnalyticsConfig {
  provider?: string;
  posthog?: {
    key?: string;
    host?: string;
  };
}

const analyticsConfig = rawAnalyticsConfig as AnalyticsConfig;

let client: PostHog | null = null;

export function getPostHogServerClient(): PostHog | null {
  if (
    analyticsConfig?.provider !== "posthog" ||
    !analyticsConfig.posthog?.key
  ) {
    return null;
  }

  if (!client) {
    const host = analyticsConfig.posthog.host || "https://us.i.posthog.com";

    client = new PostHog(analyticsConfig.posthog.key, {
      host,
      flushAt: 1,
      flushInterval: 0,
    });
  }

  return client;
}
`;
