export const platformNavigationSettingsMdxTemplate = `---
title: "Navigation Settings"
description: "Define the sidebar structure for your documentation site with categories and links."
date: "2026-02-19"
category: "Configuration"
categoryOrder: 2
order: 2
section: "Platform"
---
# Navigation Settings
The Navigation settings page lets you define your sidebar structure through a visual interface. Organize your pages into categories and control the order they appear.

## Structure
Navigation is organized into **categories**, each containing one or more **links**:

- **Category** - a group label in the sidebar (e.g., "Getting Started", "API Reference")
- **Link** - an entry within a category, defined by a page slug and display title

## Managing categories
- Click **Add Category** to create a new group
- Use the **up/down arrows** to reorder categories
- Click the **remove** button to delete a category and its links

## Managing links
Within each category:
- Click **Add Link** to add a new page entry
- Set the **slug** to the page's URL path (e.g., \`getting-started\`)
- Set the **title** to the display text shown in the sidebar
- Click the **remove** button to delete a link

## Per-section navigation
If your site uses [sections](/sections), the Navigation settings page shows a tab bar for each section. You can configure independent sidebar structures for each section.

<Callout type="note">
  Sections without a custom navigation configuration fall back to auto-generated navigation based on page frontmatter (\`category\`, \`categoryOrder\`, and \`order\` fields).
</Callout>

## Auto-generated vs. manual
If you don't configure navigation at all, Doccupine automatically builds your sidebar from page frontmatter. The Navigation settings page is only needed when you want explicit control over the order and grouping.

## How it works
Navigation settings are stored in \`navigation.json\` at the root of your repository. The file supports two formats:

**Array format** for single-section sites:
\`\`\`json
[
  {
    "label": "Getting Started",
    "links": [
      { "slug": "getting-started", "title": "Quick Start" }
    ]
  }
]
\`\`\`

**Object format** for multi-section sites:
\`\`\`json
{
  "": [
    { "label": "General", "links": [{ "slug": "", "title": "Introduction" }] }
  ],
  "api": [
    { "label": "Auth", "links": [{ "slug": "api/auth", "title": "Authentication" }] }
  ]
}
\`\`\``;
