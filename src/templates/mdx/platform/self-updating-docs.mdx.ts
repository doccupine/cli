export const platformSelfUpdatingDocsMdxTemplate = `---
title: "Agent Sync"
description: "Agent Sync links documentation pages to the code they describe and rewrites them when that code changes, keeping your docs self-updating."
date: "2026-07-24"
updated: "2026-07-30"
category: "Editing"
categoryOrder: 1
order: 2
section: "Platform"
---
# Agent Sync

Documentation goes stale because code moves and nobody notices. **Agent Sync** closes that gap: every page can be linked to the source files it documents, pinned to the exact commit it was written from. When those files change, the page is flagged as **drifted** - and the agent can rewrite it for you.

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
  <Step title="Auto-link existing pages">
    **Auto-link code** scans your existing pages, proposes matching files from every source repository, and lets you approve the links in one batch. It's a good way to bootstrap a hand-written site.
  </Step>
  <Step title="By hand">
    Open an MDX page in the editor, select **Source links** in the toolbar, then choose a repository and match one file, a folder, or a path pattern. Hand-written pages can be tracked this way without ever having been generated.
  </Step>
</Steps>

## Auto-link existing pages

Use **Auto-link code** in the Agent Sync header when you already have documentation but it is not connected to its source code yet.

<Steps>
  <Step title="Start the scan">
    Select **Auto-link code**. Doccupine reads the committed Markdown and MDX pages in your docs repository that do not have source links yet, then compares them with file paths from all your source repositories. Pending editor changes are not included until they are published.
  </Step>
  <Step title="Review the suggestions">
    Suggestions are grouped by page. A strong match means the page names or references the file, so it starts selected. A weaker name match is left unselected for you to confirm. You can change any checkbox, and existing source links are never replaced.
  </Step>
  <Step title="Link the selected files">
    Select **Link selected (N)**. Each approved file is recorded against the page and pinned to the repository's current commit. The page appears as **In sync** in the Map and Table views; Auto-link does not rewrite, commit, or publish the documentation.
  </Step>
</Steps>

The normal scan is deterministic and uses no AI credit. **AI auto-select** is optional: it asks the configured AI model to refine the offered matches, uses AI credit, and only changes which checkboxes are selected. You still review the result and select **Link selected (N)** to save it.

<Callout type="note">
  Auto-link skips pages that already have at least one source link. To add another file, folder, or pattern to one of those pages, open the page's **Source links** panel in the editor and link it manually.
</Callout>

If the scan finds an OpenAPI specification and your \`doccupine.json\` does not configure one yet, it also offers **Add to doccupine.json (N)**. This stages the configuration and, when needed, a copy of the specification as pending changes. Review and publish those changes through the normal publishing flow.

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

For a multi-repo setup, add the other repositories from Agent Sync:

<Steps>
  <Step title="Open Source repositories">
    Select **Source repositories** in the Agent Sync header. Your project's repository appears first with a **Default** badge and cannot be removed.
  </Step>
  <Step title="Choose another repository">
    Project owners and editors can select **Add repository**, then search the GitHub repositories they own, collaborate on, or can access through an organization. If GitHub is not connected yet, select **Connect GitHub**, finish authorization, then reopen the manager.
  </Step>
  <Step title="Check its connection">
    Selecting a repository adds it immediately. **Instant** means Doccupine installed a push webhook; **~30 min** means it will check for source changes on a schedule instead. Both modes support the agent, manual source links, Auto-link code, and drift tracking.
  </Step>
</Steps>

Once connected, the repository appears in the Agent view's **Source repository** selector and anywhere you create a source link.

<Callout type="note">
  Removing a repository never deletes your documentation pages. If pages still link to it, Doccupine tells you how many are affected and asks again before removing those source links. The pages remain, but they stop tracking changes from that repository.
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
