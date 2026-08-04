export const mediaAndAssetsMdxTemplate = `---
title: "Media and assets"
description: "Serve static files like images, favicons, fonts, and Open Graph previews from the public directory."
date: "2026-02-19"
updated: "2026-08-04"
category: "Configuration"
categoryOrder: 2
order: 7
---
# Media and assets

Doccupine watches a \`public\` directory in your project root (the same directory where you execute \`npx doccupine\`) and copies its contents into the generated Next.js \`public\` directory. Use it to serve static files such as favicons, Open Graph preview images, custom fonts, or any other media your documentation needs.

## The public directory

Create a \`public\` directory at your project root. Any file you place inside is automatically synced to the generated site and served from the root URL path.

\`\`\`text
my-docs/
├── public/
│   ├── og-image.png
│   ├── logo.svg
│   └── fonts/
│       └── custom-font.woff2
├── docs/
│   └── index.mdx
├── config.json
└── theme.json
\`\`\`

## How assets are served

Files in the \`public\` directory are available at the root of your deployed domain. The path inside \`public\` maps directly to the URL path.

| File                             | URL                                               |
| -------------------------------- | ------------------------------------------------- |
| \`public/og-image.png\`            | \`https://your-domain.com/og-image.png\`            |
| \`public/logo.svg\`                | \`https://your-domain.com/logo.svg\`                |
| \`public/fonts/custom-font.woff2\` | \`https://your-domain.com/fonts/custom-font.woff2\` |

## Common use cases

### Favicon

Prefer the icon file convention: drop an \`icon.png\` (and optionally \`icon-dark.png\` and \`apple-icon.png\`) at your project root, next to \`config.json\`, and Doccupine wires it into every page's metadata with cache-busting URLs. See [Icon files](/globals#icon-files).

If a legacy tool needs the bare \`/favicon.ico\` path, drop a \`favicon.ico\` into the \`public\` directory and it is served from the root path as-is.

### Open Graph preview image

Add an image for link previews on social media. Reference it in your \`config.json\` so Doccupine sets the correct meta tags.

\`\`\`text
public/og-image.png → https://your-domain.com/og-image.png
\`\`\`

### Custom fonts

Place font files in \`public\` and reference them from your \`fonts.json\`. See the **Fonts** page for full configuration details.

\`\`\`text
public/fonts/custom-font.woff2 → https://your-domain.com/fonts/custom-font.woff2
\`\`\`

### Images and other media

Any image or file you want to reference in your MDX pages can live in \`public\`. Use a root-relative path in your content:

\`\`\`mdx
![Architecture diagram](/architecture.png)
\`\`\`

## Live syncing

<Callout type="info">
  Doccupine watches the \`public\` directory for changes while running. When you add, update, or remove a file, the generated site is updated automatically.
</Callout>

<Callout type="warning">
  The \`public\` directory and everything beneath it must use real files and directories. Doccupine rejects symlinks instead of following or copying them, including links whose targets are inside the project.
</Callout>

## Tips

- **Keep it flat**: For a small number of files, placing them directly in \`public\` keeps paths short and simple.
- **Use subdirectories for organization**: For larger projects, group assets into directories like \`public/fonts\`, \`public/images\`, or \`public/icons\`.
- **Mind file size**: Optimize images before adding them to keep deployment size and load times low.
- **Consistent naming**: Use lowercase, hyphen-separated filenames (e.g., \`og-image.png\`) for predictable URLs.`;
