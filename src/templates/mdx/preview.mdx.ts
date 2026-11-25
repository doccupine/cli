export const previewMdxTemplate = `---
title: "Preview"
description: "Show a live example on a stage, with its source code right underneath."
date: "2026-11-25"
category: "Components"
categoryOrder: 1
order: 20
---
# Preview

Show a live example on a stage, with its source code right underneath.

A preview pairs a rendered example with the code that produces it. The example sits centered on a stage, and the source sits below it in a regular code block, with syntax highlighting and a copy button. Readers see the result first and copy the code when they need it.

<Preview>
<Button>Get started</Button>
<Button variant="secondary">Learn more</Button>

\`\`\`html
<Button>Get started</Button>
<Button variant="secondary">Learn more</Button>
\`\`\`
</Preview>

## Preview usage

Wrap the example in \`<Preview>\` and add a fenced code block with a language. The code block becomes the code panel, and everything else goes on the stage.

\`\`\`\`html
<Preview>
<Button>Get started</Button>

\`\`\`html
<Button>Get started</Button>
\`\`\`
</Preview>
\`\`\`\`

Leave a blank line before the code block so it is read as Markdown. Only the first fenced code block with a language becomes the code panel. A preview without one shows just the stage.

## Collapsed code

Code longer than four lines starts collapsed: the panel shows the first lines and fades them out under a **View code** button. Pressing it shows the whole block and turns the button into **Hide code**. Shorter code fits as it is, so it is shown without the button.

<Preview>
<Button size="small">Small</Button>
<Button>Default</Button>
<Button size="big">Big</Button>
<Button variant="secondary" size="small">Small</Button>
<Button variant="secondary">Default</Button>
<Button variant="secondary" size="big">Big</Button>

\`\`\`html
<Button size="small">Small</Button>
<Button>Default</Button>
<Button size="big">Big</Button>
<Button variant="secondary" size="small">Small</Button>
<Button variant="secondary">Default</Button>
<Button variant="secondary" size="big">Big</Button>
\`\`\`
</Preview>

### Expanded by default

Add \`expanded\` to start with the code open. The reader can still collapse it.

\`\`\`\`html
<Preview expanded>
<Badge color="green">Live</Badge>
<Badge color="yellow">Beta</Badge>
<Badge color="red">Deprecated</Badge>
<Badge color="blue">New</Badge>
<Badge>Draft</Badge>

\`\`\`html
<Badge color="green">Live</Badge>
<Badge color="yellow">Beta</Badge>
<Badge color="red">Deprecated</Badge>
<Badge color="blue">New</Badge>
<Badge>Draft</Badge>
\`\`\`
</Preview>
\`\`\`\`

<Preview expanded>
<Badge color="green">Live</Badge>
<Badge color="yellow">Beta</Badge>
<Badge color="red">Deprecated</Badge>
<Badge color="blue">New</Badge>
<Badge>Draft</Badge>

\`\`\`html
<Badge color="green">Live</Badge>
<Badge color="yellow">Beta</Badge>
<Badge color="red">Deprecated</Badge>
<Badge color="blue">New</Badge>
<Badge>Draft</Badge>
\`\`\`
</Preview>

## Images, videos, and embeds

Any content works on the stage. Images, videos, and iframes keep their own size, centered and never wider than the stage.

<Preview>
<img src="https://docs.doccupine.com/demo.png" alt="A lake reflecting the mountains under a morning sky." width="320" />

\`\`\`html
<img src="https://docs.doccupine.com/demo.png" alt="A lake reflecting the mountains under a morning sky." width="320" />
\`\`\`
</Preview>

### Filling the stage

Add \`fill\` to stretch images, videos, and iframes to the full width of the stage, with rounded corners and a slim margin around them. An iframe without a \`height\` gets a 16:9 box.

\`\`\`\`html
<Preview fill>
<video controls src="https://samplelib.com/lib/preview/mp4/sample-20s.mp4" />

\`\`\`html
<video controls src="https://samplelib.com/lib/preview/mp4/sample-20s.mp4" />
\`\`\`
</Preview>
\`\`\`\`

<Preview fill>
<video controls src="https://samplelib.com/lib/preview/mp4/sample-20s.mp4" />

\`\`\`html
<video controls src="https://samplelib.com/lib/preview/mp4/sample-20s.mp4" />
\`\`\`
</Preview>

### Edge to edge

Add \`bleed\` to drop the stage's padding, so the content runs from edge to edge of the card and sits directly on the code panel. Images, videos, and iframes span the full width with no rounded corners of their own, and the stage no longer has a minimum height unless you set \`minHeight\`. An iframe without a \`height\` keeps its 16:9 box. When both \`fill\` and \`bleed\` are set, \`bleed\` wins.

\`\`\`\`html
<Preview bleed>
<img src="https://docs.doccupine.com/demo.png" alt="A lake reflecting the mountains under a morning sky." />

\`\`\`html
<img src="https://docs.doccupine.com/demo.png" alt="A lake reflecting the mountains under a morning sky." />
\`\`\`
</Preview>
\`\`\`\`

<Preview bleed>
<img src="https://docs.doccupine.com/demo.png" alt="A lake reflecting the mountains under a morning sky." />

\`\`\`html
<img src="https://docs.doccupine.com/demo.png" alt="A lake reflecting the mountains under a morning sky." />
\`\`\`
</Preview>

## Stage height

The stage is at least 240px tall. Set \`minHeight\` to change it, in pixels.

\`\`\`\`html
<Preview minHeight={120}>
<Badge color="green">Live</Badge>

\`\`\`html
<Badge color="green">Live</Badge>
\`\`\`
</Preview>
\`\`\`\`

<Preview minHeight={120}>
<Badge color="green">Live</Badge>

\`\`\`html
<Badge color="green">Live</Badge>
\`\`\`
</Preview>

## Properties

<Field value="children" type="node" required>
  The example to show on the stage, followed by a fenced code block with a language for the code panel.
</Field>

<Field value="minHeight" type="number">
  Minimum height of the stage in pixels. Defaults to \`240\`.
</Field>

<Field value="expanded" type="boolean">
  Start with long code open instead of collapsed. Defaults to \`false\`.
</Field>

<Field value="fill" type="boolean">
  Stretch images, videos, and iframes to the width of the stage, inside its padding. Defaults to \`false\`.
</Field>

<Field value="bleed" type="boolean">
  Drop the stage's padding so the content runs edge to edge, flush with the card and the code panel. Overrides \`fill\` when both are set. Defaults to \`false\`.
</Field>`;
