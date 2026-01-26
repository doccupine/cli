export const deploymentMdxTemplate = `---
title: "Deployment"
description: "Deploy your Doccupine Next.js app to Vercel."
date: "2025-01-15"
category: "Configuration"
categoryOrder: 3
order: 7
---
# Deployment
Deploy your Doccupine site as a Next.js application on Vercel. You can connect a Git repository for automatic deployments or use the Vercel CLI for manual control.

<Callout type="warning">
  Only deploy the generated website directory produced by Doccupine (the Next.js app). Do not deploy your MDX source folder. If your repo contains multiple folders, set the Vercel project <strong>Root Directory</strong> to the generated site folder.
</Callout>

## Prerequisites
- **Vercel account**: https://vercel.com/signup
- **Git repository**: GitHub, GitLab, or Bitbucket with your Next.js app
- **Node.js**: Use an LTS version

## Option 1: Deploy via Git (recommended)
1. **Push the generated site folder** to a Git repository (or ensure the repo’s root is the generated website directory).
2. **Import to Vercel**: Go to https://vercel.com/new and select your repository.
3. If your repo is a monorepo, set the project **Root Directory** to the generated website folder (Project → Settings → General → Root Directory).
4. **Framework preset**: Vercel auto-detects Next.js.
5. **Build settings** (defaults are fine):
   - Install Command: \`pnpm i\`, \`yarn\`, or \`npm i\` (Vercel auto-detects)
   - Build Command: \`next build\`
   - Output: handled automatically by Vercel for Next.js
6. **Environment Variables**: Add any values required by your docs (see below).
7. **Deploy**: Vercel creates a Preview deployment per branch. Merge to your main branch to promote to Production.

## Option 2: Deploy with Vercel CLI
1. Install the CLI:
   \`\`\`bash
   npm i -g vercel
   \`\`\`
2. From the generated website directory, run:
   \`\`\`bash
   vercel
   \`\`\`
   Follow the prompts to link or create a project.
3. When ready for production:
   \`\`\`bash
   vercel --prod
   \`\`\`

## Environment variables
If your documentation or site behavior depends on environment variables, define them in Vercel:
- In the Vercel dashboard: Project → Settings → Environment Variables.
- Or via CLI:
  \`\`\`bash
  vercel env add NAME
  \`\`\`

For Next.js, make sure variables needed on the client are prefixed with \`NEXT_PUBLIC_\`.

## Next.js configuration notes
- Ensure a valid \`next.config.js\` if you customize images, basePath, or MDX handling.
- If you use MDX, include the necessary plugins/config in your project.
- Vercel automatically enables Image Optimization and Edge/CDN features for Next.js.

## Custom domains
- Add a domain in Vercel: Project → Settings → Domains.
- Point DNS to Vercel as instructed. Changes can take a few minutes to propagate.

## Troubleshooting
- **Build failed**: Check the Vercel build logs. Confirm Node version and lockfile are present.
- **Missing content**: Ensure your MDX directory and any assets are included in the repository.
- **Env not applied**: Add variables for the correct environment (Preview vs Production) and redeploy.
- **Images not loading**: Configure \`images.domains\` in \`next.config.js\` if using remote images.

## Tips
- **Preview first**: Use Preview deployments to validate docs before merging to Production.
- **Cache and performance**: Leverage ISR or static generation where applicable for faster loads.
- **Consistent tooling**: Keep a single package manager and lockfile in the repo (npm, pnpm, or yarn).`;
