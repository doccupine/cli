import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_URL,
} from "../../lib/constants.js";

export const globalsMdxTemplate = `---
title: "Globals"
description: "Configure global settings for your documentation."
date: "2026-02-19"
updated: "2026-08-04"
category: "Configuration"
categoryOrder: 2
categoryIcon: "settings"
order: 1
---
# Global Configuration

Use a \`config.json\` file to define project‑wide metadata for your documentation site. These values are applied to every generated page unless a page overrides them in its own frontmatter.

## config.json

Place a \`config.json\` at your project root (the same directory where you execute \`npx doccupine\`) to define global metadata for your documentation site.

\`\`\`json
{
  "name": "Doccupine",
  "description": "${DEFAULT_DESCRIPTION}",
  "icon": "/icon.png",
  "image": "${DEFAULT_OG_IMAGE}",
  "url": "${DEFAULT_URL}"
}
\`\`\`

## Fields

All fields are optional. Doccupine uses sensible defaults when a field is not set.

- **name**: The primary name of your documentation website. Displayed in the site title and used in various UI elements.
- **description**: A concise summary of your project, used in site metadata (e.g., HTML meta description) and social previews when not overridden.
- **icon**: The favicon for your site. You can provide a full URL or a relative path to an asset in your project. Dropping an \`icon.png\` file at the project root (see [Icon files](#icon-files)) takes precedence over this field.
- **image**: The Open Graph image used when links to your docs are shared on social platforms. Accepts a full URL or a relative path.
- **url**: The public URL of your deployed site. Used as the base URL for \`sitemap.xml\` and \`robots.txt\`. When omitted, \`/sitemap.xml\` is served but empty and \`robots.txt\` omits its sitemap reference. Can be overridden at deploy time with the \`NEXT_PUBLIC_SITE_URL\` environment variable.

## Icon files

Instead of pointing \`icon\` at a URL, you can drop conventional icon files next to \`config.json\` at your project root:

| File              | Purpose                                                    |
| ----------------- | ---------------------------------------------------------- |
| \`icon.png\`        | Favicon shown in browser tabs                              |
| \`icon-dark.png\`   | Favicon variant for dark interfaces (requires \`icon.png\`)  |
| \`apple-icon.png\`  | Home-screen icon for iOS devices                           |

Doccupine copies the files into the generated site and wires them into every page's metadata. Each icon URL carries a content hash, so replacing an icon busts browser caches automatically. The light and dark favicons are selected by the operating system's color scheme, because browser tab chrome follows the OS theme rather than the site's theme toggle.

Precedence: a page's frontmatter \`icon\` wins for that page, then root icon files, then \`icon\` in \`config.json\`, then the Doccupine default.

The generated site also serves a web app manifest at \`/manifest.webmanifest\`, linked from every page automatically. It carries your site's \`name\` and \`description\` from \`config.json\`, the light palette's \`primary\` as \`theme_color\`, and the root icon files as its icon entries, so browsers that install or pin the site pick up your branding.

<Callout type="warning">
  A root icon file and a file with the same name in your \`public/\` directory would publish the same URL, so Doccupine reports a validation error instead of letting one silently overwrite the other.
</Callout>

<Callout type="note">
  Some legacy tools request \`/favicon.ico\` directly instead of reading the page's icon links. If you need that path covered, place a \`favicon.ico\` in your \`public/\` directory and it is copied through as-is.
</Callout>

## Per-page overrides

Any page can override global values by defining the matching key in its frontmatter. When present, the page's value takes precedence over \`config.json\` for that page only.

| Frontmatter field | Overrides     | Effect                                                              |
| ----------------- | ------------- | ------------------------------------------------------------------- |
| **title**         | -             | Page title in metadata and Open Graph                               |
| **description**   | \`description\` | Meta description and Open Graph description                         |
| **name**          | \`name\`        | Site name shown in the title suffix (e.g. "Page - My Docs")         |
| **icon**          | \`icon\`        | Favicon for this page                                               |
| **image**         | \`image\`       | Open Graph preview image                                            |
| **date**          | -             | Publication date, used for JSON-LD \`datePublished\`                  |
| **updated**       | -             | Last-modified date, used for JSON-LD \`dateModified\` and the sitemap |
| **section**       | -             | Assigns the page to a [section](/sections)                          |
| **sectionOrder**  | -             | Controls section position in the tab bar                            |
| **sectionLabel**  | -             | Renames the default "Docs" tab (use on \`index.mdx\`)                 |

<Callout type="note">
  If a key is not specified in a page's frontmatter, Doccupine falls back to the corresponding value in \`config.json\`.
</Callout>

Example frontmatter in an \`.mdx\` file:

\`\`\`text
---
title: "My Feature"
description: "A focused description just for this page."
name: "My Product Docs"
icon: "/custom-favicon.png"
image: "/custom-preview.png"
date: "2026-02-19"
updated: "2026-03-04"
category: "Guides"
---
\`\`\``;
