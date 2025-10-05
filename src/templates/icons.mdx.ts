export const iconsMdxTemplate = `---
title: "Icons"
description: "This is my first Doccupine project"
date: "2025-01-15"
category: "Components"
categoryOrder: 0
order: 8
---
# Icons

Integrate visual icons from well-known libraries to enrich your documentation.

Icons can be sourced from Lucide, SVG elements, external URLs, or local files within your project directory.

<Icon name="flag" size={32} />

\`\`\`text
<Icon name="flag" size={32} />
\`\`\`

## Inline icons
You can use icons directly within text to highlight information or add visual context.

<Icon name="flag" size={16} /> Build your documentation seamlessly.

\`\`\`text
<Icon name="flag" size={16} /> Build your documentation seamlessly.
\`\`\`

## Properties

<Field value="name" type="string" required>
  The icon to display.
</Field>

- [**Lucide icon**](https://lucide.dev/icons) name

<Field value="size" type="number">
  The size of the icon in pixels.
</Field>

<Field value="color" type="string">
  The color of the icon as a hex code (for example, \`#FF5733\`).
</Field>`;
