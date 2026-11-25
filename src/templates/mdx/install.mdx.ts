export const installMdxTemplate = `---
title: "Install"
description: "Show an install command for npm, pnpm, yarn, and bun, in the reader's package manager."
date: "2026-11-25"
category: "Components"
categoryOrder: 1
order: 5
---
# Install

Show an install command for npm, pnpm, yarn, and bun, in the reader's package manager.

Write the package name once and \`<Install>\` turns it into the right command for each package manager, as tabs with a copy button. When a reader picks their package manager, every install command on the site switches to it, and the pick is remembered for their next visit.

<Install>doccupine</Install>

## Install usage

Put the package names inside \`<Install>\`. Separate several packages with spaces.

\`\`\`html
<Install>doccupine</Install>
<Install>react react-dom</Install>
\`\`\`

<Install>react react-dom</Install>

Pick a tab in one block and the other blocks on the page follow.

## Development dependencies

Add \`dev\` to install the packages as development dependencies.

\`\`\`html
<Install dev>typescript @types/node</Install>
\`\`\`

<Install dev>typescript @types/node</Install>

## Run without installing

Add \`exec\` to run a package without installing it, the way \`npx\` does. Everything after the package name is passed to it as arguments.

\`\`\`html
<Install exec>doccupine build</Install>
\`\`\`

<Install exec>doccupine build</Install>

<Callout type="note">
  \`yarn dlx\` needs Yarn 2 or later. Readers on Yarn 1 can use the npm tab.
</Callout>

## Commands

| Package manager | Install | With \`dev\` | With \`exec\` |
| --- | --- | --- | --- |
| npm | \`npm install\` | \`npm install -D\` | \`npx\` |
| pnpm | \`pnpm add\` | \`pnpm add -D\` | \`pnpm dlx\` |
| yarn | \`yarn add\` | \`yarn add -D\` | \`yarn dlx\` |
| bun | \`bun add\` | \`bun add -d\` | \`bunx\` |

<Callout type="note">
  The page is rendered with npm selected. A reader's own pick replaces it as soon as the page loads. For other commands that differ by tool, use [code tabs](/code#tabbed-code-blocks).
</Callout>

## Properties

<Field value="children" type="string" required>
  The packages to install, separated by spaces. With \`exec\`, the package to run followed by its arguments.
</Field>

<Field value="packages" type="string">
  The packages, when you would rather pass them as a property than as the children.
</Field>

<Field value="dev" type="boolean">
  Install the packages as development dependencies. Defaults to \`false\`.
</Field>

<Field value="exec" type="boolean">
  Run the package without installing it (\`npx\`, \`pnpm dlx\`, \`yarn dlx\`, \`bunx\`). Takes precedence over \`dev\`. Defaults to \`false\`.
</Field>`;
