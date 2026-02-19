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
  "description": "Doccupine is a free and open-source document management system that allows you to store, organize, and share your documentation with ease. AI-ready.",
  "icon": "https://doccupine.com/favicon.ico",
  "preview": "https://doccupine.com/preview.png"
}
\`\`\`

## Fields
- **name**: The primary name of your documentation website. Displayed in the site title and used in various UI elements.
- **description**: A concise summary of your project, used in site metadata (e.g., HTML meta description) and social previews when not overridden.
- **icon**: The favicon for your site. You can provide a full URL or a relative path to an asset in your project.
- **preview**: The Open Graph image used when links to your docs are shared. Accepts a full URL or a relative path.

## Per‑page overrides
Any page can override these global values by defining the same keys in its frontmatter. When present, the page's values take precedence over \`config.json\` for that page only.

<Callout type="note">
  If a key is not specified in a page's frontmatter, Doccupine falls back to the corresponding value in \`config.json\`.
</Callout>

Example frontmatter in an \`.mdx\` file:

\`\`\`text
---
title: "My Feature"
description: "A focused description just for this page."
name: "My Product Docs"
icon: "https://doccupine.com/favicon.ico"
preview: "https://doccupine.com/preview.png"
date: "2025-01-15"
category: "Guides"
---
\`\`\`

`;
