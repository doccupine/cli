export const componentsMdxTemplate = `---
title: "Components"
description: "Explore the full library of built-in components available in your documentation pages."
date: "2026-02-19"
category: "Components"
categoryOrder: 1
order: 0
---
# Components

Doccupine includes a rich set of built-in components you can use directly in your MDX files - no imports needed. Browse the full library below.

<Columns cols={3}>
  <Card title="Headers and Text" icon="heading" href="/headers-and-text">
    Headings, paragraphs, bold, italic, links, and other text formatting.
  </Card>
  <Card title="Lists and Tables" icon="list" href="/lists-and-tables">
    Ordered lists, unordered lists, and data tables.
  </Card>
  <Card title="Code" icon="code" href="/code">
    Inline code, fenced code blocks, and syntax highlighting.
  </Card>
  <Card title="Accordion" icon="chevrons-down" href="/accordion">
    Collapsible sections for organizing lengthy content.
  </Card>
  <Card title="Tabs" icon="panel-top" href="/tabs">
    Tabbed interfaces for grouping related content.
  </Card>
  <Card title="Cards" icon="square" href="/cards">
    Visual containers for content, icons, and links.
  </Card>
  <Card title="Buttons" icon="mouse-pointer-click" href="/buttons">
    Action components with variants, sizes, and icons.
  </Card>
  <Card title="Callouts" icon="megaphone" href="/callouts">
    Highlighted blocks for tips, warnings, and important notes.
  </Card>
  <Card title="Images and Embeds" icon="image" href="/images-and-embeds">
    Images, videos, and embedded content.
  </Card>
  <Card title="Icons" icon="smile" href="/icons">
    Lucide icons you can use anywhere in your docs.
  </Card>
  <Card title="Fields" icon="text-cursor-input" href="/fields">
    Property and parameter documentation blocks.
  </Card>
  <Card title="Update" icon="bell" href="/update">
    Changelog and update announcement blocks.
  </Card>
  <Card title="Columns" icon="columns-3" href="/columns">
    Grid layouts for arranging cards and content side by side.
  </Card>
  <Card title="Steps" icon="footprints" href="/steps">
    Numbered step-by-step guides and walkthroughs.
  </Card>
</Columns>`;
