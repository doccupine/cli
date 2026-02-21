export const platformIndexMdxTemplate = `---
title: "Platform Overview"
description: "Learn how to use the Doccupine platform to create, customize, and deploy documentation websites."
date: "2026-02-19"
category: "Getting Started"
categoryOrder: 0
order: 0
section: "Platform"
---
# Platform Overview
The Doccupine platform gives you everything you need to create, customize, and host beautiful documentation websites - all from your browser. No local setup, no CI pipelines, no infrastructure to manage.

## What you get
- **Browser-based editor** for writing and managing your documentation files
- **One-click publishing** that commits to GitHub and deploys automatically
- **Visual configuration** for themes, navigation, fonts, links, and more
- **Custom domains** with automatic HTTPS
- **AI assistant** built into every deployed site
- **Team collaboration** with role-based access control

## How it works
Doccupine connects two core pieces behind the scenes:

1. **GitHub** stores your documentation source files in a Git repository
2. **Doccupine** builds, hosts, and serves your site globally - plus provides a dashboard for editing, configuring, and managing your project

You write MDX files, configure your site through visual settings pages, and hit Publish. Doccupine handles the rest.

## Getting started

1. **Sign up** at Doccupine and start your free 30-day trial - no credit card required.
2. **Create a project** from the dashboard. Choose between a managed repository or connecting your own GitHub account.
3. **Edit your docs** using the built-in file explorer and editor.
4. **Configure your site** through the settings pages - theme, navigation, fonts, and more.
5. **Publish** your changes with a single click.

<Callout type="success">
  Your documentation site is live the moment you create a project. Doccupine deploys a starter site automatically so you can see results immediately.
</Callout>

## Dashboard
After signing in, the dashboard shows all your projects. You'll see two sections:

- **Your Projects** - documentation sites you own, plus a button to create new ones
- **Shared Projects** - sites that other users have invited you to collaborate on

Click any project card to open it and start working.

<Columns cols={2}>
  <Card title="Sign Up" icon="user-plus" href="https://doccupine.com/sign-up">
    Create your free account and start building documentation in minutes.
  </Card>
  <Card title="Sign In" icon="log-in" href="https://doccupine.com/sign-in">
    Already have an account? Sign in to your dashboard.
  </Card>
</Columns>`;
