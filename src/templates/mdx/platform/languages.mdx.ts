export const platformLanguagesMdxTemplate = `---
title: "Languages"
description: "Add translations to your documentation from the dashboard: declare languages, copy pages into a language, and translate them with AI."
date: "2026-09-08"
category: "Configuration"
categoryOrder: 2
order: 6
section: "Platform"
---
# Languages

The **Languages** page under a project's settings manages the project's \`languages.json\` and the language folders in its repository. It is the dashboard counterpart of the CLI's [Languages](/languages) feature, and it stages everything as pending changes for you to review and [publish](/platform/publishing).

## Enabling languages

Turn on **Enable languages** and name the default language (its code, such as \`en\`, and its label). Saving writes a \`languages.json\` with that single entry. Nothing moves: the default language's pages stay at the root of the docs folder.

## Adding a language

Click **Add language**, enter the language code and label, and choose how to start:

- **Empty**: only a starter \`index.mdx\` is created in the new language folder.
- **Start from a copy of the default language**: every page of the default language is copied into the language folder as a starting point for translation.

Both options stage the new files and the updated \`languages.json\`; they reach the live site when you publish.

## Translating pages

With at least two languages configured, the file editor's action bar offers **Translate to** on every page of the default language. It translates the page with the project's AI configuration, keeps code blocks, components, links, and frontmatter keys intact, and stages the result in the target language folder. When a translation already exists you are asked before it is replaced.

The Languages page also offers **Translate missing pages** for each language, which translates the default-language pages that have no counterpart yet, up to 25 pages per run, with progress and a cancel button. Translation is billed like every other AI feature of the project.

## Editing translations

The file explorer shows a language selector when languages are configured, so you work inside one language at a time. Translated pages are ordinary MDX files: the [file editor](/platform/file-editor), preview, and version history work the same way.

## Site text

Each language card has a **Site text** button that opens the site's own labels for that language: the search box and its messages, the navigation and page actions, the AI assistant's greeting and prompts, the footer, and the language and version switchers. Every label shows its English default; type a translation to override it and clear the field to fall back. The dialog groups the labels by area, and a label that carries a placeholder such as \`{count}\` reminds you to keep it. The button shows how many labels the language overrides.

Applying the dialog updates the language's \`strings\` object in \`languages.json\`; save the page to stage it. See the CLI's [Languages](/languages#interface-strings) page for the full list of keys.

## Removing a language

Removing a language from the list asks whether its pages should be deleted too. The removal, the deleted pages, and the updated \`languages.json\` are staged together and appear in the Publish dialog.

## Rules

A language code must be a lowercase URL segment and must not collide with a section slug, a version slug, or a reserved route segment. The page refuses a collision when you save, and the Publish dialog refuses a change set that would stop the site build.
`;
