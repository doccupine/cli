export const versionsMdxTemplate = `---
title: "Versions"
description: "Keep the documentation of earlier releases online next to the current one, with a version switcher and scoped search."
date: "2026-09-08"
category: "Configuration"
categoryOrder: 2
order: 5
---
# Versions

Publish the documentation of earlier releases alongside the current one by adding a \`versions.json\` file and one folder per older version. Each version gets its own URL prefix, its own sidebar, a switcher in the sidebar, and search and AI chat scoped to the version the reader is looking at.

<Callout type="note">
  Versions are entirely opt-in. Without a \`versions.json\` file nothing changes.
</Callout>

## Configuration

Create \`versions.json\` in your project root, next to \`doccupine.json\`:

\`\`\`json
[
  { "label": "v2.0", "default": true },
  { "slug": "v1", "label": "v1.0" }
]
\`\`\`

- **label**: the name shown in the version switcher.
- **default**: exactly one entry must be the default. It is the version at the docs root, published at unprefixed URLs, and it has no \`slug\`.
- **slug**: for every other version, a lowercase URL segment (\`v1\`, \`2024-10\`) that is both the folder name and the URL prefix.

The order of the entries is the order of the switcher.

## Folder layout

The default version is the docs root. Every other version is a folder named after its slug that holds a complete copy of the docs as they were:

\`\`\`text
docs/
  index.mdx              -> /            (v2.0, the default)
  guides/
    intro.mdx            -> /guides/intro
  v1/
    index.mdx            -> /v1
    guides/
      intro.mdx          -> /v1/guides/intro
\`\`\`

To freeze the current docs as a version, copy the docs root (without any language or version folders) into a new folder, add the entry to \`versions.json\`, and keep editing the root as the next release. A version folder without an \`index.mdx\` gets a generated home page that redirects to its first page.

## What the generated site does

- **Switcher**: the sidebar footer row, between the focus-mode and theme toggles, shows a version dropdown when at least two versions are configured, right after the language dropdown when both exist: the same 30px pill and menu, listing every version. Switching goes to the same page in the chosen version when it exists, otherwise to that version's home.
- **Sidebar and sections**: the sidebar lists only the pages of the current version. [Sections](/sections) work inside every version.
- **Search and AI chat**: results and answers come from the current version only. The MCP server's \`search_docs\` and \`list_docs\` tools accept a \`version\` parameter and default to the default version.
- **Agents**: each version has its own \`llms.txt\` and \`llms-full.txt\` under its prefix (\`/v1/llms.txt\`), and the root files link to them.

## Navigation

Frontmatter navigation is built per version automatically. To define a version's sidebar by hand, key \`navigation.json\` by URL prefix: \`"v1"\` for the root of v1, \`"v1/api"\` for its API section. See [Navigation](/navigation).

## Versions and languages

Versions and [languages](/languages) combine. The language folder comes first, then the version folder:

\`\`\`text
docs/
  guides/intro.mdx         -> /guides/intro         (default language, default version)
  v1/guides/intro.mdx      -> /v1/guides/intro      (default language, v1)
  de/guides/intro.mdx      -> /de/guides/intro      (German, default version)
  de/v1/guides/intro.mdx   -> /de/v1/guides/intro   (German, v1)
\`\`\`

## Rules

- A version slug must not be the slug of a [section](/sections), the first folder of a section's \`directory\`, a language code, or one of the reserved segments \`api\`, \`gate\`, \`mcp\`, and \`ingest\`. The build stops with a message naming the file when it is.
- The API reference generated from an OpenAPI spec is published in the default version only. Hand-written pages inside a version folder work like any other page.
`;
