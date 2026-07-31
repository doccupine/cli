<p align="center">
  <a href="https://docs.doccupine.com/"><picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/header/graph.svg?subtitle=Documentation+made+simple.+Open+source.+AI-ready.&amp;logo=https%3A%2F%2Ffiles.riangle.com%2Fdoccupine%2Fpictogram.png&amp;size=wide&amp;mode=dark&amp;font=geist&amp;image=http%3A%2F%2Ffiles.riangle.com%2Fdoccupine%2Fcover.png&amp;overlay=0" /><img alt="Doccupine" src="https://shieldcn.dev/header/graph.svg?subtitle=Documentation+made+simple.+Open+source.+AI-ready.&amp;logo=https%3A%2F%2Ffiles.riangle.com%2Fdoccupine%2Fpictogram.png&amp;size=wide&amp;mode=light&amp;font=geist&amp;image=http%3A%2F%2Ffiles.riangle.com%2Fdoccupine%2Fcover.png&amp;overlay=0" /></picture></a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/doccupine"><picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/npm/doccupine.svg" /><img alt="badge" src="https://shieldcn.dev/npm/doccupine.svg?mode=light" /></picture></a>
  <a href="https://github.com/doccupine/cli"><picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/github/doccupine/cli/stars.svg" /><img alt="badge" src="https://shieldcn.dev/github/doccupine/cli/stars.svg?mode=light" /></picture></a>
  <a href="https://docs.doccupine.com/"><picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/badge/Docs.svg" /><img alt="badge" src="https://shieldcn.dev/badge/Docs.svg?mode=light" /></picture></a>
  <a href="https://doccupine.com/"><picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/badge/Website.svg" /><img alt="badge" src="https://shieldcn.dev/badge/Website.svg?mode=light" /></picture></a>
</p>

# Doccupine

[Doccupine](https://doccupine.com) is an open-source CLI that turns a directory of MDX files into a full-featured Next.js documentation website. Write your docs in Markdown, and Doccupine watches for changes, generates pages, and starts a live dev server automatically.

## Features

- **Live preview** - watches your MDX files and regenerates pages on every save
- **Auto-generated navigation** - sidebar built from frontmatter (`category`, `order`)
- **Sections** - organize docs into tabbed sections via frontmatter or `sections.json`
- **API reference** - point at an OpenAPI spec to generate interactive endpoint pages with a live playground
- **Subscribable changelogs** - pages using the `Update` component publish an RSS feed at `{page-url}/rss.xml`
- **Theming** - dark/light mode with customizable theme via `theme.json`
- **AI chat assistant** - built-in RAG-powered chat (OpenAI, Anthropic, or Google)
- **MCP server** - exposes `search_docs`, `get_doc`, and `list_docs` tools for AI agents
- **Custom fonts** - Google Fonts or local fonts via `fonts.json`
- **Static assets** - `public/` directory is watched and synced to the generated app
- **Password protection** - gate the whole site behind a shared password with `SITE_PASSWORD`
- **Zero config to start** - `npx doccupine` scaffolds everything and starts the server

## Quick Start

Make sure you have [Node.js](https://nodejs.org) (v22.12.0+) installed.

```bash
npx doccupine
```

Doccupine will prompt you for:

1. A directory to store your MDX files (default: `docs`)
2. An output directory for the generated Next.js app (default: `nextjs-app`)
3. An optional path to an OpenAPI spec for an API reference (blank to skip)

It then scaffolds the app, installs dependencies, and starts the dev server. Open http://localhost:3000 to view your docs.

The source and output directories must not overlap. To prevent accidental data loss, Doccupine only claims an empty output directory, one containing harmless local metadata such as `.DS_Store` or `.env.local`, or an existing Doccupine-generated app. Run `doccupine config --reset` if an older configuration no longer passes validation.

## CLI Commands

```bash
doccupine watch [options]   # Default. Watch MDX files and start dev server
doccupine build [options]   # Generate the site without installing or serving it
doccupine generate [options] # Alias for build
doccupine config --show     # Show current configuration
doccupine config --reset    # Re-prompt for configuration
```

### Options

`watch` (default):

| Flag                       | Description                                                                                                                              |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `--port <port>`            | Port for the dev server (default: `3000`). Auto-increments if taken.                                                                     |
| `--verbose`                | Show all Next.js output including compilation details                                                                                    |
| `--reset`                  | Re-prompt for watch/output directories                                                                                                   |
| `--skip-install`           | Generate and serve without running the dependency installer (installs are skipped automatically when `package.json` is unchanged)        |
| `--package-manager <name>` | Package manager for the generated app: `pnpm` or `npm` (default: auto-detect). Overrides the `packageManager` field in `doccupine.json`. |

`build`:

| Flag      | Description                            |
| --------- | -------------------------------------- |
| `--reset` | Re-prompt for watch/output directories |

`config`:

| Flag      | Description                              |
| --------- | ---------------------------------------- |
| `--show`  | Print the current configuration and exit |
| `--reset` | Re-prompt for watch/output directories   |

## MDX Frontmatter

Each MDX file supports these frontmatter fields:

```yaml
---
title: "Page Title"
description: "Page description for SEO"
category: "Getting Started"
categoryOrder: 0 # Sort order for the category group
order: 1 # Sort order within the category
navIcon: "book-open" # Lucide icon name shown next to the page in the sidebar
categoryIcon: "rocket" # Lucide icon name shown next to the category group
name: "My Docs" # Override site name in title suffix
icon: "https://..." # Page favicon URL
image: "https://..." # OpenGraph image URL
date: "2025-01-01" # Page date metadata
updated: "2025-02-01" # Last-modified date (JSON-LD dateModified)
section: "API Reference" # Section this page belongs to
sectionOrder: 1 # Sort order for the section in the tab bar
openapi: "GET /users/{id}" # Embed an API playground for this endpoint (see API Reference)
rss: true # Show an RSS button linking to the page's feed (pages with Update components)
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

## API Reference

Point Doccupine at an OpenAPI document (`.json`, `.yaml`, or `.yml`, OpenAPI 3.0/3.1) and it generates an interactive API reference: a directory at `/api-reference` linking every operation, plus one page per operation with a live playground for sending requests. Set the `openapi` field in `doccupine.json`:

```json
{
  "openapi": "openapi.json"
}
```

The endpoint pages are grouped into their own "API Reference" tab, and your hand-written docs move under a "Documentation" tab. The spec file is watched, so edits regenerate the reference live.

You can pass multiple specs as an array of paths, or name them explicitly:

```json
{
  "openapi": [
    { "name": "Public API", "file": "openapi.json" },
    { "name": "Admin API", "file": "admin-openapi.yaml" }
  ]
}
```

To embed a single endpoint's playground inline within a hand-written page, add an `openapi` frontmatter field set to `"METHOD /path"` (or the operation's `operationId`):

```yaml
---
title: "Fetch a User"
openapi: "GET /users/{id}"
---
```

## Configuration Files

Place these JSON files in your project root (where you run `doccupine`). They are auto-copied to the generated app and watched for changes.

| File              | Purpose                                                                                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `doccupine.json`  | CLI config (`watchDir`, `outputDir`, `port`, `packageManager`, `openapi`). Auto-generated on first run. Paths are stored relative to the project root, so the file is safe to commit. |
| `config.json`     | Site metadata: `name`, `description`, `icon`, `image`, `url` (public site URL for sitemap/robots)                                                                                     |
| `theme.json`      | Theme overrides for [cherry-styled-components](https://github.com/cherry-design-system/styled-components)                                                                             |
| `navigation.json` | Manual navigation structure (overrides auto-generated)                                                                                                                                |
| `links.json`      | Static header/footer links                                                                                                                                                            |
| `fonts.json`      | Font configuration (Google Fonts or local)                                                                                                                                            |
| `sections.json`   | Section definitions for tabbed doc groups (see [Sections](#sections))                                                                                                                 |
| `analytics.json`  | Analytics provider configuration (PostHog supported)                                                                                                                                  |

## Public Directory

Place static assets (images, favicons, etc.) in a `public/` directory at your project root. Doccupine copies it to the generated Next.js app on startup and watches for changes, so added, modified, or deleted files are synced automatically.

## Sitemap and robots.txt

Doccupine generates `robots.ts` automatically for every site. When you set a `url` in `config.json`, it also generates `sitemap.ts` covering every page (across all sections) and links the sitemap from `robots.txt`.

```json
{
  "name": "My Docs",
  "url": "https://docs.example.com"
}
```

You can override the URL at deploy time by setting the `NEXT_PUBLIC_SITE_URL` environment variable. When no URL is configured, `/sitemap.xml` is still served but stays empty, and `robots.txt` omits its sitemap reference until a public URL is available. The variable is baked in at build time, so changing it needs a redeploy.

## llms.txt

Doccupine generates [llms.txt](https://llmstxt.org) artifacts so AI agents can discover and ingest your docs. On every regeneration, the following files are written to the generated app's `public/` directory:

| File               | Contents                                                                                |
| ------------------ | --------------------------------------------------------------------------------------- |
| `llms.txt`         | Index of every page (title, description, URL), grouped by section and category          |
| `llms-full.txt`    | Full-text bundle: every page's body concatenated for one-shot ingestion                 |
| `public/<slug>.md` | Per-page Markdown mirror of each MDX page, suitable for direct fetching at `/<slug>.md` |

The site name and description used in `llms.txt` come from `config.json` (`name`, `description`). Page URLs are absolute when `url` is set in `config.json` (or via `NEXT_PUBLIC_SITE_URL`), and root-relative otherwise.

A `.doccupine-artifacts.json` file in the generated app tracks generated route ownership and per-page mirrors so renamed or deleted sources clean up only their own outputs. Don't commit this file; it is regenerated automatically.

## AI Chat Setup

The generated app includes an AI chat assistant. To enable it, create a `.env` file in the generated app directory:

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
LLM_EMBEDDING_DIMS=512                       # Dimensions for the prebuilt search index (default: 512)
RAG_RUNTIME_EMBED_MAX_CHUNKS=400             # Max chunks embedded on demand in production (default: 400; 0 requires a prebuilt index)
# RAG_API_KEY=...                            # Optional bearer auth for direct /api/rag requests
```

`LLM_EMBEDDING_DIMS` Matryoshka-truncates document vectors so the prebuilt search index stays small; lower values shrink the index at a slight cost to recall. `RAG_RUNTIME_EMBED_MAX_CHUNKS` caps how many chunks the chat will embed on demand in production before requiring a prebuilt index (it's unlimited under `next dev`).

Public documentation leaves browser chat available by default. Setting `RAG_API_KEY` requires a bearer token for `/api/rag` and is intended for server-to-server use; the built-in browser cannot safely hold that secret. Use `SITE_PASSWORD` instead when authenticated browser visitors should retain chat access.

Default models per provider:

| Provider  | Chat model                   | Embedding model          |
| --------- | ---------------------------- | ------------------------ |
| OpenAI    | `gpt-4.1-nano`               | `text-embedding-3-small` |
| Anthropic | `claude-sonnet-4-5-20250929` | OpenAI fallback          |
| Google    | `gemini-2.5-flash-lite`      | `gemini-embedding-001`   |

## MCP Server

The generated app exposes an MCP endpoint at `/api/mcp` with three tools:

- `search_docs` - semantic search across all documentation
- `get_doc` - retrieve a specific document by path
- `list_docs` - list all available documents

This lets AI agents (Claude, ChatGPT, etc.) query your docs programmatically. Semantic `search_docs` requires the AI setup above for embeddings; `get_doc` and `list_docs` work from the generated content manifest without an embedding provider.

## Password Protection

Gate your entire documentation site behind a shared password by setting `SITE_PASSWORD` in the generated app's environment - add it to `.env` for local development, or your host's environment variables in production:

```env
SITE_PASSWORD=choose-a-strong-shared-password
```

When set, every visitor sees a login screen until they enter the password. Protection is enforced across three layers:

- **Pages** are gated behind the login screen.
- **Content APIs** (`/api/rag` chat, `/api/search`, and the `/api/playground` proxy) return `401` without a valid session, so the docs can't be scraped and the proxy can't relay anonymous requests around the login. Each route re-checks the session itself, not just the middleware.
- **Search engines and crawlers** are blocked: `robots.txt` disallows everything, pages carry a `noindex, nofollow` tag, and responses include an `X-Robots-Tag` header.

A successful login sets a signed, `httpOnly` cookie that lasts 30 days. The cookie stores an HMAC of the password, never the password itself. Leave `SITE_PASSWORD` unset (the default) to keep the site fully public. Documentation pages stay statically rendered either way - the gate is enforced in middleware.

> **Note:** The [MCP endpoint](#mcp-server) uses `DOCS_API_KEY` bearer authentication when configured. Without an API key, a password-protected site requires the normal gate session for MCP as well.

## License

This project is licensed under a modified MIT license with a SaaS restriction. See [LICENSE](LICENSE) for details.
