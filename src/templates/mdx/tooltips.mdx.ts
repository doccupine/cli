export const tooltipsMdxTemplate = `---
title: "Tooltips"
description: "Show contextual definitions and explanations when readers hover over a term."
date: "2026-07-27"
category: "Components"
categoryOrder: 1
order: 13
---
# Tooltips

Show contextual definitions and explanations when readers hover over terms, abbreviations, or technical concepts.

The \`Tooltip\` component wraps a string of text and reveals a small bubble of additional context on hover or keyboard focus. Tooltips can include an optional headline and a call-to-action link.

Tooltips stay inside the viewport: when the wrapped term sits near a screen edge the bubble shifts to fit, and when there is no room above it flips below the term. On touch screens, tap the term to open the tooltip and tap anywhere else to dismiss it.

## Usage

You can use the Tooltip component directly within your MDX files without any import:

\`\`\`html
Every <Tooltip tip="Application Programming Interface: a set of protocols that lets software applications communicate.">API</Tooltip> endpoint is documented on its own page.
\`\`\`

Every <Tooltip tip="Application Programming Interface: a set of protocols that lets software applications communicate.">API</Tooltip> endpoint is documented on its own page.

## Headline and call to action

Add a bold headline above the tip text with \`headline\`, and append a link with \`cta\` and \`href\`. Internal links open in the same tab; external links open in a new one.

\`\`\`html
Try the <Tooltip headline="API Playground" tip="An interactive API reference where readers send real requests and inspect live responses." cta="Open the API Playground guide" href="/api-playground">interactive playground</Tooltip> to explore your endpoints.
\`\`\`

Try the <Tooltip headline="API Playground" tip="An interactive API reference where readers send real requests and inspect live responses." cta="Open the API Playground guide" href="/api-playground">interactive playground</Tooltip> to explore your endpoints.

## Properties

<Field value="tip" type="string" required>
  The text displayed in the tooltip.
</Field>

<Field value="headline" type="string">
  Bold text displayed above the tip text.
</Field>

<Field value="cta" type="string">
  The call-to-action text for a link inside the tooltip.
</Field>

<Field value="href" type="string">
  URL for the call-to-action link. Required when using \`cta\`.
</Field>

<Field value="children" type="node" required>
  The text that triggers the tooltip on hover or focus.
</Field>`;
