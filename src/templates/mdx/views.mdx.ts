export const viewsMdxTemplate = `---
title: "Views"
description: "Write one page for several frameworks or languages, and let readers pick theirs."
date: "2026-11-25"
category: "Components"
categoryOrder: 1
order: 10
---
# Views

Write one page for several frameworks or languages, and let readers pick theirs.

Wrap each alternative in \`<View title="...">\`. The page header gets a selector listing every view title on the page, and picking one shows the matching view everywhere on the page. Try the selector in this page's header.

## Getting started

<View title="React">

Install the React package and render the widget inside your app.

<Install>@acme/widget-react</Install>

\`\`\`jsx
import { Widget } from "@acme/widget-react";

export function App() {
  return <Widget theme="light" />;
}
\`\`\`

</View>

<View title="Vue">

Install the Vue package and register the component.

<Install>@acme/widget-vue</Install>

\`\`\`html
<script setup>
import { Widget } from "@acme/widget-vue";
</script>

<template>
  <Widget theme="light" />
</template>
\`\`\`

</View>

## Theming

The same pick applies to every group of views on the page.

<View title="React">
  Pass \`theme="dark"\` to \`<Widget>\` to follow a dark page.
</View>

<View title="Vue">
  Bind \`:theme="mode"\` on \`<Widget>\` to follow the page's mode.
</View>

## Views usage

Give the views of each alternative the same \`title\`, and repeat the set wherever the content differs.

\`\`\`\`html
<View title="React">

\`\`\`jsx
<Widget theme="light" />
\`\`\`

</View>

<View title="Vue">

\`\`\`html
<Widget theme="light" />
\`\`\`

</View>
\`\`\`\`

Leave a blank line around Markdown inside a view, such as code blocks and lists, as with any component.

## Behavior

- **One selector per page**: it sits in the page header, next to **Copy content**, and lists the titles in the order they first appear.
- **Remembered**: the pick is remembered across the site by title, so a reader who picks Vue sees the Vue views on every page that has them. A page without that title shows its first one.
- **No flash**: the remembered view is chosen before the page first paints, so a returning reader never sees the first view flash by.
- **Search and AI**: every view is part of the page's text, so search and AI tools see all of them.

<Callout type="note">
  Use views when most of a page is shared and only some parts differ. When a whole block is an either-or, such as a single code sample, [tabs](/tabs) or [code tabs](/code#tabbed-code-blocks) keep the choice next to the content.
</Callout>

<Callout type="note">
  Headings inside a view appear in the "On this page" list for every view. Prefer bold text over headings inside views.
</Callout>

## Properties

<Field value="title" type="string" required>
  The view's name in the selector. Views with the same title belong to the same alternative.
</Field>

<Field value="children" type="node" required>
  The content shown when this view is picked.
</Field>`;
