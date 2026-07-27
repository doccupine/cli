export const sidePanelMdxTemplate = `---
title: "Side Panel"
description: "Replace a page's table of contents with your own content, pinned to the right rail on desktop and inline on mobile."
date: "2026-07-27"
category: "Components"
categoryOrder: 1
order: 18
---
# Side Panel

Pin supplementary content - notes, links, examples, anything - to the right side of a page.

<SidePanel>
  <Callout type="note">
    This page uses a \`SidePanel\`, so it has no table of contents.
  </Callout>
  <Card title="Components" icon="blocks" href="/components">
    Any component works inside a panel.
  </Card>
</SidePanel>

The \`SidePanel\` component takes over the right rail that normally holds the "On this page" table of contents. Use it when a page benefits more from persistent context - a related link, a note, a quick reference - than from a list of headings.

## Side Panel Usage

Place a \`SidePanel\` anywhere in your MDX file. On desktop its position in the file does not matter; it always renders in the right rail.

\`\`\`html
<SidePanel>
  <Callout type="note">Pin a note to the side panel.</Callout>
</SidePanel>
\`\`\`

## Behavior

- **Desktop**: the panel is pinned to the right rail and scrolls independently of the page. It is as wide as the navigation sidebar, and on wide screens it grows to the width of the AI chat panel, with the page content, navigation buttons, and footer shifting left to make room.
- **Mobile**: the panel renders inline, exactly where you placed it in the file. Put it near the top of the page if you want readers to see it first.
- **Table of contents**: any page containing a \`SidePanel\` hides its "On this page" list. The panel and the table of contents share the same column.
- **Code samples**: a \`SidePanel\` shown inside a code block is just text, so documenting the component does not hide your table of contents.

<Callout type="warning">
  Use one \`SidePanel\` per page. Multiple panels stack on top of each other in the right rail.
</Callout>

## What to put in a panel

Any component works inside a \`SidePanel\`. Keep it scannable - the rail is meant for supporting material, not a second article.

\`\`\`html
<SidePanel>
  <Card title="API Reference" icon="code" href="/api-playground">
    Browse every endpoint.
  </Card>
  <Callout type="tip">Panels scroll independently of the page.</Callout>
</SidePanel>
\`\`\`

## Properties

<Field value="children" type="node" required>
  The content of the side panel.
</Field>`;
