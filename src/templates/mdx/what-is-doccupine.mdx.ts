export const whatIsDoccupineMdxTemplate = `---
title: "What is Doccupine"
description: "Doccupine is a CLI that turns a directory of MDX files into a complete, production-ready documentation website - no frontend work required."
date: "2026-02-19"
category: "Getting Started"
categoryOrder: 0
order: 2
---

# What is Doccupine

**Doccupine** is a CLI tool that turns a directory of MDX files into a complete Next.js documentation website. It is less of a framework you assemble and more of a tool that does the assembling for you - you bring the content, Doccupine builds the site.

\`\`\`bash
npx doccupine
\`\`\`

## Philosophy

Doccupine was built on a simple belief: writing documentation should feel like writing, not like building a web app. Most docs frameworks hand you a pile of libraries and configuration and expect you to wire up rendering, navigation, theming, and search yourself. Doccupine makes those decisions for you and gets out of the way, so the only thing left to do is write.

## Content first

You write standard Markdown and MDX. No React, no build configuration, no component wiring. Your navigation, theming, and search are all derived from your files and a handful of JSON config files. If you can write a Markdown file, you can ship a documentation site.

## Batteries included

Everything you expect from a great docs site works the moment you run the command - MDX rendering, an auto-generated sidebar, dark and light themes, 14+ built-in components, full-text search, an AI chat assistant, and an MCP server. Nothing to install, nothing to opt into.

<Callout type="info">
  Every element on this page - this callout, the cards below, the code block above - is a live example of what your docs get out of the box, with zero setup.
</Callout>

## You own the output

Doccupine generates a real Next.js 16 app inside your project, not a hosted black box. Every page, layout, and API route is written to disk where you can read it, extend it, or deploy it anywhere Next.js runs. Doccupine scaffolds the site; you stay in control of it.

## Instant feedback

Run \`npx doccupine\` and it watches your files. Every time you save an MDX file, change a config value, or drop in a new font, the site regenerates and the dev server reloads. Your docs are always one save away from being live.

## AI-native

Documentation is not only read by people anymore. Doccupine ships a RAG-powered chat assistant so readers can ask questions in natural language, and an MCP server so AI tools and agents can search your documentation directly. Your content is ready for both audiences from day one.

## Opinionated, on purpose

Doccupine makes the boring decisions - layout, typography, color, navigation structure - so you can spend your time on the words that matter. When you are ready to customize, simple JSON files let you adjust site metadata, navigation, theme, and fonts without touching a line of code.

## When to use Doccupine

Doccupine is built for anyone who needs a polished documentation site without becoming a frontend engineer.

- Product and API documentation
- Developer guides and tutorials
- Internal knowledge bases and runbooks
- Design systems and component references

There are two ways to run it:

<Columns cols={2}>
  <Card title="Local CLI" icon="terminal" href="/">
    \`npx doccupine\` scaffolds and serves the site on your machine, and you self-host the generated Next.js app anywhere.
  </Card>
  <Card title="Doccupine Platform" icon="cloud" href="/platform">
    A managed, browser-based experience with a visual editor, one-click publishing, custom domains, and team collaboration - no local setup.
  </Card>
</Columns>`;
