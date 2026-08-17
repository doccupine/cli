export const platformAiAssistantMdxTemplate = `---
title: "AI Assistant"
description: "One setting per project decides what powers every AI feature - Agent Sync, the editor assistant, repository imports, and the assistant on your published site."
date: "2026-02-19"
updated: "2026-08-17"
category: "AI & Integrations"
categoryOrder: 3
categoryIcon: "sparkles"
order: 0
section: "Platform"
---
# AI Assistant

One setting decides what every AI feature in your project spends. It covers both sides of Doccupine:

| Where | What it powers |
| ----- | -------------- |
| **In Doccupine** | [Agent Sync](/platform/self-updating-docs) runs, the [editor's](/platform/file-editor) writing assistant, Auto-link's AI selection, and [Import from GitHub](/platform/import-from-github) |
| **On your site** | The assistant readers use to ask questions about your documentation |

You'll find it under **Settings → AI** in the project sidebar.

## Modes

### Enable AI Assistant (default)

Uses the AI credit included with your plan. Nothing to configure - no API keys, no provider account.

| Plan       | Monthly Budget |
| ---------- | -------------- |
| Trial      | $5             |
| Pro        | $20            |
| Enterprise | $50            |

The settings page shows a usage meter with your current spending and what's left. Usage resets with your billing cycle.

Because this credit is shared across everything you do, Doccupine keeps single runs bounded: an agent run and a repository import each stop at a spend ceiling and ship whatever they finished, rather than quietly draining a month's budget in one go.

#### AI credit top-ups

If you run out before your billing cycle resets, you can buy a one-time top-up:

- **$5**
- **$10**
- **$20**

Top-ups apply to the current cycle immediately and reset when it renews. You can buy more than one in the same cycle.

### Custom AI Models

Bring your own API key. It is used for everything above - writing documentation as well as answering readers - and the spend goes to your provider rather than your Doccupine credit. Supported providers:

- **OpenAI**
- **Anthropic**
- **Google**

<Callout type="note">
  Once saved, a key is never shown again - the settings page displays only its last four characters. To change it, select **Replace key** and enter a new one.
</Callout>

#### Documentation model

Which model Agent Sync, the editor assistant, and imports write with. This is deliberately separate from the chat model below: one writes whole documentation pages that have to build, the other writes a paragraph into a chat bubble, and the right model for each is rarely the same. Doccupine defaults to a capable model for your provider.

#### Spend limit

Your own key has no ceiling unless you give it one. Turn on **Limit spend per run** to cap a single agent run or import in dollars; Doccupine stops at the limit and keeps whatever it wrote. The limit is per run, not per month.

#### Site assistant options

These only affect the assistant on your published site:

- **Chat model** - the model that answers readers
- **Embedding model** - the model used to index your documentation content
- **Temperature** - response creativity (0.0 for focused answers, up to 1.0 for more varied ones)

For the full list of available models, see your provider's own documentation.

### Off

Turns AI off for the whole project. The assistant disappears from your published site, and Agent Sync, the editor's writing assistant, and repository imports all stop - nothing can spend on this project until you turn it back on.

Your source links and drift history are untouched, so turning AI back on picks up where you left off.

<Callout type="note">
  AI settings are stored with your project and take effect in Doccupine immediately. Your published site receives them on its next deploy, so Doccupine offers to redeploy after you save.
</Callout>

<Callout type="warning">
  Only the project **owner** can change these settings or see which key is configured. Team members can see whether AI is on, since it decides whether the agent and the editor assistant are available to them.
</Callout>

## AI endpoint authentication

Your site's chat endpoint (\`/api/rag\`) is public by default, in the same way your documentation is. That means anyone who finds the endpoint can send it questions, and every question spends from your AI budget - or your own provider account. On a site you expect to be found, it is worth deciding deliberately whether that is what you want.

To require a key:

1. Enable **Require API key for AI chat** in the Authentication card.
2. Enter an API key.
3. Save.

Clients must then send the key as a Bearer token in the \`Authorization\` header of every request to \`/api/rag\`.

<Callout type="note">
  Like your provider key, this one is write-only: leave the field empty to keep the key you already saved, and enter a new value only when you want to replace it. Keep your own copy - Doccupine cannot show it to you again.
</Callout>

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
