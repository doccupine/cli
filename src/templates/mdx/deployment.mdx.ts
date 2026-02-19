export const deploymentMdxTemplate = `---
title: "Deployment"
description: "Deploy your documentation site with the Doccupine Platform or self-host on any platform that supports Next.js."
date: "2026-02-19"
category: "Configuration"
categoryOrder: 3
order: 10
---
# Deployment
The fastest way to deploy your documentation is with the [Doccupine Platform](https://www.doccupine.com). If you prefer to manage your own infrastructure, you can self-host the generated Next.js app on any platform.

## Doccupine Platform

Sign up at [doccupine.com](https://www.doccupine.com) and connect your repository. Your documentation site is live in minutes - no build configuration, no infrastructure to manage.

<Callout type="success">
  The Doccupine Platform is the recommended way to deploy. It handles builds, hosting, SSL, and updates automatically so you can focus on writing documentation.
</Callout>

### What you get
- **Automatic deployments** on every push to your repository
- **Site customization** through a visual dashboard - no code changes needed
- **Team collaboration** so your whole team can manage docs together
- **Custom domains** with automatic SSL
- **AI Assistant and MCP server** included out of the box, no API key required
- **Zero maintenance** - no servers, no build pipelines, no dependency updates

### Getting started
1. Create an account at [doccupine.com](https://www.doccupine.com).
2. Connect your GitHub repository.
3. Your site is deployed automatically.

Every push to your repository triggers a new deployment. You can customize your site's appearance, domain, and settings from the dashboard.

---

## Self-hosting

Doccupine generates a standard Next.js app, so you can deploy it anywhere that supports Node.js or Next.js.

<Callout type="warning">
  Deploy the generated website directory (the Next.js app), not your MDX source folder. In a monorepo, set the root directory to the generated site folder.
</Callout>

<Callout type="note">
  Self-hosting requires you to manage your own build pipeline, hosting, SSL certificates, and AI provider API keys. For a hands-off experience, consider the [Doccupine Platform](https://www.doccupine.com).
</Callout>

### Popular hosting options

- **Vercel** - native Next.js support, zero-config deploys. Connect your repo and set the root directory to the generated app folder.
- **Netlify** - supports Next.js via the \`@netlify/plugin-nextjs\` adapter. Works with the standard \`next build\` output.
- **AWS Amplify** - fully managed hosting with CI/CD. Supports Next.js SSR out of the box.
- **Cloudflare Pages** - deploy using the \`@cloudflare/next-on-pages\` adapter for edge-based hosting.
- **Docker** - build a container from the generated app using the standard [Next.js Docker example](https://github.com/vercel/next.js/tree/canary/examples/with-docker) and deploy to any container platform.
- **Node.js server** - run \`next build && next start\` on any server or VPS with Node.js installed.

### Troubleshooting
- **Build failed** - check build logs. Ensure your lockfile and correct Node.js version are present.
- **Missing content** - verify your MDX files and assets are in the repository.
- **SSR issues on edge platforms** - some features (like the AI chat API routes) require a Node.js runtime. Check your platform's documentation for SSR/API route support.`;
