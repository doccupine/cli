export const platformImportFromGithubMdxTemplate = `---
title: "Import from GitHub"
description: "Paste a GitHub repository and let Doccupine's AI write a complete documentation site from your code."
date: "2026-07-24"
category: "Getting Started"
categoryOrder: 0
order: 2
section: "Platform"
---
# Import from GitHub

Instead of starting from a blank project, you can point Doccupine at a GitHub repository and have it write the documentation for you. The AI reads your actual source code - not a template - and produces a complete, multi-page MDX site that is deployed and ready to edit.

Start at [doccupine.com/import](https://doccupine.com/import) and paste any GitHub repository URL.

<Callout type="note">
  Any of these formats work: \`github.com/owner/repo\`, the full \`https://\` URL, or just \`owner/repo\`.
</Callout>

## How it works

<Steps>
  <Step title="Paste your repository">
    Enter the repo URL. If you're not signed in yet, you'll be sent to sign-up first - your repository is remembered, and the import starts on its own once your account is ready. Signing up starts your free 30-day trial and needs no credit card.
  </Step>
  <Step title="Choose where the code lives">
    Pick whether Doccupine manages the new documentation repository for you or creates it on your own GitHub account. This is the same choice described in [Creating a Project](/platform/creating-a-project).
  </Step>
  <Step title="Watch it build">
    A live progress view walks through five stages: **Validate**, **Read repo**, **Plan**, **Write pages**, and **Publish**. You can close the tab - the import keeps running.
  </Step>
  <Step title="Open your docs">
    When the run finishes you're taken straight to the new project, with the site already live.
  </Step>
</Steps>

## What each stage does

| Stage           | What happens                                                                                |
| --------------- | ------------------------------------------------------------------------------------------- |
| **Validate**    | Confirms the repository exists and that Doccupine can read it                                 |
| **Read repo**   | Downloads and scans the source files, selecting the ones that best describe the project       |
| **Plan**        | Drafts the page outline - sections, titles, and ordering                                      |
| **Write pages** | Writes each page as MDX, validating every one before it ships                                 |
| **Publish**     | Creates the repository, commits the docs, and deploys the site                                |

## Private repositories

Public repositories work straight away. For a private one, connect your GitHub account first - Doccupine then reads the repo with your own credentials.

If you start an import on a repository Doccupine can't reach, the progress page offers a **Connect GitHub** button. Once you've connected, the import picks up automatically where it left off.

## Cancelling an import

While the run is still reading, planning, or writing, a **Cancel import** link is available on the progress page. Nothing has been created on GitHub or your hosting at that point, so cancelling leaves no trace behind.

Once the run reaches the publishing stage it can no longer be cancelled - by then the repository and deployment are being created.

## Email notifications

A full import can take a few minutes, so you don't have to sit and watch it. Doccupine emails you when the run finishes, with the page count and a link to your new site - or, if something went wrong after the repository was read, an email explaining why.

## What you get

- A **multi-page MDX site** with sections, categories, and navigation already filled in
- Pages written from your real source files, not boilerplate
- A **live deployment** you can visit immediately
- Every page **linked back to the code it came from**, so [Self-updating Docs](/platform/self-updating-docs) can keep it current from day one

<Callout type="success">
  Nothing about an imported site is locked down. Open any page in the [file editor](/platform/file-editor), change whatever you like, and [publish](/platform/publishing) as usual.
</Callout>

## Limits

Doccupine reads a bounded number of files and writes a bounded number of pages, so an enormous monorepo produces a solid starting set rather than an endless run. Very large or very sparse repositories may need a few manual pages afterwards.

<Callout type="note">
  The initial generation is on us. It does **not** draw down your project's AI assistant budget, which is reserved for your deployed site's assistant. See [AI Assistant](/platform/ai-assistant) for those budgets.
</Callout>

## After the import

<Columns cols={2}>
  <Card title="Edit your pages" icon="pencil" href="/platform/file-editor">
    Rewrite, restructure, and add pages in the browser-based editor.
  </Card>
  <Card title="Keep them current" icon="refresh-cw" href="/platform/self-updating-docs">
    Let the agent rewrite pages when the code they document changes.
  </Card>
</Columns>`;
