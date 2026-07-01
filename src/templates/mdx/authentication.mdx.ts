export const authenticationMdxTemplate = `---
title: "Authentication"
description: "Password protect your documentation site with a single environment variable that gates pages, content APIs, and search crawlers behind a shared password."
date: "2026-07-01"
category: "Configuration"
categoryOrder: 3
order: 12
---

# Authentication

Keep your documentation private by putting the whole site behind a shared password. Set one environment variable and Doccupine gates every page behind a login screen, blocks the content APIs, and hides the site from search engines - no accounts, no database, no extra services.

## Enabling password protection

Set \`SITE_PASSWORD\` in your environment (for local development, add it to \`.env\`):

\`\`\`bash
SITE_PASSWORD=choose-a-strong-shared-password
\`\`\`

That is the only setting. Everyone who visits the site shares this single password.

<Callout type="note">
  When \`SITE_PASSWORD\` is unset or empty, the site is fully public and behaves exactly as before. Removing the variable turns protection off again.
</Callout>

## What gets protected

While a password is set, protection is enforced across three layers:

- **Pages**: Every page renders a login screen instead of your documentation until the visitor enters the correct password.
- **Content APIs**: The AI chat (\`/api/rag\`) and search (\`/api/search\`) endpoints return \`401 Unauthorized\` without a valid session, so the docs cannot be scraped around the login screen.
- **Search engines and crawlers**: \`robots.txt\` disallows all crawlers, every page ships a \`noindex, nofollow\` meta tag, and responses carry an \`X-Robots-Tag: noindex, nofollow\` header.

<Callout type="note">
  The [MCP server](/model-context-protocol) keeps its own authentication through the \`DOCS_API_KEY\` bearer token and is not affected by \`SITE_PASSWORD\`. Set both when you want the docs and the MCP endpoint locked down.
</Callout>

## How it works

When a visitor submits the correct password, Doccupine sets a signed, \`httpOnly\` cookie that unlocks the site for 30 days. The cookie never stores the password itself - it holds an HMAC derived from it - and it is checked in constant time to avoid leaking information through timing.

Because the check reads \`SITE_PASSWORD\` at request time, you can turn protection on or off by changing the environment variable and redeploying. No rebuild of your content is required.

## Security notes

- **Use a strong password.** It is shared by everyone with access, so treat it like any other shared secret and rotate it when needed.
- **Serve over HTTPS in production.** The session cookie is marked \`secure\` in production, so it is only sent over encrypted connections.
- **Brute-force protection.** Password attempts are rate limited by IP address to slow down guessing.
- **Rotating the password.** Changing \`SITE_PASSWORD\` invalidates every existing session immediately - visitors will need to enter the new password.

<Callout type="warning">
  A shared password is meant for lightweight gating - private previews, internal docs, or work-in-progress sites. For per-user access control or audit trails, put the site behind your own identity provider or a hosting platform's access controls.
</Callout>

## Behavior

- **Runtime toggle**: Protection is controlled entirely by the \`SITE_PASSWORD\` environment variable, evaluated on each request.
- **Graceful default**: With no password set, nothing changes - the site stays public and fully indexable.
- **Session length**: A successful login lasts 30 days before the visitor is asked to sign in again.

## Example

Protect a staging deployment while it is being reviewed:

\`\`\`bash
SITE_PASSWORD=preview-2026
NEXT_PUBLIC_SITE_URL=https://staging.example.com
\`\`\`

When you are ready to launch publicly, remove \`SITE_PASSWORD\` and redeploy. The login screen disappears, crawlers are welcomed back, and your [sitemap](/deployment-and-hosting) is advertised again.`;
