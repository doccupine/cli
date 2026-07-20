export const navigationMdxTemplate = `---
title: "Navigation"
description: "Organize and structure your navigation."
date: "2026-02-19"
category: "Configuration"
categoryOrder: 3
order: 2
---
# Navigation

Doccupine builds your sidebar automatically from your MDX pages. By default, it reads the page frontmatter and groups pages into categories in the order you define. For larger docs, you can take full control with a \`navigation.json\` file.

## Automatic navigation (default)

When no custom navigation is provided, Doccupine generates a structure based on each page's frontmatter.

### Frontmatter fields

- **category**: The category name that groups the page in the sidebar.
- **categoryOrder**: The position of the category within the sidebar. Lower numbers appear first.
- **order**: The position of the page within its category. Lower numbers appear first.
- **navIcon**: Optional [Lucide](https://lucide.dev/icons) icon name shown next to the page's sidebar link.
- **categoryIcon**: Optional Lucide icon name for the page's category header. The first page in a category that sets it wins.

### Example frontmatter

\`\`\`text
---
title: "Navigation"
description: "Organize and structure your navigation."
date: "2025-01-15"
category: "Configuration"
categoryOrder: 3
order: 2
---
\`\`\`

This approach is great for small sets of documents. For larger projects, setting these fields on every page can become repetitive.

## Custom navigation with navigation.json

To centrally define the entire sidebar, create a \`navigation.json\` at your project root (the same directory where you execute \`npx doccupine\`). When present, it takes priority over page frontmatter and fully controls the navigation structure.

### Array format

The simplest format is an array of categories. When using [sections](/sections), this applies to the root section only.

\`\`\`json
[
  {
    "label": "Getting Started",
    "links": [
      { "slug": "", "title": "Introduction" },
      { "slug": "commands", "title": "Commands" },
      { "slug": "what-is-doccupine", "title": "What is Doccupine" }
    ]
  },
  {
    "label": "Components",
    "links": [
      { "slug": "components", "title": "Components" },
      { "slug": "headers-and-text", "title": "Headers and Text" },
      { "slug": "lists-and-tables", "title": "Lists and tables" },
      { "slug": "code", "title": "Code" },
      { "slug": "accordion", "title": "Accordion" },
      { "slug": "tabs", "title": "Tabs" },
      { "slug": "cards", "title": "Cards" },
      { "slug": "buttons", "title": "Buttons" },
      { "slug": "callouts", "title": "Callouts" },
      { "slug": "image-and-embeds", "title": "Images and embeds" },
      { "slug": "icons", "title": "Icons" },
      { "slug": "fields", "title": "Fields" },
      { "slug": "update", "title": "Update" },
      { "slug": "columns", "title": "Columns" },
      { "slug": "steps", "title": "Steps" },
      { "slug": "color-swatches", "title": "Color Swatches" },
      { "slug": "mermaid", "title": "Mermaid" }
    ]
  },
  {
    "label": "Configuration",
    "links": [
      { "slug": "globals", "title": "Globals" },
      { "slug": "navigation", "title": "Navigation" },
      { "slug": "sections", "title": "Sections" },
      { "slug": "footer-links", "title": "Footer Links" },
      { "slug": "theme", "title": "Theme" },
      { "slug": "media-and-assets", "title": "Media and assets" },
      { "slug": "fonts", "title": "Fonts" },
      { "slug": "ai-assistant", "title": "AI Assistant" },
      { "slug": "model-context-protocol", "title": "Model Context Protocol" },
      { "slug": "analytics", "title": "Analytics" },
      { "slug": "deployment-and-hosting", "title": "Deployment & Hosting" },
      { "slug": "authentication", "title": "Authentication" }
    ]
  }
]
\`\`\`

### Object format (per-section)

When using [sections](/sections), you can define navigation for each section by using an object keyed by section slug. Sections without a key fall back to auto-generated navigation from frontmatter.

\`\`\`json
{
  "": [
    {
      "label": "General",
      "links": [
        { "slug": "", "title": "Getting Started" },
        { "slug": "commands", "title": "Commands" }
      ]
    }
  ],
  "platform": [
    {
      "label": "Overview",
      "links": [
        { "slug": "platform/auth", "title": "Authentication" },
        { "slug": "platform/users", "title": "Users" }
      ]
    }
  ]
}
\`\`\`

The key \`""\` controls the root section. Other keys match section slugs defined in \`sections.json\` or derived from frontmatter. See [Sections](/sections) for details on configuring sections.

### Fields

- **label**: The section header shown in the sidebar.
- **icon**: Optional [Lucide](https://lucide.dev/icons) icon name shown next to the category header.
- **links**: An array of page entries for that section.
  - **slug**: The MDX file slug (filename without extension). Use an empty string \`""\` for \`index.mdx\`.
  - **title**: The display title in the navigation. This can differ from the page's \`title\` frontmatter.
  - **icon**: Optional Lucide icon name shown next to the link.
  - **links**: Optional array of nested child links. See [Nested navigation](#nested-navigation).

## Icons

Add icons to categories and links to make the sidebar easier to scan. Icons use [Lucide](https://lucide.dev/icons) names in kebab-case (e.g. \`rocket\`, \`book-open\`, \`settings\`). Unknown names render nothing, so a typo never breaks the build.

With frontmatter, set \`navIcon\` on a page for its sidebar link and \`categoryIcon\` for its category:

\`\`\`text
---
title: "Introduction"
category: "Getting Started"
categoryOrder: 1
order: 1
navIcon: "rocket"
categoryIcon: "book-open"
---
\`\`\`

With \`navigation.json\`, add an \`icon\` to any category or link:

\`\`\`json
[
  {
    "label": "Getting Started",
    "icon": "book-open",
    "links": [
      { "slug": "", "title": "Introduction", "icon": "rocket" },
      { "slug": "commands", "title": "Commands", "icon": "terminal" }
    ]
  }
]
\`\`\`

## Nested navigation

A link in \`navigation.json\` can hold its own \`links\` array to create a collapsible group. Groups expand and collapse on click and open automatically when one of their pages is active. Nesting can go as deep as you need.

\`\`\`json
[
  {
    "label": "Guides",
    "icon": "book-open",
    "links": [
      { "slug": "guides", "title": "Overview", "icon": "compass" },
      {
        "title": "Advanced",
        "icon": "settings",
        "links": [
          { "slug": "guides/caching", "title": "Caching" },
          { "slug": "guides/streaming", "title": "Streaming" }
        ]
      }
    ]
  }
]
\`\`\`

A group can be a plain label - omit \`slug\` and it acts only as a collapsible header - or a real page, by adding a \`slug\` so the group title is also a link.

<Callout type="note">
  Nested groups are only available through \`navigation.json\`. Frontmatter navigation is always two levels: category and pages.
</Callout>

## Precedence and behavior

<Callout type="note">
  \`navigation.json\` takes priority over frontmatter. If present, it fully controls the sidebar structure for the sections it covers.
</Callout>

- Without \`navigation.json\`, the sidebar is built from page frontmatter: \`category\` -> grouped; \`categoryOrder\` -> category position; \`order\` -> page position.
- When using the object format, sections not listed in \`navigation.json\` fall back to frontmatter-based navigation.
- Pages without a \`category\` appear at the top level.

## Tips

- **Start simple**: Use frontmatter for small docs. Switch to \`navigation.json\` as the structure grows.
- **Keep slugs consistent**: \`slug\` must match the MDX filename (e.g., \`text.mdx\` -> \`text\`).
- **Control titles**: Use \`title\` in \`navigation.json\` to customize sidebar labels without changing page frontmatter.
- **Per-section navigation**: Use the object format to define different sidebars for each section. Mix and match - define some sections explicitly and let others auto-generate.`;
