export const spaceMdxTemplate = `---
title: "Space"
description: "Add a precise vertical or horizontal gap between blocks, with per-breakpoint control."
date: "2026-07-30"
category: "Components"
categoryOrder: 1
order: 24
---
# Space

Insert a fixed gap between two blocks.

Markdown already spaces paragraphs, headings, lists, and tables for you, and that default rhythm is the right choice almost everywhere. Reach for \`Space\` when you need a specific gap the defaults do not give you: separating a dense table from the heading that follows it, opening up a landing page, or tightening a stack of cards on small screens.

<Callout type="note">
  If you find yourself adding a \`Space\` after every section, the page is telling you it wants a different structure - try \`Steps\`, \`Columns\`, or a heading instead.
</Callout>

## Space Usage

Set \`size\` to the gap you want, in pixels.

\`\`\`html
Text above the gap.

<Space size={60} />

Text below the gap.
\`\`\`

Text above the gap.

<Space size={60} />

Text below the gap.

## Responsive sizing

A gap that looks right on a wide screen is often too large on a phone. Each breakpoint has its own prop, so you can grow the gap as the viewport widens.

\`\`\`html
<Space size={20} md={40} xl={80} />
\`\`\`

That renders a 20px gap by default, 40px from the \`md\` breakpoint up, and 80px from \`xl\` up.

Every breakpoint prop is a \`min-width\` media query, so a value applies at that width and every width above it until a larger breakpoint overrides it:

| Prop   | Applies from |
| ------ | ------------ |
| \`xs\`   | 0px          |
| \`sm\`   | 576px        |
| \`md\`   | 768px        |
| \`lg\`   | 992px        |
| \`xl\`   | 1200px       |
| \`xxl\`  | 1440px       |
| \`xxxl\` | 1920px       |

\`size\` sets the gap at every width. Use it alone for a constant gap, or as the base that the breakpoint props build on.

## Removing the space at a breakpoint

Pass \`"none"\` instead of a number to drop the gap entirely at that width. This is the usual way to add breathing room on desktop without wasting vertical space on a phone.

\`\`\`html
<Space size="none" lg={64} />
\`\`\`

Here there is no gap at all below the \`lg\` breakpoint, and a 64px gap from \`lg\` up.

## Horizontal spacing

Add \`horizontal\` to space things apart along the inline axis instead of the block axis. The size props then control width rather than height.

It belongs inside a line of inline content, where a gap along that axis has something to sit between. Dropping one into a button widens the distance between the label and the icon by the size you give it, on top of the spacing the button already applies:

\`\`\`html
<Button icon="arrow-right" iconPosition="right">
  Get started
  <Space size={24} horizontal />
</Button>
\`\`\`

<Button icon="arrow-right" iconPosition="right">
  Get started
  <Space size={24} horizontal />
</Button>

## Properties

<Field value="size" type="number | 'none'">
  The gap at every viewport width, in pixels. Pass \`"none"\` to render nothing.
</Field>

<Field value="xs" type="number | 'none'">
  Overrides the gap from 0px up.
</Field>

<Field value="sm" type="number | 'none'">
  Overrides the gap from 576px up.
</Field>

<Field value="md" type="number | 'none'">
  Overrides the gap from 768px up.
</Field>

<Field value="lg" type="number | 'none'">
  Overrides the gap from 992px up.
</Field>

<Field value="xl" type="number | 'none'">
  Overrides the gap from 1200px up.
</Field>

<Field value="xxl" type="number | 'none'">
  Overrides the gap from 1440px up.
</Field>

<Field value="xxxl" type="number | 'none'">
  Overrides the gap from 1920px up.
</Field>

<Field value="horizontal" type="boolean">
  Spaces along the inline axis instead of the block axis, so the size props control width. Defaults to false.
</Field>

<Callout type="note">
  Pages written before these names existed pass the same props with a \`$\` prefix (\`$size\`, \`$md\`, \`$horizontal\`). Those still render, so nothing breaks on upgrade, but the unprefixed names above are the supported form - the \`$\` prefix belongs to the styling library underneath, not to the components you author with.
</Callout>`;
