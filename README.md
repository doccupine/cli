# Doccupine

[![npm version](https://img.shields.io/npm/v/doccupine.svg)](https://www.npmjs.com/package/doccupine)

[Doccupine](https://doccupine.com) is an open-source CLI that turns a directory of MDX files into a full-featured Next.js documentation website. Write your docs in Markdown, and Doccupine watches for changes, generates pages, and starts a live dev server automatically.

## Features

- **Live preview** - watches your MDX files and regenerates pages on every save
- **Auto-generated navigation** - sidebar built from frontmatter (`category`, `order`)
- **Theming** - dark/light mode with customizable theme via `theme.json`
- **AI chat assistant** - built-in RAG-powered chat (OpenAI, Anthropic, or Google)
- **MCP server** - exposes `search_docs`, `get_doc`, and `list_docs` tools for AI agents
- **Custom fonts** - Google Fonts or local fonts via `fonts.json`
- **Zero config to start** - `npx doccupine` scaffolds everything and starts the server

## Quick Start

Make sure you have [Node.js](https://nodejs.org) (v18+) installed.

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
doccupine config --show     # Show current configuration
doccupine config --reset    # Re-prompt for configuration
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
---
```

Navigation is auto-generated from `category`, `categoryOrder`, and `order`. Pages without a category appear ungrouped.

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

## AI Chat Setup

The generated app includes an AI chat assistant. To enable it, create a `.env.local` file in the generated app directory:

```env
LLM_PROVIDER=openai # openai | anthropic | google
OPENAI_API_KEY=sk-...
# Or: ANTHROPIC_API_KEY=sk-ant-...
# Or: GOOGLE_API_KEY=...
```

If `LLM_PROVIDER` is not set, the chat component is hidden automatically.

## MCP Server

The generated app exposes an MCP endpoint at `/api/mcp` with three tools:

- `search_docs` - semantic search across all documentation
- `get_doc` - retrieve a specific document by path
- `list_docs` - list all available documents

This lets AI agents (Claude, ChatGPT, etc.) query your docs programmatically. Requires the AI chat setup above for embeddings.

## License

This project is licensed under a modified MIT license with a SaaS restriction. See [LICENSE](LICENSE) for details.
