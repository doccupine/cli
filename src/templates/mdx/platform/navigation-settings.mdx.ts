export const platformNavigationSettingsMdxTemplate = `---
title: "Navigation Settings"
description: "Define the sidebar structure for your documentation site using the drag-and-drop Navigation Builder."
date: "2026-07-06"
category: "Configuration"
categoryOrder: 2
order: 2
section: "Platform"
---
# Navigation Settings

The Navigation Builder lets you define your sidebar structure through a visual, drag-and-drop interface. It lives inside the **File Explorer** as a dedicated **Navigation** tab, alongside the Files and Media tabs.

## Structure

Navigation is organized into these levels:

- **Section** - a top-level area of your site (e.g., "Docs", "API Reference"). Each section appears as a tab below the site header and has its own sidebar. Sections are defined by a label, URL slug, and docs directory.
- **Category** - a group label within a section's sidebar (e.g., "Getting Started"). Categories can have an optional icon.
- **Link** - an individual page entry within a category, defined by a slug and title, with an optional icon.
- **Group** - a link that holds its own nested links, rendered as a collapsible item in the sidebar. Groups can nest as deep as you need. See [Nested groups](#nested-groups).

## Drag-and-drop reordering

You can reorder items at every level by dragging their handles:

- **Drag categories** between sections or within the same section to change their position
- **Drag links** between categories or within the same category to reorder them

## Managing sections

- Click **Add Section** in the toolbar to create a new section. Fill in the label, slug, and directory fields.
- Click the **edit** button on a section header to open its edit modal, where you can update the label, slug, and directory.
- Delete a section from its edit modal using the delete button. The root section cannot be deleted.

### The default section

One section should have an empty slug (\`""\`). This is the default/root section that serves pages at the root URL. Pages not assigned to any other section belong here.

### Frontmatter-based sections

You can also define sections purely through page frontmatter without using the Navigation Builder. Add a \`section\` field to your MDX frontmatter and Doccupine will create sections automatically. See the [Sections documentation](/sections) for details.

## Managing categories

- Click **Add Category** within a section to create a new group
- Click the **edit** button on a category to open its **Edit Category** modal, where you can rename it, pick an icon, or delete it

## Adding links

Within each category, click **Add files** to open a popover that lists available MDX files not yet included in the navigation. You can:

- **Search** by file name to filter the list
- **Select** one or more files using checkboxes
- Click **Add** to insert them as links in the category

### Editing a link

- **Double-click** a link's title to rename it inline.
- Click the **edit** button on a link to open the **Edit Link** modal, where you can change its title, slug, and icon. Leaving the slug empty makes a leaf link point at the index page; for a group it makes the group a non-clickable label.
- Click the **delete** button next to a link to remove it.

## Icons

You can show a [Lucide](https://lucide.dev/icons) icon next to any category or link to make the sidebar easier to scan.

- Set a **category icon** from the Edit Category modal.
- Set a **link icon** from the Edit Link modal.

Both use a searchable icon picker, and icon names are stored in kebab-case (e.g. \`rocket\`, \`book-open\`, \`settings\`). You can also set icons from page frontmatter using the \`navIcon\` (link) and \`categoryIcon\` (category) fields, which the **Regenerate** button picks up.

## Nested groups

A link can hold its own child links, rendering as a collapsible group in the sidebar. Nesting can go as deep as you need.

There are two ways to create a group:

- Click **Add group** (in a category or inside another group) to create a collapsible group. Give it a title in the Edit Link modal, then leave its slug empty to make it a plain, non-clickable label, or set a slug to make the group header link to its own page.
- Click **Add pages inside** on an existing link to nest pages under it. The link keeps its own slug and becomes the group header.

Inside a group, use **Add files** to add pages and **Add group** to nest another group. Toggle the chevron on a group to collapse or expand it in the builder.

## Regenerate from files

The toolbar includes a **Regenerate** button that rebuilds the entire navigation tree from your MDX files' frontmatter (\`category\`, \`categoryOrder\`, \`order\`, \`navIcon\`, and \`categoryIcon\` fields). A confirmation modal appears before any existing manual navigation is replaced.

<Callout type="warning">
  Regenerating from files replaces your current navigation structure. This cannot be undone.
</Callout>

## Auto-generated vs. manual

If you don't configure navigation at all, Doccupine automatically builds your sidebar from page frontmatter. The Navigation Builder is only needed when you want explicit control over the order and grouping.

## How it works

When you save, the Navigation Builder writes two files to your repository as pending changes:

- \`navigation.json\` - the category and link structure for each section
- \`sections.json\` - the list of sections with their labels, slugs, and directories

Icons are written as an \`icon\` field on a category or link, and nested groups as a \`links\` array on a link.

**Array format** for single-section sites (\`navigation.json\`):

\`\`\`json
[
  {
    "label": "Getting Started",
    "icon": "rocket",
    "links": [
      {
        "slug": "getting-started",
        "title": "Quick Start",
        "icon": "book-open"
      },
      {
        "title": "Guides",
        "icon": "compass",
        "links": [{ "slug": "guides/deploy", "title": "Deploying" }]
      }
    ]
  }
]
\`\`\`

**Object format** for multi-section sites (\`navigation.json\`):

\`\`\`json
{
  "": [
    { "label": "General", "links": [{ "slug": "", "title": "Introduction" }] }
  ],
  "api": [
    {
      "label": "Auth",
      "links": [{ "slug": "api/auth", "title": "Authentication" }]
    }
  ]
}
\`\`\`

**Sections** (\`sections.json\`):

\`\`\`json
[
  { "label": "Docs", "slug": "" },
  { "label": "API Reference", "slug": "api" }
]
\`\`\``;
