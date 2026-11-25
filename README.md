<div align="center">
  <a href="https://docs.doccupine.com/">
    <img src=".github/assets/icon.svg" alt="Doccupine" width="120" height="120" />
  </a>

  <h1>Doccupine</h1>

  <p><strong>Documentation made simple. Open source. AI-ready.</strong></p>

  <p>
    Turn a folder of MDX files into a fast, good-looking documentation site,<br />
    with AI chat and an MCP server built in. One command, no config to start.
  </p>

  <p>
    <a href="https://www.npmjs.com/package/doccupine"><img src="https://img.shields.io/npm/v/doccupine.svg?style=flat" alt="npm version" /></a>
    <a href="https://github.com/doccupine/cli"><img src="https://img.shields.io/github/stars/doccupine/cli.svg?style=flat" alt="GitHub stars" /></a>
  </p>

  <p>
    <code>npx doccupine</code>
  </p>

  <p>
    <a href="https://docs.doccupine.com/">Docs</a> ·
    <a href="#what-you-get">What you get</a> ·
    <a href="#commands">Commands</a> ·
    <a href="#deploy">Deploy</a> ·
    <a href="https://doccupine.com/">Website</a> ·
    <a href="./CHANGELOG.md">Changelog</a>
  </p>
</div>

## Get started

```bash
npx doccupine
```

Doccupine asks where your MDX files live (default `docs`) and where to put the generated Next.js app (default `nextjs-app`), then installs everything and starts a live preview at http://localhost:3000. Edit a file, and the page updates. Requires [Node.js](https://nodejs.org) 22.12 or later.

**[Read the full documentation →](https://docs.doccupine.com)**

## What you get

- **Live preview.** Pages regenerate on every save.
  - [Commands](https://docs.doccupine.com/commands)
- **Navigation and sections.** The sidebar comes from your frontmatter, and sections split the docs into tabs.
  - [Navigation](https://docs.doccupine.com/navigation) · [Sections](https://docs.doccupine.com/sections)
- **Components.** Callouts, tabs, steps, cards, code blocks, Mermaid diagrams and more, ready to use in MDX.
  - [Components](https://docs.doccupine.com/components)
- **API reference.** Point it at an OpenAPI spec and get a page per endpoint with a live playground.
  - [API playground](https://docs.doccupine.com/api-playground)
- **AI chat assistant.** Visitors ask questions and get answers from your docs, using OpenAI, Anthropic or Google.
  - [AI Assistant](https://docs.doccupine.com/ai-assistant)
- **MCP server.** AI tools like Claude, Cursor and VS Code can search your docs directly.
  - [Model Context Protocol](https://docs.doccupine.com/model-context-protocol)
- **Languages and versions.** Translate your docs and keep older releases online.
  - [Languages](https://docs.doccupine.com/languages) · [Versions](https://docs.doccupine.com/versions)
- **Templates and theming.** Pick the modern or classic design, then add light and dark mode, your colors and fonts.
  - [Templates](https://docs.doccupine.com/templates) · [Theme](https://docs.doccupine.com/theme) · [Fonts](https://docs.doccupine.com/fonts)
- **Password protection.** Gate the whole site behind a shared password.
  - [Authentication](https://docs.doccupine.com/authentication)
- **Built for search engines and AI.** Sitemap, `robots.txt`, `llms.txt` and a Markdown copy of every page are generated for you.
- **Changelogs with RSS.** Publish release notes that readers can subscribe to.
  - [Update component](https://docs.doccupine.com/update)

## Commands

```bash
doccupine                 # watch your docs and run the live preview (same as `doccupine watch`)
doccupine build           # generate the site once, for CI or deployment
doccupine config --show   # show the saved configuration
doccupine config --reset  # reset the saved configuration
```

All options are in the [Commands](https://docs.doccupine.com/commands) docs.

## Deploy

The generated app is a standard Next.js project, so it runs anywhere Next.js does. See [Deployment & Hosting](https://docs.doccupine.com/deployment-and-hosting).

Prefer not to host it yourself? [Doccupine](https://doccupine.com) builds, hosts and updates your docs site for you.

## Contributing

Bug reports and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md), and report security issues as described in [SECURITY.md](SECURITY.md).

## License

Modified MIT license with a SaaS restriction. See [LICENSE](LICENSE).
