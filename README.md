# Doccupine

[![npm version](https://img.shields.io/npm/v/doccupine.svg)](https://www.npmjs.com/package/doccupine)

[Doccupine](https://doccupine.com) is an open-source CLI that turns a directory of MDX files into a full-featured Next.js documentation website. Write your docs in Markdown, and Doccupine watches for changes, generates pages, and starts a live dev server automatically.

## Features

- **Live preview** - watches your MDX files and regenerates pages on every save
- **Auto-generated navigation** - sidebar built from frontmatter (`category`, `order`)
- **Sections** - organize docs into tabbed sections via frontmatter or `sections.json`
- **Theming** - dark/light mode with customizable theme via `theme.json`
- **AI chat assistant** - built-in RAG-powered chat (OpenAI, Anthropic, or Google)
- **MCP server** - exposes `search_docs`, `get_doc`, and `list_docs` tools for AI agents
- **Custom fonts** - Google Fonts or local fonts via `fonts.json`
- **Static assets** - `public/` directory is watched and synced to the generated app
- **Zero config to start** - `npx doccupine` scaffolds everything and starts the server

## Quick Start

Make sure you have [Node.js](https://nodejs.org) (v22+) installed.

```bash
npx doccupine
```

Doccupine will prompt you for:

1. A directory to store your MDX files (default: `docs`)
2. An output directory for the generated Next.js app (default: `nextjs-app`)

It then scaffolds the app, installs dependencies, and starts the dev server. Open http://localhost:3000 to view your docs.

## CLI Commands

```bash
doccupine watch [options]   # Default. Watch MDX files and start dev server
doccupine build [options]   # One-time build without starting the server
doccupine config -show      # Show current configuration
doccupine config -reset     # Re-prompt for configuration
```

### Options

| Flag            | Description                                                          |
| --------------- | -------------------------------------------------------------------- |
| `--port <port>` | Port for the dev server (default: `3000`). Auto-increments if taken. |
| `--verbose`     | Show all Next.js output including compilation details                |
| `--reset`       | Re-prompt for watch/output directories                               |

## MDX Frontmatter

Each MDX file supports these frontmatter fields:

```yaml
---
title: "Page Title"
description: "Page description for SEO"
category: "Getting Started"
categoryOrder: 0 # Sort order for the category group
order: 1 # Sort order within the category
icon: "https://..." # Page favicon URL
image: "https://..." # OpenGraph image URL
date: "2025-01-01" # Page date metadata
section: "API Reference" # Section this page belongs to
sectionOrder: 1 # Sort order for the section in the tab bar
---
```

Navigation is auto-generated from `category`, `categoryOrder`, and `order`. Pages without a category appear ungrouped.

Use `sectionLabel` on your root `index.mdx` to rename the default "Docs" tab:

```yaml
---
title: "Welcome"
sectionLabel: "Guides"
---
```

## Sections

Sections let you split your docs into separate tabbed groups (e.g. "Docs", "API Reference", "SDKs"). There are two ways to configure them:

### Via frontmatter

Add a `section` field to your MDX files. The section slug is derived from the label automatically. Use `sectionOrder` to control tab order (lower numbers appear first):

```yaml
---
title: "Authentication"
section: "API Reference"
sectionOrder: 1
---
```

Pages without a `section` field stay at the root URL under the default "Docs" tab.

### Via `sections.json`

For full control, create a `sections.json` file in your project root:

```json
[
  { "label": "Docs", "slug": "" },
  { "label": "API Reference", "slug": "api" },
  { "label": "SDKs", "slug": "sdks" }
]
```

Each entry has:

- `label` - display name shown in the section bar
- `slug` - URL prefix for this section (use `""` for the root section)
- `directory` (optional) - subdirectory containing this section's MDX files, only needed when the directory name differs from the slug

```json
[
  { "label": "Guides", "slug": "", "directory": "guides" },
  { "label": "API Reference", "slug": "api", "directory": "api-reference" }
]
```

## Configuration Files

Place these JSON files in your project root (where you run `doccupine`). They are auto-copied to the generated app and watched for changes.

| File              | Purpose                                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------------------- |
| `doccupine.json`  | CLI config (watchDir, outputDir, port). Auto-generated on first run.                                      |
| `config.json`     | Site metadata: `name`, `description`, `icon`, `preview` image URL                                         |
| `theme.json`      | Theme overrides for [cherry-styled-components](https://github.com/cherry-design-system/styled-components) |
| `navigation.json` | Manual navigation structure (overrides auto-generated)                                                    |
| `links.json`      | Static header/footer links                                                                                |
| `fonts.json`      | Font configuration (Google Fonts or local)                                                                |
| `sections.json`   | Section definitions for tabbed doc groups (see [Sections](#sections))                                     |

## Public Directory

Place static assets (images, favicons, `robots.txt`, etc.) in a `public/` directory at your project root. Doccupine copies it to the generated Next.js app on startup and watches for changes, so added, modified, or deleted files are synced automatically.

## AI Chat Setup

The generated app includes an AI chat assistant. To enable it, create a `.env.local` file in the generated app directory:

```env
LLM_PROVIDER=openai # openai | anthropic | google

# API Keys (set the one matching your provider)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
```

If `LLM_PROVIDER` is not set, the chat component is hidden automatically.

> **Note:** Anthropic does not provide an embeddings API. When using `anthropic` as your provider, you must also set `OPENAI_API_KEY` for embeddings to work.

### Optional overrides

```env
LLM_CHAT_MODEL=gpt-4.1-nano                 # Override the default chat model
LLM_EMBEDDING_MODEL=text-embedding-3-small  # Override the default embedding model
LLM_TEMPERATURE=0                           # Set temperature (0-1, default: 0)
```

Default models per provider:

| Provider  | Chat model                   | Embedding model          |
| --------- | ---------------------------- | ------------------------ |
| OpenAI    | `gpt-4.1-nano`               | `text-embedding-3-small` |
| Anthropic | `claude-sonnet-4-5-20250929` | OpenAI fallback          |
| Google    | `gemini-2.5-flash-lite`      | `text-embedding-004`     |

## MCP Server

The generated app exposes an MCP endpoint at `/api/mcp` with three tools:

- `search_docs` - semantic search across all documentation
- `get_doc` - retrieve a specific document by path
- `list_docs` - list all available documents

This lets AI agents (Claude, ChatGPT, etc.) query your docs programmatically. Requires the AI chat setup above for embeddings.

## License

This project is licensed under a modified MIT license with a SaaS restriction. See [LICENSE](LICENSE) for details.
