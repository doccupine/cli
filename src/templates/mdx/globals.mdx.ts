import {
  DEFAULT_DESCRIPTION,
  DEFAULT_FAVICON,
  DEFAULT_OG_IMAGE,
} from "../../lib/constants.js";

export const globalsMdxTemplate = `---
title: "Globals"
description: "Configure global settings for your documentation."
date: "2026-02-19"
category: "Configuration"
categoryOrder: 3
order: 1
---
# Global Configuration
Use a \`config.json\` file to define project‑wide metadata for your documentation site. These values are applied to every generated page unless a page overrides them in its own frontmatter.

## config.json
Place a \`config.json\` at your project root (the same folder where you execute \`npx doccupine\`) to define global metadata for your documentation site.

\`\`\`json
{
  "name": "Doccupine",
  "description": "${DEFAULT_DESCRIPTION}",
  "icon": "${DEFAULT_FAVICON}",
  "image": "${DEFAULT_OG_IMAGE}"
}
\`\`\`

## Fields
- **name**: The primary name of your documentation website. Displayed in the site title and used in various UI elements.
- **description**: A concise summary of your project, used in site metadata (e.g., HTML meta description) and social previews when not overridden.
- **icon**: The favicon for your site. You can provide a full URL or a relative path to an asset in your project.
- **image**: The Open Graph image used when links to your docs are shared on social platforms. Accepts a full URL or a relative path.

## Per-page overrides
Any page can override global values by defining the matching key in its frontmatter. When present, the page's value takes precedence over \`config.json\` for that page only.

| Frontmatter field | Overrides | Effect |
|---|---|---|
| **title** | - | Page title in metadata and Open Graph |
| **description** | \`description\` | Meta description and Open Graph description |
| **name** | \`name\` | Site name shown in the title suffix (e.g. "Page - My Docs") |
| **icon** | \`icon\` | Favicon for this page |
| **image** | \`image\` | Open Graph preview image |

<Callout type="note">
  If a key is not specified in a page's frontmatter, Doccupine falls back to the corresponding value in \`config.json\`.
</Callout>

Example frontmatter in an \`.mdx\` file:

\`\`\`text
---
title: "My Feature"
description: "A focused description just for this page."
name: "My Product Docs"
icon: "/custom-favicon.ico"
image: "/custom-preview.png"
date: "2026-02-19"
category: "Guides"
---
\`\`\`

`;
