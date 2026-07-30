export const platformAuthenticationMdxTemplate = `---
title: "Authentication"
description: "Put your documentation site behind a shared password, and understand what that protects."
date: "2026-07-30"
category: "Configuration"
categoryOrder: 2
order: 5
section: "Platform"
---
# Authentication

By default a Doccupine site is public, which is what you want for most documentation. The Authentication settings page turns that off: with password protection on, every visitor has to enter a shared password before they can read anything.

This is the right tool for internal handbooks, docs for a product that has not launched, and anything you would rather not have indexed yet. It is not a per-user login system - there is one password, shared by everyone who should have access.

## Turning it on

1. Open the project's **Authentication** settings page.
2. Enable **Require a password**.
3. Enter a strong password in **Site Password**.
4. Press **Save Configuration**, then redeploy when prompted.

Turning the toggle off and saving removes the password and makes the site public again.

<Callout type="warning">
  The password is stored as an encrypted environment variable (\`SITE_PASSWORD\`) on your deployment, not in a file in your repository. Because it is not a repository file, it is not a pending change - saving applies it directly, and a redeploy is what puts it into effect.
</Callout>

## What protection actually covers

Password protection is enforced on every request, not just on page loads, so the parts of your site that serve content are covered too:

- **Pages** show a login screen instead of your documentation. The URL is preserved, so after unlocking, a reload lands the visitor on the page they originally asked for.
- **Search engines** are locked out completely: \`robots.txt\` disallows every crawler and stops advertising your sitemap for as long as the password is set.
- **The chat and search APIs** (\`/api/rag\` and \`/api/search\`) return \`401\` to anyone without a valid session, so your content cannot be read around the login screen.
- **The request playground proxy** (\`/api/playground\`) returns \`401\` as well.
- **The MCP server** requires the same session, unless you give it its own key on the [MCP](/platform/mcp) page.

## Sessions

Unlocking the site sets a signed, \`httpOnly\` cookie that lasts 30 days. The cookie holds a signature derived from the password rather than the password itself.

That has a useful consequence: **changing the password immediately signs out everyone who had unlocked the site**, because every existing cookie was signed with the old one. Rotating the password is how you revoke access from someone who should no longer have it.

<Callout type="note">
  There is no way to sign out an individual reader, since everyone shares one password. If one person should lose access, rotate the password and give the new one to everyone else.
</Callout>

## Choosing between a password and an API key

A password and an API key solve different problems, and the difference matters most for the AI assistant:

| You want                                   | Use                                                            |
| ------------------------------------------ | -------------------------------------------------------------- |
| Readers to log in, then browse and chat    | Site password                                                  |
| A script or agent to call your docs APIs   | An API key (\`DOCS_API_KEY\` for MCP, \`RAG_API_KEY\` for chat)     |
| A public site whose chat is not free to use | \`RAG_API_KEY\` - see [AI Assistant](/platform/ai-assistant)      |

The reason you cannot simply use an API key for readers is that a browser has nowhere safe to keep one. Anything the page can read, a visitor can read. A password works for people because they type it; a key works for machines because they hold it in a place a reader never sees.

<Callout type="note">
  For the full reference on how the gate is implemented - the cookie, the middleware check, and how it interacts with the API keys - see the [Authentication documentation](/authentication).
</Callout>`;
