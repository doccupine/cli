export const platformSiteSettingsMdxTemplate = `---
title: "Site Settings"
description: "Configure your documentation site's name, description, icon, and image."
date: "2026-02-19"
category: "Configuration"
categoryOrder: 2
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

### Favicon
Upload a favicon image that appears in browser tabs. Supported formats include PNG, ICO, and SVG. Use the file upload button to select an image from your computer.

### Preview image
Upload an image used for social media and OpenGraph previews. This is the image that appears when your documentation URL is shared on platforms like Twitter, Slack, or Discord.

<Callout type="note">
  Changes to site settings are staged as pending changes, just like file edits. Click **Publish** to commit them to your repository and trigger a deploy.
</Callout>

## How it works
Behind the scenes, the Site settings page reads and writes \`config.json\` in your repository. You can also edit this file directly in the file editor if you prefer. See the [Globals](/globals) page for the full configuration reference.

\`\`\`json
{
  "name": "My Documentation",
  "description": "Documentation for my project",
  "icon": "/favicon.png",
  "image": "/preview.png"
}
\`\`\``;
