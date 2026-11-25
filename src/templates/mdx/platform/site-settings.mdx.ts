export const platformSiteSettingsMdxTemplate = `---
title: "Site Settings"
description: "Configure your documentation site's name, description, template, icon, and image."
date: "2026-02-19"
category: "Configuration"
categoryOrder: 2
categoryIcon: "settings"
order: 0
section: "Platform"
---
# Site Settings

The Site settings page lets you configure the core metadata for your documentation site. These values are stored in \`config.json\` at the root of your repository.

## Fields

### Name

The name of your documentation site. This appears in the site header and browser tab title.

### Description

A short description of your documentation. Used in meta tags for search engine optimization and social media previews.

### Template

The design of your site: \`Modern\` (the default) or \`Classic\`, the original design. The template changes the header, sidebar, page layout, and the look of the built-in components; your content, navigation, colors, and fonts stay the same. Picking Modern leaves the \`template\` field out of \`config.json\`, unless the file already sets it. See [Templates](/templates) for what each one looks like.

### Favicon

Upload a favicon image that appears in browser tabs. Supported formats include PNG, ICO, and SVG. Use the file upload button to select an image from your computer.

### Preview image

Upload an image used for social media and OpenGraph previews. This is the image that appears when your documentation URL is shared on platforms like Twitter, Slack, or Discord.

### Site URL

The public URL of your deployed documentation site, such as \`https://docs.example.com\`. This value is used as the base URL when generating \`sitemap.xml\` and \`robots.txt\`, so search engines can discover and index your pages correctly. You can override this at deploy time by setting the \`NEXT_PUBLIC_SITE_URL\` environment variable.

<Callout type="note">
  Changes to site settings are staged as pending changes, just like file edits. Click **Publish** to commit them to your repository and trigger a deploy.
</Callout>

## How it works

Behind the scenes, the Site settings page reads and writes \`config.json\` in your repository. You can also edit this file directly in the file editor if you prefer: keys the Site settings page does not manage are kept when you save there. See the [Globals](/globals) page for the full configuration reference.

\`\`\`json
{
  "name": "My Documentation",
  "description": "Documentation for my project",
  "icon": "/favicon.png",
  "image": "/preview.png",
  "url": "https://docs.example.com",
  "template": "classic"
}
\`\`\``;
