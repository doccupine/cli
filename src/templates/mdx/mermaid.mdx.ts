export const mermaidMdxTemplate = `---
title: "Mermaid"
description: "Create flowcharts, sequence diagrams, and other visualizations using Mermaid syntax."
date: "2026-07-16"
category: "Components"
categoryOrder: 1
order: 16
---

# Mermaid

Create flowcharts, sequence diagrams, and other visualizations using Mermaid syntax with automatic rendering.

Write a diagram inside a \`mermaid\` code fence and it renders as an SVG:

\`\`\`\`mdx
\`\`\`mermaid
flowchart LR
  A[Start] --> B{Decision}
  B -->|Yes| C[Action]
  B -->|No| D[End]
\`\`\`
\`\`\`\`

\`\`\`mermaid
flowchart LR
  A[Start] --> B{Decision}
  B -->|Yes| C[Action]
  B -->|No| D[End]
\`\`\`

Diagrams are rendered when your site is built, so no diagramming library is shipped to your readers' browsers. They are drawn with your theme's colors and follow the light and dark toggle automatically.

## Supported diagram types

Doccupine renders diagrams with [beautiful-mermaid](https://github.com/lukilabs/beautiful-mermaid), which supports six diagram types:

| Type | Opening keyword |
| --- | --- |
| Flowchart | \`flowchart\` or \`graph\` |
| Sequence | \`sequenceDiagram\` |
| State | \`stateDiagram-v2\` |
| Class | \`classDiagram\` |
| Entity relationship | \`erDiagram\` |
| XY chart | \`xychart-beta\` |

Other Mermaid diagram types - including \`pie\`, \`gantt\`, \`mindmap\`, \`journey\`, and \`gitGraph\` - are not supported. A diagram that cannot be rendered falls back to a plain code block showing its source, and the reason is logged when your site builds. A broken diagram never breaks the page.

## Examples

### Sequence diagram

\`\`\`mermaid
sequenceDiagram
  participant Reader
  participant Docs
  participant Search
  Reader->>Docs: Open a page
  Docs->>Search: Index the content
  Search-->>Reader: Return results
\`\`\`

### Subgraphs

\`\`\`mermaid placement="top-right"
flowchart LR
  subgraph one
    direction TB
    top1[top] --> bottom1[bottom]
  end
  subgraph two
    direction TB
    top2[top] --> bottom2[bottom]
  end
  outside --> one
  outside --> top2
\`\`\`

## Interactive controls

Diagrams include zoom in and out, pan in four directions, reset the view, and full screen. You can also drag a diagram with your mouse to move it around.

By default the controls appear once a diagram is taller than 120px, since a diagram that already fits does not need them. Use the \`actions\` property to decide explicitly. Setting \`actions={false}\` turns off the whole interactive layer, including dragging.

## Properties

<Field value="placement" type="string">
  Where the controls sit. One of \`top-left\`, \`top-right\`, \`bottom-left\`, or \`bottom-right\`. Defaults to \`bottom-right\`.
</Field>

<Field value="actions" type="boolean">
  Show or hide the controls. When set, this overrides the default behavior of showing them only on diagrams taller than 120px.
</Field>

Set properties on the opening fence, after the language:

\`\`\`\`mdx
\`\`\`mermaid placement="top-left" actions={true}
flowchart LR
  A --> B
\`\`\`
\`\`\`\`

To hide the controls entirely:

\`\`\`\`mdx
\`\`\`mermaid actions={false}
flowchart LR
  A --> B
\`\`\`
\`\`\`\`

\`\`\`mermaid actions={false}
flowchart LR
  A --> B
\`\`\`

## Layout

Diagrams are laid out with the [ELK](https://eclipse.dev/elk/) engine, which arranges nodes to reduce overlapping edges and keep large diagrams readable. It is always on, so no directive is needed to enable it.

If you are porting diagrams from another tool, a \`%%{init: ...}%%\` directive is read as a comment and ignored rather than causing an error.

## Theming

Diagram colors come from CSS variables, so they follow your theme and the light/dark toggle without re-rendering. Override any of them in your own CSS to restyle diagrams:

\`\`\`css
:root {
  --mermaid-bg: var(--color-light);
  --mermaid-fg: var(--color-dark);
  --mermaid-line: var(--color-grayDark);
  --mermaid-accent: var(--color-accent);
  --mermaid-muted: var(--color-grayDark);
  --mermaid-surface: var(--color-grayLight);
  --mermaid-border: var(--color-gray);
}
\`\`\`

## Syntax reference

For the syntax of each supported diagram type, see the [Mermaid documentation](https://mermaid.js.org/intro/). Keep to the six types listed above.`;
