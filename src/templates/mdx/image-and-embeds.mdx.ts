export const imageAndEmbedsMdxTemplate = `---
title: "Images and embeds"
description: "Enrich your documentation with visuals, videos, and interactive embeds."
date: "2026-02-19"
category: "Components"
categoryOrder: 1
order: 8
---
# Images and embeds
Enrich your documentation with visuals, videos, and interactive embeds.

Display images, embed video content, or add interactive frames via iframes to supplement your docs.

![Demo Image](https://docs.doccupine.com/demo.png)

## Images
Images enhance documentation with context, illustration, or decorative visual cues.

### Basic Image Syntax
Include an image in Markdown using the syntax below:

\`\`\`md
![Alt text](https://docs.doccupine.com/demo.png)
\`\`\`

<Callout type="note">
  Use clear, descriptive alt text for accessibility and better SEO. Alt text should describe the image’s appearance or content.
</Callout>

### HTML image embeds
Embed images in your Markdown content using HTML syntax.

\`\`\`md
<img src="https://docs.doccupine.com/demo.png" alt="Alt text">
\`\`\`

### Theme-aware images
Show different images depending on whether the user is in light or dark mode. Add the \`light-only\` or \`dark-only\` className to display an image exclusively in that theme.

\`\`\`md
<img className="light-only" src="/images/diagram-light.png" alt="Diagram">
<img className="dark-only" src="/images/diagram-dark.png" alt="Diagram">
\`\`\`

<img className="light-only" src="https://docs.doccupine.com/demo.png" alt="This image is only visible in light mode" />
<img className="dark-only" src="https://docs.doccupine.com/demo.png" alt="This image is only visible in dark mode" style={{ filter: "invert(1)" }} />

<Callout type="note">
  The \`light-only\` and \`dark-only\` classes work on any element, not just images. You can use them on videos, iframes, or wrapper divs too.
</Callout>

## Videos
Videos add a dynamic element to your documentation, engaging your audience and providing a more immersive experience.

### YouTube Embed
To embed a YouTube video, use the following syntax:

\`\`\`html
<iframe
  className="aspect-video"
  src="https://www.youtube.com/embed/ResP_eVPYQo"
  title="YouTube video player"
  frameBorder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
></iframe>
\`\`\`

<iframe
  className="aspect-video"
  src="https://www.youtube.com/embed/ResP_eVPYQo"
  title="YouTube video player"
  frameBorder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
></iframe>

### Self-hosted videos
Serve up your own video content using the \`<video>\` tag:

\`\`\`html
<video
  controls
  className="aspect-video"
  src="https://samplelib.com/lib/preview/mp4/sample-20s.mp4"
></video>
\`\`\`

<video
  controls
  className="aspect-video"
  src="https://samplelib.com/lib/preview/mp4/sample-20s.mp4"
></video>


#### Autoplay and Looping
For demonstration videos that loop or start automatically, add attributes as shown:

\`\`\`html
<video
  controls
  className="aspect-video"
  src="https://samplelib.com/lib/preview/mp4/sample-20s.mp4"
  autoPlay
  muted
  loop
  playsInline
></video>
\`\`\`
`;
