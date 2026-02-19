export const navigationMdxTemplate = `---
title: "Navigation"
description: "Organize and structure your navigation."
date: "2025-01-15"
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
To centrally define the entire sidebar, create a \`navigation.json\` at your project root (the same folder where you execute \`npx doccupine\`). When present, it takes priority over page frontmatter and fully controls the navigation structure.

### Array format
The simplest format is an array of categories. When using [sections](/sections), this applies to the root section only.

\`\`\`json
[
  {
    "label": "General",
    "links": [
      { "slug": "", "title": "Getting Started" },
      { "slug": "commands", "title": "Commands" }
    ]
  },
  {
    "label": "Components",
    "links": [
      { "slug": "headers-and-text", "title": "Headers and Text" },
      { "slug": "lists-and-tables", "title": "Lists and tables" },
      { "slug": "code", "title": "Code" },
      { "slug": "accordion", "title": "Accordion" },
      { "slug": "tabs", "title": "Tabs" },
      { "slug": "cards", "title": "Cards" },
      { "slug": "buttons", "title": "Buttons" },
      { "slug": "callouts", "title": "Callouts" },
      { "slug": "images-and-embeds", "title": "Images and embeds" },
      { "slug": "icons", "title": "Icons" },
      { "slug": "fields", "title": "Fields" },
      { "slug": "update", "title": "Update" },
      { "slug": "columns", "title": "Columns" },
      { "slug": "steps", "title": "Steps" }
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
      { "slug": "deployment", "title": "Deployment" }
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
- **links**: An array of page entries for that section.
  - **slug**: The MDX file slug (filename without extension). Use an empty string \`""\` for \`index.mdx\`.
  - **title**: The display title in the navigation. This can differ from the page's \`title\` frontmatter.

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
