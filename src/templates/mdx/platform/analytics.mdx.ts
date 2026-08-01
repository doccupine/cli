export const platformAnalyticsMdxTemplate = `---
title: "Analytics"
description: "Enable PostHog analytics to track page views on your documentation site."
date: "2026-02-24"
updated: "2026-08-01"
category: "AI & Integrations"
categoryOrder: 3
order: 3
section: "Platform"
---
# Analytics

The Analytics settings page lets you add PostHog analytics to your documentation site. Page views are captured both in the browser and on your server, so readers running ad blockers are still counted. Browser traffic is proxied through your own domain; server-side events go from your server to PostHog directly.

## Enabling analytics

Use the **Enable Analytics** toggle to turn tracking on or off. When disabled, no tracking code is added to your site.

Turning analytics off stages a **deletion** of \`analytics.json\` rather than saving an empty configuration, so the file disappears from your repository on the next publish. Absence is what the generator reads as "no analytics". An empty \`{}\` left in place ends up disabled too, but it fails validation on every build and prints a warning as it goes.

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

If your repository already names a host outside that list, the selector shows it as **Custom** and keeps it, so a hand-authored value survives a round trip through the settings page instead of snapping back to US Cloud.

## Validation

\`analytics.json\` is checked against the same rules the generator uses, both when the settings page loads it and when you save. A configuration the generator would refuse shows an error here, rather than passing silently and leaving analytics off on the deployed site:

- \`provider\` must be \`"posthog"\`.
- \`posthog.key\` may contain only letters, numbers, underscores, and hyphens.
- \`posthog.host\`, when present, must be an HTTP(S) URL with no credentials, query string, or fragment.

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
