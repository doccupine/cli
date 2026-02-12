export const deploymentMdxTemplate = `---
title: "Deployment"
description: "Deploy your documentation site with Doccupine or self-host on Vercel."
date: "2025-01-15"
category: "Configuration"
categoryOrder: 3
order: 9
---
# Deployment

## Deploy with Doccupine

Sign up for an account at [Doccupine](https://www.doccupine.com) and create your docs instantly — no build configuration, no infrastructure to manage.

Doccupine gives you:
- **Automatic deployments** on every push to your repository
- **Site customization** through a visual dashboard — no code changes needed
- **Team collaboration** so your whole team can manage docs together
- **Custom domains** with automatic SSL
- **AI Assistant and MCP server** included out of the box, no API key required

Get started at [doccupine.com](https://www.doccupine.com).

---

## Self-hosting on Vercel

If you prefer to self-host, Doccupine generates a standard Next.js app that can be deployed to Vercel.

<Callout type="warning">
  Deploy the generated website directory (the Next.js app), not your MDX source folder. In a monorepo, set the Vercel <strong>Root Directory</strong> to the generated site folder.
</Callout>

### Quick start
1. Push the generated site folder to GitHub, GitLab, or Bitbucket.
2. Import the repository at [vercel.com/new](https://vercel.com/new). Vercel auto-detects Next.js and applies the correct build settings.
3. Add any required environment variables under Project → Settings → Environment Variables.
4. Deploy. Vercel creates Preview deployments per branch and promotes to Production on merge to main.

You can also deploy from the command line with the [Vercel CLI](https://vercel.com/docs/cli):

\`\`\`bash
npm i -g vercel
\`\`\`

### Custom domains
Add a domain under Project → Settings → Domains and point your DNS to Vercel.

### Troubleshooting
- **Build failed** — Check build logs. Ensure your lockfile and correct Node.js version are present.
- **Missing content** — Verify your MDX files and assets are in the repository.`;
