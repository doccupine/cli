export const platformCreatingAProjectMdxTemplate = `---
title: "Creating a Project"
description: "Set up a new documentation project with a managed or user-connected GitHub repository."
date: "2026-02-19"
category: "Getting Started"
categoryOrder: 0
order: 1
section: "Platform"
---
# Creating a Project
From your dashboard, click **Create new project** to get started. You'll name your project and choose how its Git repository is managed.

## Repository modes
Doccupine needs a GitHub repository to store your documentation files. You have two options:

### Managed repository
Choose **Use managed repository** and Doccupine creates and manages the GitHub repo for you under its own organization. This is the simplest option - no GitHub account required on your end.

### User repository
Choose **Connect to GitHub** to link your own GitHub account via OAuth. Doccupine creates the repo in your account, giving you full ownership and direct access to the source files.

<Callout type="note">
  You can connect your GitHub account at any time. If you're not sure, start with a managed repository - you can always migrate later.
</Callout>

## What happens during setup
After you choose a repository mode, Doccupine runs an automated setup process:

1. Creates a GitHub repository
2. Commits a starter template with example documentation files
3. Creates a hosting project on the deployment platform
4. Runs the initial build and deployment
5. Sets up a webhook so future pushes to the \`main\` branch trigger automatic deploys

This takes about a minute. Once complete, you're redirected to your new project's file explorer.

<Callout type="success">
  Your site is live immediately after setup. Visit it using the **Visit** button in the project header.
</Callout>

## Project limits
The number of projects you can create depends on your plan:

- **Pro** - 1 project, up to 5 team members
- **Enterprise** - 6 projects, unlimited team members

If you've reached your limit, you'll see a prompt to upgrade your plan.`;
