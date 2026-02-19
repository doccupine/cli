export const platformSectionsSettingsMdxTemplate = `---
title: "Sections Settings"
description: "Split your documentation into top-level areas with independent sidebars using the visual section manager."
date: "2026-02-19"
category: "Configuration"
categoryOrder: 2
order: 3
section: "Platform"
---
# Sections Settings
The Sections settings page lets you divide your documentation into separate top-level areas. Each section appears as a tab below the site header and has its own sidebar navigation.

## Adding a section
Click **Add Section** and fill in the fields:

- **Label** - the display name shown in the tab bar (e.g., "API Reference")
- **Slug** - the URL prefix for pages in this section (e.g., \`api\`). Use an empty string for the default/root section.
- **Directory** (optional) - the subdirectory containing this section's files. Only needed when the directory name differs from the slug.

## Reordering sections
Use the **up/down arrows** to change the order of sections in the tab bar. The first section in the list appears on the left.

## The default section
One section should have an empty slug (\`""\`). This is the default section that serves pages at the root URL. Pages not assigned to any other section belong here.

<Callout type="note">
  For a deeper explanation of how sections work, including frontmatter-based sections and URL routing, see the [Sections documentation](/sections).
</Callout>

## How it works
Section settings are stored in \`sections.json\` at the root of your repository:

\`\`\`json
[
  { "label": "Docs", "slug": "" },
  { "label": "API Reference", "slug": "api" },
  { "label": "SDKs", "slug": "sdks" }
]
\`\`\`

You can also define sections purely through page frontmatter without using this settings page. See the [Sections documentation](/sections) for details on both approaches.`;
