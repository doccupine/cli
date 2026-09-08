export const languagesMdxTemplate = `---
title: "Languages"
description: "Publish your documentation in several languages from one project, with a language switcher, hreflang tags, and scoped search."
date: "2026-09-08"
category: "Configuration"
categoryOrder: 2
order: 4
---
# Languages

Translate your documentation by adding a \`languages.json\` file and one folder per language. Each language gets its own URL prefix, its own sidebar, a switcher in the sidebar, \`hreflang\` tags for search engines, and search and AI chat that stay inside the language the reader is looking at.

<Callout type="note">
  Languages are entirely opt-in. Without a \`languages.json\` file nothing changes: your docs live at the root of the docs folder and publish exactly as before.
</Callout>

## Configuration

Create \`languages.json\` in your project root, next to \`doccupine.json\`:

\`\`\`json
[
  { "code": "en", "label": "English", "default": true },
  { "code": "de", "label": "Deutsch" }
]
\`\`\`

- **code**: a lowercase URL segment (letters, digits, and hyphens, such as \`en\`, \`de\`, or \`pt-br\`). It is the folder name, the URL prefix, and the value of the page's \`lang\` and \`hreflang\` attributes.
- **label**: the name shown in the language switcher.
- **default**: exactly one entry must be the default. Its pages live at the docs root and keep unprefixed URLs.
- **strings** (optional): overrides for the site's own interface text in that language. See [Interface strings](#interface-strings).

The order of the entries is the order of the switcher.

## Folder layout

The default language lives at the root of the docs folder. Every other language lives in a folder named after its code, mirroring the default layout:

\`\`\`text
docs/
  index.mdx              -> /
  guides/
    intro.mdx            -> /guides/intro
  de/
    index.mdx            -> /de
    guides/
      intro.mdx          -> /de/guides/intro
\`\`\`

A page is the translation of another when it sits at the same path inside its language folder. Only translated pages exist in a language: a page you have not translated yet returns a 404 under that language's prefix, and the switcher takes readers to that language's home page instead.

A language folder without an \`index.mdx\` gets a generated home page that redirects to its first page.

## What the generated site does

- **Switcher**: the sidebar footer row, between the focus-mode and theme toggles, shows a language dropdown when at least two languages are configured: a 30px pill carrying the current language that opens a menu of every language above it (the same dropdown the Doccupine platform uses), with the arrow keys, Escape, and a click outside to close it. When a version switcher shares the row, the two pills grow from their labels' widths to fill the sidebar's free width, and on the narrow desktop rail each shows its short form: the language's code and the version's own label. Switching goes to the same page in the chosen language when it exists, otherwise to that language's home.
- **Sidebar and sections**: the sidebar lists only the pages of the current language. [Sections](/sections) work inside every language; a section tab is hidden in a language that has no pages in it.
- **Search and AI chat**: results and answers come from the current language only. The MCP server's \`search_docs\` and \`list_docs\` tools accept a \`language\` parameter and default to the default language.
- **SEO**: every translated page carries \`alternates.languages\` (\`hreflang\`) links to its other languages, an \`x-default\` pointing at the default language, and an Open Graph locale. The sitemap lists the same alternates. The \`<main>\` element carries the page's \`lang\` attribute; the \`<html lang>\` attribute is the default language server-side and is corrected from the URL before the first paint.
- **Agents**: each language has its own \`llms.txt\` and \`llms-full.txt\` under its prefix (\`/de/llms.txt\`), and the root files link to them.

## Navigation

Frontmatter navigation is built per language automatically. To define a language's sidebar by hand, key \`navigation.json\` by URL prefix: \`"de"\` for the German root, \`"de/api"\` for the German API section. See [Navigation](/navigation).

## Interface strings

The generated site's own labels (the search box, "On this page", the previous and next links, the action bar, the footer) are English by default. Override any of them per language with a \`strings\` object:

\`\`\`json
[
  { "code": "en", "label": "English", "default": true },
  {
    "code": "de",
    "label": "Deutsch",
    "strings": {
      "searchPlaceholder": "Dokumentation durchsuchen...",
      "onThisPage": "Auf dieser Seite",
      "previous": "Zurück",
      "next": "Weiter"
    }
  }
]
\`\`\`

Keys you leave out keep their default. The known keys are \`searchButton\`, \`searchDialog\`, \`searchPlaceholder\`, \`searchResults\`, \`searching\`, \`noResults\`, \`resultsAvailable\` (with a \`{count}\` placeholder), \`resultAvailable\`, \`askAi\`, \`askAiAssistant\`, \`closeSearch\`, \`onThisPage\`, \`previous\`, \`next\`, \`openNavigation\`, \`closeNavigation\`, \`expandGroup\` and \`collapseGroup\` (both with a \`{title}\` placeholder), \`enterFocusMode\`, \`exitFocusMode\`, \`focusMode\`, \`copyContent\`, \`copied\`, \`copyCode\`, \`codeVariants\`, \`rss\`, \`rssFeed\`, \`viewAsMarkdown\`, \`toggleView\`, \`poweredBy\`, \`githubLink\`, \`aiAssistant\`, \`resetChat\`, \`chatGreeting\`, \`chatPlaceholder\`, \`chatInputLabel\`, \`chatAnswering\`, \`chatError\`, \`language\`, and \`version\`. An unknown key is reported when the site is generated and ignored.

## Rules

- A language code must not be the slug of a [section](/sections), the first folder of a section's \`directory\`, a [version](/versions) slug, or one of the reserved segments \`api\`, \`gate\`, \`mcp\`, and \`ingest\`. The build stops with a message naming the file when it is.
- The default language has no folder: a \`docs/en/\` folder on a site whose default is \`en\` stops the build.
- When [versions](/versions) are configured too, the language folder comes first: \`docs/de/v1/\`.
- The API reference generated from an OpenAPI spec is published in the default language only.
`;
