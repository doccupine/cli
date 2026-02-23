export const platformBuildAndDeployMdxTemplate = `---
title: "Build & Deploy"
description: "Monitor your documentation site's build status and deployment history."
date: "2026-02-19"
category: "Infrastructure"
categoryOrder: 3
order: 1
section: "Platform"
---
# Build & Deploy
The Build & Deploy page shows your documentation site's build and deployment history. Every time you publish changes or push to GitHub, a new deployment is created.

## Deployment status
The project header always shows your current deployment status:

- **Ready** - your site is live and up to date
- **Building** - a new deployment is in progress
- **Queued** - a deployment is waiting to start
- **Error** - the build failed

<Callout type="warning">
  If a deployment fails, check the build logs for error details. Common issues include MDX syntax errors or missing frontmatter fields.
</Callout>

## Build logs
Click on any deployment to view its build logs. These show the full output of the build process, making it easy to diagnose issues.

## Deployment triggers
Deployments are triggered in three ways:

1. **Publishing from Doccupine** - clicking Publish in the project header
2. **Pushing to GitHub** - pushing to the \`main\` branch of your repository triggers an automatic deploy via webhook
3. **Configuration changes** - saving AI assistant settings triggers a redeploy since those are stored as environment variables

## Visiting your site
Click the **Visit** button in the project header to open your live documentation site in a new tab.`;
