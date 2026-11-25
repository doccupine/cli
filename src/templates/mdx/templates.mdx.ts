export const templatesMdxTemplate = `---
title: "Templates"
description: "Choose the design of your documentation site: classic or modern."
date: "2026-11-24"
category: "Configuration"
categoryOrder: 2
order: 7
---
# Templates

A template is the overall design of your documentation site: the header, sidebar, page layout, and the look of the built-in components. Doccupine ships two templates, and every site uses one of them. Your content, navigation, colors, fonts, and features stay the same whichever you pick.

## Choosing a template

Set \`template\` in the \`config.json\` at your project root:

\`\`\`json
{
  "name": "My Docs",
  "template": "classic"
}
\`\`\`

| Value | Design |
| --- | --- |
| \`modern\` | A lighter, more minimal design with more whitespace and fewer borders. Used when \`template\` is not set. |
| \`classic\` | The original Doccupine design. |

Any other value prints a warning and falls back to \`modern\`.

<Callout type="note">
  Sites created before templates existed use the modern design on their next build. To keep the original look, set \`"template": "classic"\` in \`config.json\`.
</Callout>

## Modern

A quieter design built around typography and whitespace:

- A slim header with section tabs centered as pills, and matching search and "Ask AI" buttons
- A borderless sidebar where the current page is shown in your accent color with a soft highlight
- A page header with the page's category above the title, a larger lead paragraph, and the page actions as pills
- A slightly wider content column and a full heading scale
- Callouts as soft tints without borders, cards with a hairline border, code blocks with a language label and copy button, underline tabs, slimmer steps, and accordions as hairline rows
- A matching search window and AI assistant panel

## Classic

The original Doccupine design, used by every site before templates existed:

- A header with section tabs on the right
- A sidebar on a tinted panel, with a line marking the current page
- Bordered callouts, cards, and code blocks with a window-style top bar
- The AI assistant button with an animated glow

## What stays the same

Both templates support everything Doccupine does, so switching never loses a feature:

- Every page, section, and component in your MDX
- [Theme](/theme) colors and logos from \`theme.json\`, and [Fonts](/fonts) from \`fonts.json\`
- [Navigation](/navigation), [Sections](/sections), [Languages](/languages), and [Versions](/versions)
- Light and dark mode, search, the [AI Assistant](/ai-assistant), the [MCP server](/model-context-protocol), and the API playground

## Switching templates

Change the \`template\` value and save. With \`npx doccupine\` running, the site's design files and layouts are regenerated right away, with no restart. With \`npx doccupine build\`, the next build uses the new template.

<Callout type="note">
  Doccupine writes the template's files into your output directory on every run, so keep customizations in your MDX and project-root JSON files rather than editing generated components.
</Callout>
`;
