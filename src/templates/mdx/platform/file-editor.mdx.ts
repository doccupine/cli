export const platformFileEditorMdxTemplate = `---
title: "File Editor"
description: "Browse, create, and edit your documentation files directly in the browser."
date: "2026-02-19"
category: "Editing"
categoryOrder: 1
order: 0
section: "Platform"
---
# File Editor
The file editor is the main workspace for your documentation project. It provides a browser-based file explorer and editor for working with your MDX files and assets.

## File explorer
The left panel has three tabs:

- **Files** - browse your repository's file tree, create and manage files and folders
- **Media** - manage uploaded images and binary assets
- **Navigation** - open the [Navigation Builder](/navigation-settings) to configure your sidebar structure with drag-and-drop

In the Files tab, you can:

- **Browse** directories and files
- **Create** new files and folders
- **Rename** and **delete** existing files
- **Upload** binary assets like images, favicons, and font files

Click any file to open it in the editor panel.

## Editing files
The editor supports MDX files with full syntax highlighting. Changes you make are saved as **pending changes** - they aren't committed to your repository until you publish.

<Callout type="note">
  Pending changes are stored in Doccupine's database, not in your Git repository. This means you can make edits across multiple sessions before publishing.
</Callout>

## Version history
For any file, you can view its commit history to see how it has changed over time. This lets you:

- See when changes were made and what the commit messages were
- View the file's content at any previous commit
- Compare past versions to understand what changed

## Binary files
You can upload images and other binary assets (PNG, JPG, SVG, WOFF2, etc.) directly through the file explorer. These are stored temporarily in Doccupine's storage and committed to your repository when you publish.

## Read-only mode
Team members with the **Viewer** or **Billing** role can browse files but cannot make edits. The editor will display content in read-only mode for these users.`;
