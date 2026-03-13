export const colorSwatchesMdxTemplate = `---
title: "Color Swatches"
description: "Display color palettes with labeled swatches to document your theme colors."
date: "2026-02-19"
category: "Components"
categoryOrder: 1
order: 8
---
# Color Swatches
Display color palettes with labeled swatches to document your theme colors.

The \`ColorSwatch\` component renders a visual preview of a color alongside its token name, and \`ColorSwatchGroup\` arranges multiple swatches in a responsive grid.

## Usage
You can use the ColorSwatch components directly within your MDX files without any import:

~~~mdx
<ColorSwatchGroup>
  <ColorSwatch token="primary" value="#6366F1" />
  <ColorSwatch token="secondary" value="#EC4899" />
  <ColorSwatch token="success" value="#10B981" />
  <ColorSwatch token="warning" value="#F59E0B" />
  <ColorSwatch token="danger" value="#EF4444" />
  <ColorSwatch token="info" value="#3B82F6" />
</ColorSwatchGroup>
~~~

<ColorSwatchGroup>
  <ColorSwatch token="primary" value="#6366F1" />
  <ColorSwatch token="secondary" value="#EC4899" />
  <ColorSwatch token="success" value="#10B981" />
  <ColorSwatch token="warning" value="#F59E0B" />
  <ColorSwatch token="danger" value="#EF4444" />
  <ColorSwatch token="info" value="#3B82F6" />
</ColorSwatchGroup>

## Dark Colors

Text color automatically adapts based on the background luminance, so dark swatches display white text:

~~~mdx
<ColorSwatchGroup>
  <ColorSwatch token="dark" value="#1E1E2E" />
  <ColorSwatch token="grayDark" value="#374151" />
  <ColorSwatch token="gray" value="#6B7280" />
  <ColorSwatch token="grayLight" value="#D1D5DB" />
  <ColorSwatch token="light" value="#F9FAFB" />
  <ColorSwatch token="white" value="#FFFFFF" />
</ColorSwatchGroup>
~~~

<ColorSwatchGroup>
  <ColorSwatch token="dark" value="#1E1E2E" />
  <ColorSwatch token="grayDark" value="#374151" />
  <ColorSwatch token="gray" value="#6B7280" />
  <ColorSwatch token="grayLight" value="#D1D5DB" />
  <ColorSwatch token="light" value="#F9FAFB" />
  <ColorSwatch token="white" value="#FFFFFF" />
</ColorSwatchGroup>

## ColorSwatch Properties

<Field value="token" type="string" required>
  The name or label displayed below the color preview (e.g. a design token name).
</Field>

<Field value="value" type="string" required>
  A hex color value (e.g. \`#6366F1\`). Displayed inside the color preview and used as the background.
</Field>

## ColorSwatchGroup Properties

<Field value="children" type="node" required>
  One or more \`ColorSwatch\` components to display in a responsive grid.
</Field>`;
