export const headersAndTextMdxTemplate = `---
title: "Headers and Text"
description: "Learn how to structure and style your content with headers, formatting, and links."
date: "2026-02-19"
category: "Components"
categoryOrder: 1
order: 1
---
# Headers and Text
Learn how to structure and style your content with headers, formatting, and links.

## Headers
Headers define the hierarchy of your content and automatically generate navigation anchors. They also appear in the table of contents, helping readers quickly scan through documentation.

### Creating headers
Add \`#\` symbols before text to create headers at various levels:

\`\`\`text
## Main section header
### Subsection header
#### Nested subsection header
\`\`\`

## Text Formatting
Markdown text styling is supported for emphasis, highlighting, and readability.

### Basic formatting
Use these common syntax options:

- Bold: \`**bold text**\` → **bold text**
- Italic: \`*italic text*\` → *italic text*
- Strikethrough: \`~~strikethrough~~\` → ~~strikethrough~~

### Combining formats
You can mix multiple styles at once for clarity:

\`\`\`text
**_bold and italic_**
**~~bold and strikethrough~~**
*~~italic and strikethrough~~**
\`\`\`

## Superscript and subscript
For formulas, notes, or variables, use HTML tags:

- Superscript \`X<sup>2</sup>\` → X<sup>2</sup>
- Subscript \`H<sub>2</sub>O\` → H<sub>2</sub>O

## Links
Links connect users to internal pages or external resources. Always use descriptive link text for better accessibility.

### Internal links
Reference other docs with root-relative paths:

\`\`\`text
[Getting Started](/)
[Commands](/commands)
\`\`\`

- [Getting Started](/)
- [Commands](/commands)

### External links
Point to external pages by including full URLs:

\`\`\`text
[Markdown Guide](https://www.markdownguide.org/)
\`\`\`

[Markdown Guide](https://www.markdownguide.org/)

## Blockquotes
Blockquotes are used to visually highlight key information, quotations, or examples.

### Single line blockquotes
Prefix text with \`>\` for a single-line blockquote:

\`\`\`text
> Highlighted message or quote
\`\`\`

> Highlighted message or quote

### Multi-line blockquotes
For larger quotes spanning more than one paragraph:

\`\`\`text
> This is a blockquote that spans multiple lines.
> It can include several paragraphs of text.
> Each new line starts with a \`>\` symbol.
\`\`\`

> This is a blockquote that spans multiple lines.
> It can include several paragraphs of text.
> Each new line starts with a \`>\` symbol.

## Line Breaks and Spacing
Control spacing to improve readability and layout.

### Paragraph breaks
Separate paragraphs with blank lines:

\`\`\`text
First paragraph.

Second paragraph.
\`\`\`

First paragraph.

Second paragraph.

## Manual line breaks
For shorter breaks inside the same paragraph, use \`<br />\`:

\`\`\`text
This is one line.<br />
This is the next line.
\`\`\`

This is one line.<br />
This is the next line.

# Best Practices

## Organizing content
- Use headers to establish hierarchy
- Maintain logical order (avoid skipping levels, e.g., H2 → H4)
- Always write meaningful, descriptive headers

## Formatting text
- Use **bold** for key emphasis only
- Use *italics* for emphasis or technical terms
- Limit formatting combinations to maintain readability

## Links usage
- Avoid vague text like “click here”
- Prefer root-relative paths for internal links
- Regularly validate links to ensure they are not broken`;
