export const sectionsMdxTemplate = `---
title: "Sections"
description: "Split your documentation into top-level sections with independent sidebars."
date: "2025-01-15"
category: "Configuration"
categoryOrder: 3
order: 3
---
# Sections
Sections let you divide your documentation into separate top-level areas - for example "Guides", "API Reference", and "SDKs". Each section gets its own sidebar and appears as a horizontal tab bar below the site header.

<Callout type="note">
  Sections are entirely opt-in. If you don't configure them, nothing changes - your site works exactly as before with a single flat navigation.
</Callout>

## Automatic sections (frontmatter)
The simplest way to add sections is through page frontmatter. Add a \`section\` field to group pages, and an optional \`sectionOrder\` to control the order of sections in the bar.

### Frontmatter fields
- **section**: The display name for the section this page belongs to (e.g. "API Reference").
- **sectionOrder**: Controls the position of the section in the bar. Lower numbers appear first.

The section slug is derived automatically from the label - lowercased with spaces replaced by hyphens. So "API Reference" becomes \`api-reference\`.

Pages without a \`section\` field stay at the root URL and appear under a default tab labeled "Docs". You can rename this tab with the \`sectionLabel\` field on your \`index.mdx\`:

\`\`\`text
---
title: "Welcome"
sectionLabel: "Guides"
---
\`\`\`

### Directory-based organization
You can organize each section's files in a subdirectory that matches the section slug. When the directory name matches, Doccupine automatically assigns the files to that section and strips the directory from the URL.

\`\`\`text
docs/
  index.mdx
  getting-started.mdx
  platform/
    index.mdx        -> /platform
    auth.mdx         -> /platform/auth
\`\`\`

Where \`platform/index.mdx\` has:

\`\`\`text
---
title: "Platform"
section: "Platform"
sectionOrder: 1
category: "Overview"
---
\`\`\`

The directory \`platform/\` matches the section slug \`platform\`, so it is stripped. \`platform/index.mdx\` serves at \`/platform/\` and \`platform/auth.mdx\` serves at \`/platform/auth\`.

<Callout type="info">
  Once a section exists, any file placed in a matching directory is automatically assigned to it - even without a \`section\` field in its own frontmatter. Only the first file needs \`section\` and \`sectionOrder\` to create the section. After that, the directory does the work.
</Callout>

Files at the root level with a \`section\` field work too - they keep their full slug under the section prefix.

### Section index pages
If a section has no index page (no file at its root URL), Doccupine generates a redirect to the first page in that section, sorted by \`categoryOrder\` then \`order\`.

<Callout type="note">
  You can override the auto-redirect by creating an \`index.mdx\` in the section's directory.
</Callout>

### Flat file example
You can also keep all files at the root and rely purely on frontmatter:

\`\`\`text
---
title: "Authentication"
section: "API Reference"
sectionOrder: 2
category: "Auth"
categoryOrder: 1
order: 1
---
\`\`\`

This page would be served at \`/api-reference/authentication\`.

## Explicit sections with sections.json
For full control over slugs, create a \`sections.json\` file at your project root (the same folder where you run \`npx doccupine\`).

### Minimal example

\`\`\`json
[
  { "label": "Docs", "slug": "" },
  { "label": "Platform", "slug": "platform" }
]
\`\`\`

This defines two sections. Pages are assigned automatically:
- Files in a \`platform/\` directory belong to the "Platform" section (directory name matches slug).
- Files with \`section: "Platform"\` in their frontmatter also belong to it.
- Everything else stays in the root "Docs" section.

No \`directory\` field is needed when the directory name already matches the section slug.

### Example with explicit directories
When the directory name differs from the slug, use the \`directory\` field to map them:

\`\`\`json
[
  { "label": "Guides", "slug": "", "directory": "guides" },
  { "label": "API Reference", "slug": "api", "directory": "api-reference" },
  { "label": "SDKs", "slug": "sdks", "directory": "sdks" }
]
\`\`\`

### Fields
- **label**: The display name shown in the section bar.
- **slug**: The URL prefix for this section. Use an empty string \`""\` for the default section that serves at the root.
- **directory** (optional): The subdirectory under your watch directory that contains this section's MDX files. Only needed when the directory name differs from the slug.

### Directory structure example
With the explicit directory config above and a watch directory of \`docs\`, your files would look like:

\`\`\`text
docs/
  guides/
    index.mdx
    getting-started.mdx
  api-reference/
    authentication.mdx
    endpoints.mdx
  sdks/
    javascript.mdx
    python.mdx
\`\`\`

## Section navigation
Each section builds its own sidebar from the pages that belong to it. By default, pages are grouped by \`category\` and sorted by \`categoryOrder\` and \`order\` from frontmatter.

For explicit control, use \`navigation.json\` with the object format to define per-section navigation:

\`\`\`json
{
  "": [
    { "label": "General", "links": [{ "slug": "", "title": "Getting Started" }] }
  ],
  "platform": [
    { "label": "API", "links": [{ "slug": "platform/auth", "title": "Auth" }] }
  ]
}
\`\`\`

Keys are section slugs. The root section uses \`""\`. Sections without a key fall back to auto-generated navigation. See the Navigation page for the full format.

## How pages are assigned to sections
Doccupine checks these rules in order and uses the first match:

1. **Explicit directory** - the file is inside a directory listed in a section's \`directory\` field.
2. **Directory matches slug** - the file's parent directory matches a section slug (e.g. files in \`platform/\` match a section with \`slug: "platform"\`).
3. **Frontmatter section field** - the file's \`section\` value matches a section label.
4. **No match** - the page stays at the root.

## Precedence for section discovery
1. **sections.json exists** - Doccupine uses it to define available sections.
2. **No sections.json but pages have \`section\` frontmatter** - Doccupine auto-discovers sections from the frontmatter. Sections update live as you add or remove the \`section\` field from files.
3. **Neither** - No section bar appears. The site works exactly as before.

## URL structure
Pages in the default section (with \`slug: ""\`) serve at the root:

- Default section: \`/getting-started\`, \`/installation\`
- Other sections: \`/api/authentication\`, \`/sdks/javascript\`

<Callout type="info">
  When a file is in a directory that matches its section slug, the directory is stripped so it doesn't appear twice. For example, \`platform/auth.mdx\` in the "Platform" section serves at \`/platform/auth\`, not \`/platform/platform/auth\`.
</Callout>

## sections.json vs navigation.json
These two config files serve different purposes and complement each other:

- **sections.json** defines which sections exist - their labels, slugs, directory mappings, and order in the tab bar.
- **navigation.json** controls the sidebar within each section - page ordering and grouping.

You can use either one independently. \`sections.json\` without \`navigation.json\` gives you sections with auto-generated sidebars. \`navigation.json\` without \`sections.json\` gives you custom sidebar ordering with frontmatter-discovered sections (or no sections at all).

## Tips
- **Start simple**: Add \`section\` and \`sectionOrder\` to a few pages to try it out. No config files needed.
- **Use directories**: Organize each section's files in a directory that matches the section slug for clean URLs and a tidy file tree.
- **Rename the default tab**: Add \`sectionLabel: "Your Label"\` to your \`index.mdx\` frontmatter. Defaults to "Docs" if omitted.
- **Switch to sections.json**: When you need custom slugs or directory mappings that don't match section names, \`sections.json\` gives full control.
- **Per-section navigation**: Use the object format in \`navigation.json\` to define custom sidebar ordering for specific sections.
- **Independent sidebars**: Each section has its own sidebar. Previous/next navigation stays within the active section.`;
