export const visibilityMdxTemplate = `---
title: "Visibility"
description: "Show content only to readers of the page, or only to AI tools reading your docs."
date: "2026-11-25"
category: "Components"
categoryOrder: 1
order: 30
---
# Visibility

Show content only to readers of the page, or only to AI tools reading your docs.

Your docs have two audiences: people reading the site, and AI tools reading it for them. \`<Visibility>\` lets one page speak to each. Wrap content in \`<Visibility for="humans">\` to keep it on the rendered page only, or in \`<Visibility for="agents">\` to keep it out of the page and give it only to AI.

## Visibility usage

\`\`\`html
<Visibility for="humans">
  Click **Deploy** in the top-right corner of the dashboard.
</Visibility>

<Visibility for="agents">
  To deploy, call \`POST /v1/deployments\` with the project ID. The dashboard button does the same.
</Visibility>
\`\`\`

<Visibility for="humans">
  This sentence is on the rendered page only. Open this page's [Markdown version](/visibility.md) and it is gone.
</Visibility>

<Visibility for="agents">
  This sentence is for AI tools only. It is not on the rendered page.
</Visibility>

Leave a blank line around the content when it holds Markdown such as lists or headings, as with any component.

## Where each audience reads

| | \`for="humans"\` | \`for="agents"\` |
| --- | --- | --- |
| The rendered page and its table of contents | Shown | Hidden |
| Site search | Searched | Not searched |
| RSS items of [Update](/update) blocks | Included | Left out |
| \`llms-full.txt\` and each page's \`.md\` version | Left out | Included |
| The [MCP server](/model-context-protocol) | Left out | Included |
| The [AI assistant](/ai-assistant) | Left out | Included |
| The **Copy content** button | Left out | Included |

Code blocks are left exactly as written, so a page can show the syntax, as this one does.

<Callout type="warning">
  Visibility decides what each audience is shown, not who can read it: the Markdown source of your docs is not secret. Never put credentials or private information in either block.
</Callout>

## Properties

<Field value="for" type="string" required>
  Who sees the content: \`humans\` or \`agents\`. Any other value shows it to both.
</Field>

<Field value="children" type="node" required>
  The content to show to that audience.
</Field>`;
