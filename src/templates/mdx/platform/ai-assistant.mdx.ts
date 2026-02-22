export const platformAiAssistantMdxTemplate = `---
title: "AI Assistant"
description: "Configure the built-in AI assistant that ships with every Doccupine documentation site."
date: "2026-02-19"
category: "Configuration"
categoryOrder: 2
order: 6
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

## MCP server authentication
Every Doccupine site exposes an MCP (Model Context Protocol) endpoint at \`/api/mcp\`. This lets external AI tools query your documentation programmatically.

You can set an optional **API key** to restrict access to the MCP endpoint. When set, requests must include the key in their authorization header.

<Callout type="note">
  For more details on how the MCP endpoint works and how to connect it to AI tools, see the [Model Context Protocol documentation](/model-context-protocol).
</Callout>`;
