import { DEFAULT_DESCRIPTION } from "../../lib/constants.js";

export const indexMdxTemplate = `---
title: "Introduction"
description: "${DEFAULT_DESCRIPTION}"
date: "2026-02-19"
category: "Getting Started"
categoryOrder: 0
order: 0
---
# Welcome to Doccupine

Doccupine turns a folder of MDX files into a beautiful, production-ready documentation website. Write in standard Markdown, use any of the built-in components, and get a fully themed site with AI-powered search and automatic navigation - all from one command.

\`\`\`bash
npx doccupine
\`\`\`

That's it. Doccupine prompts you for a source directory, generates a Next.js site, and starts a dev server at \`http://localhost:3000\`. Every edit rebuilds instantly.

<Callout type="info">
  Want a managed experience instead? The [Doccupine Platform](/platform) gives you a browser-based editor, one-click publishing, custom domains, and team collaboration - no local setup needed.
</Callout>

## How it works

You write \`.mdx\` files using Markdown and built-in components like this one. Doccupine watches your files, generates pages, builds the sidebar from your frontmatter, and handles theming, AI chat, and deployment config for you.

Everything on this page - the callout above, the cards below, the code block - is a live example of what your docs can look like out of the box.

<Columns cols={2}>
  <Card title="Start writing" icon="pencil">
    Rich docs from day one. [14+ components](/headers-and-text) work out of the box - no imports needed.
  </Card>
  <Card title="Ship it" icon="rocket">
    Custom domains and team collaboration on the [Doccupine Platform](/platform), or [self-host](/deployment) anywhere.
  </Card>
</Columns>

## Configure your site

Doccupine works with no configuration, but when you're ready to customize, everything is controlled through simple JSON files in your project root.

- [Global settings](/globals) - Site name, description, favicon, and preview image via \`config.json\`
- [Navigation](/navigation) - Override the auto-generated sidebar with \`navigation.json\`
- [Theme](/theme) - Colors, logos, and dark mode palette via \`theme.json\`
- [Fonts](/fonts) - Google Fonts or local font files via \`fonts.json\`
- [AI Assistant](/ai-assistant) - Enable the built-in chat with your own API key
- [MCP Server](/model-context-protocol) - Let AI tools search your docs through \`/api/mcp\`
`;
