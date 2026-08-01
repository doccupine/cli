export const platformPublishingMdxTemplate = `---
title: "Publishing Changes"
description: "Commit your edits to GitHub and deploy your documentation site with one click."
date: "2026-02-19"
updated: "2026-08-01"
category: "Editing"
categoryOrder: 1
order: 1
section: "Platform"
---
# Publishing Changes

When you edit files in Doccupine, your changes are staged as pending. Nothing goes live until you explicitly publish.

## The publish workflow

1. Make edits to your files using the file editor.
2. Click the **Publish** button in the project header. It appears as soon as anything is staged, with a badge showing the number of pending changes.
3. Review the change set in the publish modal. Each file expands into a diff of what you actually changed, line by line, against what is currently in your repository.
4. Optionally tick **Custom commit message** and write your own. Without one, the message is built from the files you are committing, like \`Update docs/guide.mdx\`.
5. Click **Deploy**.

Doccupine then:

- Commits all pending changes to your GitHub repository
- Triggers a new deployment
- Clears all pending changes from the staging area

<Callout type="note">
  The deployment status badge next to the project name updates as your site builds. It cycles through **Queued**, **Building**, and **Ready** (or **Error** if something went wrong).
</Callout>

## Checks before a publish

A few kinds of mistake do not break one page, they stop the whole site from building. Doccupine checks for those before committing anything and refuses the publish with a message naming the file to fix, so you find out in the publish modal instead of in a failed deploy.

### An OpenAPI source that will not be there

If \`doccupine.json\` names an OpenAPI spec, the root document and every recursively referenced local file must exist after the publish. Publish all of those files with the configuration change. Moving or deleting any document in the reference graph requires updating the relevant \`$ref\` or \`openapi\` path in the same change set.

### Two pages on the same URL

Two files that resolve to the same route - \`guide.mdx\` and \`guide/index.mdx\`, for instance - are a duplicate page, and the build stops rather than guessing which one you meant. Rename or delete one of them.

### Section names that become the same URL

Section URLs come from section names, so "API Reference" and "api-reference" both become \`/api-reference\`. Pick one spelling and use it in the \`section\` field of both pages.

<Callout type="note">
  These checks look at the repository as it will be **after** your publish, so a file you are deleting in the same change set counts as gone. If a check cannot run - GitHub is unreachable, say - the publish goes ahead and the build remains the backstop.
</Callout>

## Discarding changes

You can throw away as much or as little as you like:

- **A single line** - **Discard this line** on that line of the diff. The rest of the file stays staged. Line numbers do not drift as you go, so you can pick off several in a row. A deleted file has no lines to pick from, and a diff too large to show in full does not offer the control.
- **A whole file** - **Discard this file's change** on its row in the change set returns the file to whatever is in your repository.
- **Everything** - **Discard all**, above the change set, clears the staging area without committing anything.

If discarding leaves a file identical to what is already committed, it drops out of the change set on its own.

<Callout type="note">
  Discarding a line here counts as a hand edit, exactly like editing the page in the editor would. That matters if the page is tracked by [Agent Sync](/platform/self-updating-docs): a page you have touched by hand is always routed to review rather than being rewritten automatically.
</Callout>

## File status badges

In the publish modal, every row in the change set carries a badge for what happened to the file, alongside a count of the lines added and removed:

- **created** - the file is new
- **updated** - the file already exists and was edited
- **deleted** - the file is being removed

A file that [Agent Sync](/platform/self-updating-docs) staged carries an **agent** badge as well, so the agent's proposals are distinguishable from your own edits at a glance.

If the diffs cannot be loaded, the modal falls back to a plain file list whose badges read **mod**, **del**, or **bin** - the last for a binary asset such as an image or a font, which has no text diff to show.

## Changes staged by Agent Sync

Agent Sync stages the pages it writes into the same staging area your own edits go to, so a single publish commits both. The modal tells you when that is happening:

- **A conversation is waiting for review** - a notice names how many. Publishing or discarding those files here also settles the agent conversation, exactly as reviewing it from Agent Sync would.
- **A run is still writing** - the notice says so, and **Deploy**, **Discard all**, and the per-file and per-line discard controls stay disabled until the run finishes. Committing half-written pages, or pulling files out from under a run, would leave the conversation recording one decision and your repository holding another.

Discarding an agent's file reconciles its conversation: the proposal is dropped from the run and its file count shrinks. Discard everything a run wrote and the conversation records the change set as **discarded**, so the thread reads as a review decision rather than an abandoned run.

<Callout type="note">
  Cherry-picking is easier from Agent Sync itself. Its run view keeps the agent's original change set and offers **Restore discarded changes** to put back whatever you removed - here in the publish modal, a discard is final.
</Callout>

## Auto-deploy from GitHub

If you're using a user-connected GitHub repository and push changes directly (outside of Doccupine), the webhook triggers an automatic redeploy. This means you can use Doccupine's editor and Git-based workflows interchangeably.`;
