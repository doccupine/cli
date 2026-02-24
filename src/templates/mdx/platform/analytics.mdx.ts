export const platformAnalyticsMdxTemplate = `---
title: "Analytics"
description: "Enable PostHog analytics to track page views on your documentation site."
date: "2026-02-24"
category: "Configuration"
categoryOrder: 2
order: 3
section: "Platform"
---
# Analytics
The Analytics settings page lets you add PostHog analytics to your documentation site. Page views are tracked client-side and proxied through your own domain for privacy - no data is sent directly to PostHog.

## Enabling analytics
Use the **Enable Analytics** toggle to turn tracking on or off. When disabled, no tracking code is added to your site.

## Configuration

### PostHog Project API Key
Your project API key from PostHog (starts with \`phc_\`). This is a public identifier and is safe to commit to your repository.

To find your key:
1. Log in to [PostHog](https://posthog.com).
2. Open your project settings.
3. Copy the **Project API Key**.

### Region
Select the PostHog cloud region that matches your project:

- **US Cloud** - \`us.i.posthog.com\`
- **EU Cloud** - \`eu.i.posthog.com\`

## How it works
Analytics settings are stored in \`analytics.json\` at the root of your repository. Here's an example:

\`\`\`json
{
  "provider": "posthog",
  "posthog": {
    "key": "phc_your_project_api_key",
    "host": "https://us.i.posthog.com"
  }
}
\`\`\`

When enabled, Doccupine routes all analytics traffic through your documentation domain using Next.js rewrites. Instead of sending data directly to PostHog (which ad blockers may intercept), requests go through \`/ingest\` on your own domain and are proxied to PostHog.

<Callout type="note">
  Changes to analytics settings are staged as pending changes. Click **Publish** to commit them to your repository and trigger a deploy.
</Callout>

See the [Analytics](/analytics) page for the full configuration reference and additional details on the privacy proxy.`;
