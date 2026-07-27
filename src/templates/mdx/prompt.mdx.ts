export const promptMdxTemplate = `---
title: "Prompt"
description: "Display re-usable AI prompts that readers can copy or open directly in Cursor."
date: "2026-07-27"
category: "Components"
categoryOrder: 1
order: 4
---
# Prompt

Display re-usable AI prompts that readers can copy with one click or open directly in [Cursor](https://www.cursor.com).

## Usage

You can use the Prompt component directly within your MDX files without any import. The body supports Markdown, and the copy button copies it as plain text with list items as dashes:

\`\`\`html
<Prompt description="Review code for security issues.">
You are a security-focused code reviewer. Examine the provided code and report any vulnerabilities.
- Flag unsafe input handling and injection risks.
- Suggest a safer alternative for every finding.
- Rank findings by severity, highest first.
</Prompt>
\`\`\`

<Prompt description="Review code for security issues.">
You are a security-focused code reviewer. Examine the provided code and report any vulnerabilities.
- Flag unsafe input handling and injection risks.
- Suggest a safer alternative for every finding.
- Rank findings by severity, highest first.
</Prompt>

## Actions and icon

The \`actions\` property controls which buttons appear. \`copy\` copies the prompt to the clipboard, and \`cursor\` opens it in the Cursor editor through its deeplink (readers need Cursor installed). Add a [Lucide](https://lucide.dev/icons) icon next to the description with \`icon\`:

\`\`\`html
<Prompt description="Draft a changelog entry." icon="sparkles" actions={["copy", "cursor"]}>
You are a release-notes assistant. Turn the merged pull requests I paste into a changelog entry.
- Group changes under Added, Changed, and Fixed.
- Write one plain-language line per change.
- Link each line to its pull request number.
</Prompt>
\`\`\`

<Prompt description="Draft a changelog entry." icon="sparkles" actions={["copy", "cursor"]}>
You are a release-notes assistant. Turn the merged pull requests I paste into a changelog entry.
- Group changes under Added, Changed, and Fixed.
- Write one plain-language line per change.
- Link each line to its pull request number.
</Prompt>

## Properties

<Field value="description" type="string" required>
  The text displayed in the card header above the prompt.
</Field>

<Field value="children" type="node" required>
  The prompt itself. Rendered as Markdown in the card and converted to plain text for the copy and Cursor actions.
</Field>

<Field value="actions" type="array">
  Which action buttons to show. Valid values are \`"copy"\` and \`"cursor"\`. Defaults to \`["copy"]\`.
</Field>

<Field value="icon" type="string">
  A [Lucide](https://lucide.dev/icons) icon name in kebab-case, displayed before the description.
</Field>`;
