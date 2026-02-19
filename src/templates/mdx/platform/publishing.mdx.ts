export const platformPublishingMdxTemplate = `---
title: "Publishing Changes"
description: "Commit your edits to GitHub and deploy your documentation site with one click."
date: "2026-02-19"
category: "Editing"
categoryOrder: 1
order: 1
section: "Platform"
---
# Publishing Changes
When you edit files in Doccupine, your changes are staged as pending. Nothing goes live until you explicitly publish.

## The publish workflow

1. Make edits to your files using the file editor.
2. Click the **Publish** button in the project header. A badge shows the number of pending changes.
3. Review the list of modified, deleted, and new files in the publish modal.
4. Optionally write a custom commit message (defaults to "Update docs via Doccupine").
5. Click **Publish Changes**.

Doccupine then:
- Commits all pending changes to your GitHub repository
- Triggers a new deployment
- Clears all pending changes from the staging area

<Callout type="note">
  The deployment status badge in the project header updates as your site builds. It cycles through **queued**, **building**, and **ready** (or **error** if something went wrong).
</Callout>

## Discarding changes
If you want to undo your pending edits, click **Discard All Changes** in the publish modal. This removes all staged changes without committing anything.

## File status badges
In the publish modal, each file shows a badge indicating what changed:

- **mod** - the file was modified
- **del** - the file was deleted
- **bin** - the file is a binary asset (image, font, etc.)

## Auto-deploy from GitHub
If you're using a user-connected GitHub repository and push changes directly (outside of Doccupine), the webhook triggers an automatic redeploy. This means you can use Doccupine's editor and Git-based workflows interchangeably.`;
