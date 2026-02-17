export const deploymentMdxTemplate = `---
title: "Deployment"
description: "Deploy your documentation site with Doccupine or self-host on any platform that supports Next.js."
date: "2025-01-15"
category: "Configuration"
categoryOrder: 3
order: 9
---
# Deployment

## Deploy with Doccupine

Sign up for an account at [Doccupine](https://www.doccupine.com) and create your docs instantly - no build configuration, no infrastructure to manage.

Doccupine gives you:
- **Automatic deployments** on every push to your repository
- **Site customization** through a visual dashboard - no code changes needed
- **Team collaboration** so your whole team can manage docs together
- **Custom domains** with automatic SSL
- **AI Assistant and MCP server** included out of the box, no API key required

Get started at [doccupine.com](https://www.doccupine.com).

---

## Self-hosting

Doccupine generates a standard Next.js app, so you can deploy it anywhere that supports Node.js or Next.js.

<Callout type="warning">
  Deploy the generated website directory (the Next.js app), not your MDX source folder. In a monorepo, set the root directory to the generated site folder.
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
