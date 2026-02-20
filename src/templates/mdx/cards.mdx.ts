export const cardsMdxTemplate = `---
title: "Cards"
description: "Cards act as visual containers for your content, giving you flexibility to combine text, icons, images, and links in a clean and organized way."
date: "2026-02-19"
category: "Components"
categoryOrder: 1
order: 6
---
# Cards
Duplicate a page or section with ease, then emphasize important information or links using customizable layouts and icons.

Cards act as visual containers for your content, giving you flexibility to combine text, icons, images, and links in a clean and organized way.

## Cards Usage
You can use the Cards component directly within your MDX files without any import. The following example shows a basic usage:

~~~mdx
<Card title="Note" icon="badge-info">
  Doccupine CLI is a command-line tool that helps you create and manage your Doccupine project. It provides a simple and intuitive interface for creating and configuring your project.
</Card>
~~~

<Card title="Note" icon="badge-info">
  Doccupine CLI is a command-line tool that helps you create and manage your Doccupine project. It provides a simple and intuitive interface for creating and configuring your project.
</Card>

## Properties

<Field value="title" type="string" required>
  The title of the card.
</Field>

<Field value="icon" type="string">
  The [Lucide](https://lucide.dev/icons) icon name to display in the card.
</Field>

<Field value="children" type="node" required>
  The content of the card.
</Field>`;
