export const platformSelfUpdatingDocsMdxTemplate = `---
title: "Self-updating Docs"
description: "Link documentation pages to the code they describe and let the agent rewrite them when that code changes."
date: "2026-07-24"
category: "Editing"
categoryOrder: 1
order: 2
section: "Platform"
---
# Self-updating Docs

Documentation goes stale because code moves and nobody notices. Agent Sync closes that gap: every page can be linked to the source files it documents, pinned to the exact commit it was written from. When those files change, the page is flagged as **drifted** - and the agent can rewrite it for you.

You'll find it under **Agent Sync** in the project sidebar.

## The four views

| View      | What it's for                                                                 |
| --------- | ----------------------------------------------------------------------------- |
| **Agent** | Ask the agent to write or update documentation, and read its replies           |
| **Map**   | Each page beside the sources it came from, with its sync state                 |
| **Table** | The same information as a dense, sortable list                                 |
| **Drift** | The queue of pages whose sources have changed                                  |

A badge on the sidebar link counts the pages currently waiting for attention.

## Asking the agent for docs

The **Agent** view is a chat. Describe what you want documented, choose a **source repository** and a **scope** - the whole repo, a folder, or a single file - and the agent researches the code, plans the pages, and writes them.

Replies are threaded, so a follow-up builds on what came before:

> Document the auth module - cover sessions, refresh tokens and the error codes.

> Now do the same for the CLI.

Each turn shows the steps the agent took, the pages it changed, the sources it read, and what the run cost. You can switch between conversations, rename them, or start a fresh one.

<Callout type="note">
  An empty result is a valid answer. If the docs already describe the code accurately, the agent will say so rather than rewriting pages for the sake of it.
</Callout>

## Linking pages to sources

A page needs at least one source link before drift can be detected. There are three ways to create them:

<Steps>
  <Step title="Automatically, as the agent writes">
    Every page the agent produces records the files it was derived from. Sites created by [Import from GitHub](/platform/import-from-github) arrive fully linked.
  </Step>
  <Step title="Scan for sources">
    The **Scan for sources** button matches your existing pages against the repository by name and structure, then proposes links for you to approve. It's a good way to bootstrap a hand-written site. The scan itself uses no AI credit.
  </Step>
  <Step title="By hand">
    Open a page in the editor and use the source status button in the toolbar, or the detail panel on the Map view, to say "this page documents that file". Hand-written pages can be tracked this way without ever having been generated.
  </Step>
</Steps>

## How drift is detected

Doccupine watches your source repositories two ways:

- **Push webhook** - instant, and used whenever Doccupine can install a hook on the repository. Your project's own repository always has one.
- **Background check** - every 30 minutes, for repositories you don't administer.

The Source repositories manager shows which one each repo is using, as an **Instant** or **~30 min** badge.

## Review or publish automatically

When a linked source changes, what happens next depends on the page:

| Page setting                     | On drift                                                         |
| -------------------------------- | ---------------------------------------------------------------- |
| Default                          | Flagged for review - you trigger the update                       |
| **Auto-update** on               | The agent rewrites the page and publishes it                      |
| Edited by a human                | **Always** flagged for review, whatever else is set               |

Each row on the Map and Table views has an **Auto-update this page when its source changes** toggle, so you can let routine reference pages look after themselves while a carefully worded overview page always waits for you.

For anything in review, **Review update** opens the change set - the same diff view as [publishing](/platform/publishing) - and **Update from source** asks the agent to regenerate that one page on demand.

<Callout type="warning">
  Your edits are never overwritten. Doccupine compares the page's content against what the agent last wrote, so a page you've touched by hand is detected and routed to review - even if auto-update is on. Reformatting, line-ending changes, and blank-line churn don't count as edits.
</Callout>

## Source repositories

Your project's own repository is always a source, so a repo that holds both code and docs needs no setup at all.

For a multi-repo or monorepo setup, add the other repositories in the Source repositories manager. The agent can then be pointed at any of them, and drift is tracked across all of them.

<Callout type="note">
  Removing a repository that still has linked pages asks for confirmation first and tells you how many pages are affected.
</Callout>

## Notifications

Doccupine emails the project owner when pages are ready to review, and when pages have been updated and published. You're notified once per project when pages first drift - a later change to the same page won't email you again until you've dealt with it.

## What it costs

Agent runs use your project's AI credit. Doccupine keeps that spend predictable:

- Automatic regeneration only ever happens for pages you've explicitly set to auto-update. A page waiting for review costs nothing when its source changes.
- Drift that changes no lines - a merge or a rename that leaves the tracked file's content alone - never triggers a run.
- Every run has a ceiling on pages and spend.
- Only one run happens at a time per project.

See [AI Assistant](/platform/ai-assistant) for how AI is configured and budgeted.

## In the editor

You don't have to leave the editor to use any of this. The toolbar has a source status button showing whether the open page is in sync, drifted, or unlinked - and why it would need review - and the side panel lets you ask the agent for a block of MDX to drop straight in at your cursor.`;
