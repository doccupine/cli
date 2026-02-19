export const buttonsMdxTemplate = `---
title: "Buttons"
description: "A flexible action component supporting variants, sizes, icons, and links."
date: "2026-02-19"
category: "Components"
categoryOrder: 1
order: 7
---
# Buttons
A flexible action component supporting variants, sizes, icons, and links.

Buttons help users initiate actions or navigate to other pages. Use variants to convey emphasis, size for hierarchy, and icons to add clarity.

## Button Usage
You can use the Button component directly within your MDX files without any import. The following examples show basic usage:

\`\`\`mdx
<Button>Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="tertiary">Tertiary</Button>
\`\`\`

<Button>Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="tertiary">Tertiary</Button>

### Sizes

\`\`\`mdx
<Button size="default">Default size</Button>
<Button size="big">Big size</Button>
\`\`\`

<Button size="default">Default size</Button>
<Button size="big">Big size</Button>

### Outline

\`\`\`mdx
<Button outline>Outlined</Button>
\`\`\`

<Button outline>Outlined</Button>

### Full width

\`\`\`mdx
<Button fullWidth>Full width button</Button>
\`\`\`

<Button fullWidth>Full width button</Button>

### With icon

\`\`\`mdx
<Button icon="arrow-right" iconPosition="left">With left icon</Button>
<Button icon="arrow-right" iconPosition="right">With right icon</Button>
\`\`\`

<Button icon="arrow-right" iconPosition="left">With left icon</Button>
<Button icon="arrow-right" iconPosition="right">With right icon</Button>

### As a link
Buttons can render as links when you provide an \`href\`.

\`\`\`mdx
<Button href="/">Home</Button>
\`\`\`

<Button href="/">Home</Button>

## Properties

<Field value="children" type="node" required>
  The content of the button.
</Field>

<Field value="variant" type="string">
  Controls visual emphasis.
</Field>

- **primary**
- **secondary**
- **tertiary**

<Field value="size" type="string">
  Controls the size of the button.
</Field>

- **default**
- **big**

<Field value="outline" type="boolean">
  When true, renders the outlined style of the selected variant.
</Field>

<Field value="fullWidth" type="boolean">
  When true, the button expands to the full width of its container.
</Field>

<Field value="icon" type="string">
  Optional icon to display inside the button.
</Field>

- [**Lucide icon**](https://lucide.dev/icons) name or icon node

<Field value="iconPosition" type="string">
  The position of the icon relative to the text.
</Field>

- **left**
- **right**

<Field value="href" type="string">
  When provided, the button renders as a link (\`<a>\`), enabling navigation.
</Field>`;
