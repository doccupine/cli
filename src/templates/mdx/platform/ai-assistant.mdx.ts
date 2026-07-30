export const platformAiAssistantMdxTemplate = `---
title: "AI Assistant"
description: "Configure the built-in AI assistant that ships with every Doccupine documentation site."
date: "2026-02-19"
updated: "2026-07-30"
category: "AI & Integrations"
categoryOrder: 3
categoryIcon: "sparkles"
order: 0
section: "Platform"
---
# AI Assistant

Every Doccupine site ships with a built-in AI assistant that helps visitors find answers across your documentation. The AI settings page lets you choose how it's powered.

## Modes

### Platform (default)

Uses Doccupine's built-in integration. Zero configuration needed - the AI assistant works out of the box with no API keys or setup.

Each plan includes a monthly AI usage budget:

| Plan       | Monthly Budget |
| ---------- | -------------- |
| Trial      | $2             |
| Pro        | $20            |
| Enterprise | $50            |

The AI settings page shows a usage dashboard with your current spending and remaining budget. Usage resets automatically with your billing cycle.

#### AI credit top-ups

If you run out of AI credits before your billing cycle resets, you can purchase a one-time top-up to increase your monthly limit. Available tiers:

- **$5**
- **$10**
- **$20**

Top-ups are added to your current cycle's budget immediately after purchase and reset when your billing cycle renews. You can purchase multiple top-ups in the same cycle.

### Custom

Bring your own API key for full control over the AI model. Supported providers:

- **OpenAI**
- **Anthropic**
- **Google**

In Custom mode, you can also configure:

- **Embedding model** - the model used to index your documentation content
- **Temperature** - controls response creativity (0.0 for focused answers, up to 1.0 for more varied responses)

For a complete list of available models, refer to the official documentation of your chosen provider.

### Off

Completely disables the AI assistant on your site.

<Callout type="warning">
  AI settings are stored as environment variables on your deployment, not in a JSON file. After saving, a redeploy is triggered automatically to apply the changes.
</Callout>

## AI endpoint authentication

Your site's chat endpoint (\`/api/rag\`) is public by default, in the same way your documentation is. That means anyone who finds the endpoint can send it questions, and every question spends from your AI budget. On a site you expect to be found, it is worth deciding deliberately whether that is what you want.

To require a key:

1. Enable **Require API key for AI chat** in the Authentication card.
2. Enter an API key.
3. Save.

Clients must then send the key as a Bearer token in the \`Authorization\` header of every request to \`/api/rag\`.

<Callout type="warning">
  On a public site, turning this on also stops the chat widget on your own documentation from answering visitors. A browser cannot safely hold a server secret, so there is nowhere for the page to keep the key - only API clients that send the Bearer token get answers.
</Callout>

If you want readers to keep using the assistant while still closing the endpoint to strangers, protect the whole site with a password instead - see [Authentication](/platform/authentication). Readers who have unlocked the site keep chatting as normal, and the API key becomes a second way in for programmatic clients rather than a replacement for the first.

<Callout type="note">
  The key is stored as an environment variable (\`RAG_API_KEY\`) on your deployment. After saving, a redeploy is triggered automatically to apply the change. See [Authentication](/authentication) for how the site gate, \`RAG_API_KEY\`, and \`DOCS_API_KEY\` interact.
</Callout>

<Callout type="note">
  Connecting external AI tools (Claude, Cursor, and others) to your site is configured on the dedicated [MCP](/platform/mcp) page, which also covers MCP server authentication.
</Callout>`;
