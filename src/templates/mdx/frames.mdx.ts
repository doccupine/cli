export const framesMdxTemplate = `---
title: "Frames"
description: "Give images, videos, and diagrams a bordered container with an optional caption."
date: "2026-02-19"
category: "Components"
categoryOrder: 1
order: 17
---
# Frames

Give images, videos, and diagrams a bordered container with an optional caption.

A frame lifts visual content out of the surrounding prose. It centers whatever you put inside, wraps it in a soft border, and gives you a place to attach a caption - so screenshots and diagrams read as deliberate figures rather than stray images.

<Frame>
  <img src="https://docs.doccupine.com/demo.png" alt="A product screenshot displayed inside a frame." />
</Frame>

## Frame usage

Wrap any visual element in \`<Frame>\`. Images, videos, iframes, and Mermaid diagrams all work.

\`\`\`html
<Frame>
  <img src="/images/dashboard.png" alt="The project dashboard." />
</Frame>
\`\`\`

## Captions

Pass a \`caption\` to add a short line of context under the content, inside the frame.

\`\`\`html
<Frame caption="The dashboard groups every project by workspace.">
  <img src="/images/dashboard.png" alt="The project dashboard." />
</Frame>
\`\`\`

<Frame caption="The dashboard groups every project by workspace.">
  <img src="https://docs.doccupine.com/demo.png" alt="The project dashboard." />
</Frame>

### Formatting inside captions

Captions understand a small set of inline Markdown: links, bold, italic, and inline code wrapped in backticks. Everything else is rendered as plain text.

\`\`\`html
<Frame caption="**Heads up:** run \`doccupine build\` before you [deploy](/deployment-and-hosting).">
  <img src="/images/dashboard.png" alt="The project dashboard." />
</Frame>
\`\`\`

<Frame caption="**Heads up:** run \`doccupine build\` before you [deploy](/deployment-and-hosting).">
  <img src="https://docs.doccupine.com/demo.png" alt="The project dashboard." />
</Frame>

<Callout type="note">
  Links that point to a path starting with \`/\` are routed through Next.js, so they navigate without a full page reload. External links open in a new tab.
</Callout>

## Hints

A \`hint\` is a line of text that sits above the frame. Use it to set up what the reader is about to look at - captions work better for describing what they just saw.

\`\`\`html
<Frame hint="Every workspace you belong to appears in the switcher." caption="The dashboard groups every project by workspace.">
  <img src="/images/dashboard.png" alt="The project dashboard." />
</Frame>
\`\`\`

<Frame hint="Every workspace you belong to appears in the switcher." caption="The dashboard groups every project by workspace.">
  <img src="https://docs.doccupine.com/demo.png" alt="The project dashboard." />
</Frame>

Hints accept the same inline Markdown as captions.

## Videos

Videos can be framed like any other element. A video with \`autoPlay\` is given \`muted\`, \`loop\`, and \`playsInline\` automatically, because browsers refuse to autoplay a video with sound and iOS otherwise opens it fullscreen.

\`\`\`html
<Frame caption="Creating a project takes about twenty seconds.">
  <video autoPlay src="/videos/create-project.mp4" />
</Frame>
\`\`\`

Set any of those attributes yourself and your value is kept. Videos without \`autoPlay\` are left exactly as you wrote them, so add \`controls\` when you want the reader to press play.

\`\`\`html
<Frame caption="A twenty second walkthrough.">
  <video controls src="/videos/create-project.mp4" />
</Frame>
\`\`\`

<Frame caption="A twenty second walkthrough.">
  <video controls className="aspect-video" src="https://samplelib.com/lib/preview/mp4/sample-20s.mp4" />
</Frame>

## Multiple elements

A frame can hold more than one child. They stack vertically and stay centered, which is handy for a before-and-after pair under a single caption.

<Frame caption="Light and dark renderings of the same diagram.">
  <img src="https://docs.doccupine.com/demo.png" alt="The diagram in light mode." />
  <img src="https://docs.doccupine.com/demo.png" alt="The diagram in dark mode." style={{ filter: "invert(1)" }} />
</Frame>

<Callout type="note">
  Frames don't replace alt text. Keep writing descriptive \`alt\` attributes - a caption is visible to everyone, while alt text is what screen readers announce in place of the image.
</Callout>

## Properties

<Field value="children" type="node" required>
  The content to frame. Usually an image, video, iframe, or diagram.
</Field>

<Field value="caption" type="string">
  Text shown inside the frame, centered below the content. Supports inline Markdown.
</Field>

<Field value="hint" type="string">
  Text shown above the frame. Supports inline Markdown.
</Field>`;
