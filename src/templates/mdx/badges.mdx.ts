export const badgesMdxTemplate = `---
title: "Badges"
description: "Highlight statuses, version labels, and metadata inline with colored badges."
date: "2026-07-27"
category: "Components"
categoryOrder: 1
order: 12
---
# Badges

Highlight statuses, version labels, and metadata with small colored badges - inline within text or standing on their own.

## Basic badge

You can use the Badge component directly within your MDX files without any import:

\`\`\`html
<Badge>Badge</Badge>
\`\`\`

<Badge>Badge</Badge>

## Colors

The \`color\` property selects one of eleven variants to convey different meanings:

\`\`\`html
<Badge color="gray">Badge</Badge>
<Badge color="blue">Badge</Badge>
<Badge color="green">Badge</Badge>
<Badge color="yellow">Badge</Badge>
<Badge color="orange">Badge</Badge>
<Badge color="red">Badge</Badge>
<Badge color="purple">Badge</Badge>
<Badge color="white">Badge</Badge>
<Badge color="surface">Badge</Badge>
<Badge color="white-destructive">Badge</Badge>
<Badge color="surface-destructive">Badge</Badge>
\`\`\`

<Badge color="gray">Badge</Badge>
<Badge color="blue">Badge</Badge>
<Badge color="green">Badge</Badge>
<Badge color="yellow">Badge</Badge>
<Badge color="orange">Badge</Badge>
<Badge color="red">Badge</Badge>
<Badge color="purple">Badge</Badge>
<Badge color="white">Badge</Badge>
<Badge color="surface">Badge</Badge>
<Badge color="white-destructive">Badge</Badge>
<Badge color="surface-destructive">Badge</Badge>

The \`white\` and \`white-destructive\` badges stay literally white in both light and dark mode, which keeps them legible on top of images, colored frames, and hero areas. Their \`surface\` counterparts follow the active theme instead - white on light pages, dark on dark ones - so reach for those when the badge sits in regular page content.

## Sizes

Four sizes match different content hierarchies:

\`\`\`html
<Badge size="xs">Badge</Badge>
<Badge size="sm">Badge</Badge>
<Badge size="md">Badge</Badge>
<Badge size="lg">Badge</Badge>
\`\`\`

<Badge size="xs">Badge</Badge>
<Badge size="sm">Badge</Badge>
<Badge size="md">Badge</Badge>
<Badge size="lg">Badge</Badge>

## Shapes

Choose between rounded corners and a pill shape:

\`\`\`html
<Badge shape="rounded">Badge</Badge>
<Badge shape="pill">Badge</Badge>
\`\`\`

<Badge shape="rounded">Badge</Badge>
<Badge shape="pill">Badge</Badge>

## Icons

Add a [Lucide](https://lucide.dev/icons) icon (kebab-case name) for extra context. Unknown names render nothing, so a typo never breaks the page:

\`\`\`html
<Badge icon="circle-check" color="green">Passing</Badge>
<Badge icon="clock" color="orange">Pending</Badge>
<Badge icon="ban" color="red">Blocked</Badge>
\`\`\`

<Badge icon="circle-check" color="green">Passing</Badge>
<Badge icon="clock" color="orange">Pending</Badge>
<Badge icon="ban" color="red">Blocked</Badge>

## Stroke variant

Set \`stroke\` for an outline instead of a filled background:

\`\`\`html
<Badge stroke color="blue">Badge</Badge>
<Badge stroke color="green">Badge</Badge>
<Badge stroke color="orange">Badge</Badge>
<Badge stroke color="red">Badge</Badge>
\`\`\`

<Badge stroke color="blue">Badge</Badge>
<Badge stroke color="green">Badge</Badge>
<Badge stroke color="orange">Badge</Badge>
<Badge stroke color="red">Badge</Badge>

## Solid variant

Set \`solid\` for a strong filled background with contrasting text:

\`\`\`html
<Badge solid color="blue">Badge</Badge>
<Badge solid color="green">Badge</Badge>
<Badge solid color="red">Badge</Badge>
<Badge solid color="purple">Badge</Badge>
\`\`\`

<Badge solid color="blue">Badge</Badge>
<Badge solid color="green">Badge</Badge>
<Badge solid color="red">Badge</Badge>
<Badge solid color="purple">Badge</Badge>

## Semantic colors

The \`info\`, \`success\`, \`warning\`, and \`error\` colors come from your theme rather than the fixed palette, so they follow your \`theme.json\` and the light/dark toggle. They support the same \`stroke\` and \`solid\` variations:

\`\`\`html
<Badge color="info">Badge</Badge>
<Badge color="success">Badge</Badge>
<Badge color="warning">Badge</Badge>
<Badge color="error">Badge</Badge>
<Badge solid color="info">Badge</Badge>
<Badge solid color="success">Badge</Badge>
\`\`\`

<Badge color="info">Badge</Badge>
<Badge color="success">Badge</Badge>
<Badge color="warning">Badge</Badge>
<Badge color="error">Badge</Badge>
<Badge solid color="info">Badge</Badge>
<Badge solid color="success">Badge</Badge>

## HTTP method badges

Set \`mono\` for a monospace, uppercase label. Combining \`mono\`, \`solid\`, and the semantic colors gives the method chips Doccupine itself uses in the sidebar navigation and the API playground:

\`\`\`html
<Badge mono solid color="info" size="sm">GET</Badge>
<Badge mono solid color="success" size="sm">POST</Badge>
<Badge mono solid color="warning" size="sm">PUT</Badge>
<Badge mono solid color="error" size="sm">DELETE</Badge>
\`\`\`

<Badge mono solid color="info" size="sm">GET</Badge>
<Badge mono solid color="success" size="sm">POST</Badge>
<Badge mono solid color="warning" size="sm">PUT</Badge>
<Badge mono solid color="error" size="sm">DELETE</Badge>

## Disabled state

Set \`disabled\` to indicate inactive or unavailable states with reduced opacity:

\`\`\`html
<Badge disabled icon="lock" color="gray">Badge</Badge>
<Badge disabled icon="lock" color="blue">Badge</Badge>
\`\`\`

<Badge disabled icon="lock" color="gray">Badge</Badge>
<Badge disabled icon="lock" color="blue">Badge</Badge>

## Inline usage

Badges flow naturally with the surrounding text. For example, this feature requires a <Badge color="orange" size="sm">Premium</Badge> subscription, and this endpoint returns <Badge color="green" size="sm">JSON</Badge>.

\`\`\`html
This feature requires a <Badge color="orange" size="sm">Premium</Badge> subscription.
\`\`\`

## Combined properties

All properties compose freely:

\`\`\`html
<Badge icon="star" color="purple" size="lg" shape="pill">Pro</Badge>
<Badge icon="check" stroke color="green" size="sm">Verified</Badge>
<Badge icon="flask-conical" color="blue" shape="rounded">Beta</Badge>
\`\`\`

<Badge icon="star" color="purple" size="lg" shape="pill">Pro</Badge>
<Badge icon="check" stroke color="green" size="sm">Verified</Badge>
<Badge icon="flask-conical" color="blue" shape="rounded">Beta</Badge>

## Properties

<Field value="color" type="string">
  Badge color variant. Defaults to \`gray\`. Options: \`gray\`, \`blue\`, \`green\`, \`yellow\`, \`orange\`, \`red\`, \`purple\`, \`white\`, \`surface\`, \`white-destructive\`, \`surface-destructive\`, plus the theme-driven \`info\`, \`success\`, \`warning\`, and \`error\`.
</Field>

<Field value="size" type="string">
  Badge size. Defaults to \`md\`. Options: \`xs\`, \`sm\`, \`md\`, \`lg\`.
</Field>

<Field value="shape" type="string">
  Badge shape. Defaults to \`rounded\`. Options: \`rounded\`, \`pill\`.
</Field>

<Field value="icon" type="string">
  A [Lucide](https://lucide.dev/icons) icon name in kebab-case, displayed before the badge text.
</Field>

<Field value="stroke" type="boolean">
  Display the badge with an outline instead of a filled background. Defaults to \`false\`.
</Field>

<Field value="solid" type="boolean">
  Display the badge with a strong filled background and contrasting text. Takes precedence over \`stroke\`. Defaults to \`false\`.
</Field>

<Field value="mono" type="boolean">
  Render the label in monospace uppercase, for code-like labels such as HTTP methods. Defaults to \`false\`.
</Field>

<Field value="disabled" type="boolean">
  Display the badge in a disabled state with reduced opacity. Defaults to \`false\`.
</Field>

<Field value="className" type="string">
  Additional CSS classes to apply to the badge.
</Field>

<Field value="children" type="node" required>
  The badge label.
</Field>`;
