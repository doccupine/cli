export const analyticsMdxTemplate = `---
title: "Analytics"
description: "Add PostHog analytics to your documentation site with an analytics.json file for both client-side and server-side tracking."
date: "2026-02-24"
category: "Configuration"
categoryOrder: 3
order: 10
---
# Analytics
Track how users interact with your documentation using PostHog. Doccupine supports both client-side and server-side tracking out of the box, with a privacy-first proxy that routes analytics through your own domain.

## analytics.json
Place an \`analytics.json\` at your project root (the same folder where you execute \`npx doccupine\`).

\`\`\`json
{
  "provider": "posthog",
  "posthog": {
    "key": "phc_your_project_api_key",
    "host": "https://us.i.posthog.com"
  }
}
\`\`\`

## Fields

- **provider**: The analytics provider to use. Currently only \`"posthog"\` is supported.
- **posthog.key**: Your PostHog project API key. You can find this in your PostHog project settings under "Project API Key". This is a public identifier - it is safe to commit to version control.
- **posthog.host**: The PostHog ingestion endpoint. Use \`https://us.i.posthog.com\` for US Cloud or \`https://eu.i.posthog.com\` for EU Cloud. If you self-host PostHog, use your instance URL.

<Callout type="note">
  The PostHog project API key is a public identifier used to send events. It is not a secret and is safe to include in your repository.
</Callout>

## What gets tracked
When \`analytics.json\` is configured, Doccupine enables two layers of tracking:

### Client-side
- **Page views**: Captured on every client-side navigation using Next.js router hooks.
- **Page leave**: Automatically captured when a user navigates away from a page.

### Server-side
- **Page views**: Captured in middleware on every page request, including the initial server render.
- **Request metadata**: URL, pathname, host, referrer, and user agent are sent with each event.
- **Smart filtering**: API routes, internal Next.js routes, and prefetch requests are automatically excluded.

## Privacy proxy
Doccupine routes all analytics traffic through your documentation domain using Next.js rewrites. Instead of sending data directly to PostHog (which ad blockers may intercept), requests go through \`/ingest\` on your own domain and are proxied to PostHog.

This means:
- No third-party domains appear in network requests.
- Ad blockers are less likely to interfere with tracking.
- Your users' browsing data stays within your domain boundary before reaching PostHog.

The proxy destinations are derived automatically from the \`host\` field in your configuration.

## Getting a PostHog key
1. Sign up at [posthog.com](https://posthog.com) (free tier available).
2. Create a new project.
3. Go to **Project Settings** and copy the **Project API Key**.
4. Paste it into your \`analytics.json\` as the \`posthog.key\` value.

## Behavior
- **Placement**: Put \`analytics.json\` in the project root alongside \`config.json\` and \`theme.json\`.
- **Hot reload**: Changes to \`analytics.json\` are picked up automatically in watch mode. The layout, middleware, and Next.js config are regenerated.
- **Graceful degradation**: If \`analytics.json\` is missing, empty, or has an invalid configuration, no tracking code runs. Your site works exactly the same without it.
- **Dev server restart**: After adding or removing \`analytics.json\` for the first time, you may need to restart the Next.js dev server for proxy rewrites to take effect.

<Callout type="warning">
  After adding \`analytics.json\` for the first time, restart the dev server so the proxy rewrites are picked up by Next.js.
</Callout>

## Regions
PostHog offers two cloud regions. Set the \`host\` field accordingly:

| Region | Host |
|---|---|
| US Cloud | \`https://us.i.posthog.com\` |
| EU Cloud | \`https://eu.i.posthog.com\` |

If you omit the \`host\` field, it defaults to the US Cloud endpoint.

## Example

### Minimal configuration (US Cloud)

\`\`\`json
{
  "provider": "posthog",
  "posthog": {
    "key": "phc_your_project_api_key"
  }
}
\`\`\`

### EU Cloud

\`\`\`json
{
  "provider": "posthog",
  "posthog": {
    "key": "phc_your_project_api_key",
    "host": "https://eu.i.posthog.com"
  }
}
\`\`\`

## Tips
- **Start simple**: Add the config with just your key and verify events appear in your PostHog dashboard before customizing further.
- **Check your dashboard**: After deploying, visit your PostHog project to confirm page view events are flowing in.
- **Production only**: Consider adding \`analytics.json\` only in your production/deployment setup to avoid tracking local development traffic.
`;
