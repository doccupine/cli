export const platformFileEditorMdxTemplate = `---
title: "File Editor"
description: "Browse, create, and edit your documentation files directly in the browser."
date: "2026-02-19"
category: "Editing"
categoryOrder: 1
categoryIcon: "pencil"
order: 0
section: "Platform"
---

# File Editor

The file editor is the main workspace for your documentation project. It provides a browser-based file explorer and editor for working with your MDX files and assets.

## File explorer

The left panel has three tabs:

- **Files** - browse your repository's file tree, create and manage files and directories
- **Media** - browse folders and manage uploaded images and binary assets
- **Navigation** - open the [Navigation Builder](/platform/navigation-settings) to configure your sidebar structure with drag-and-drop

In the Files tab, you can:

- **Browse** directories and files
- **Create** new files and directories
- **Rename** and **delete** existing files
- **Upload** binary assets like images, favicons, and font files

Click any file to open it in the editor panel.

## Editing files

The editor supports MDX files with full syntax highlighting. Changes you make are saved as **pending changes** - they aren't committed to your repository until you publish.

<Callout type="note">
  Pending changes are stored in Doccupine's database, not in your Git repository. This means you can make edits across multiple sessions before publishing.
</Callout>

## Inserting components

You don't have to remember the syntax for every component. There are three ways to insert one, and they all produce the same snippet.

**The Insert component menu.** In the editor toolbar, open the component menu and pick from the grouped list. The snippet is inserted at your cursor, or appended to the end of the document if you haven't placed a cursor yet.

**The \`/\` shortcut.** Type \`/\` on an empty line or after a space and the same menu opens at your cursor. Choose a component and it replaces the \`/\`. If you keep typing instead, the menu disappears and your text is left alone, so a \`/\` in a URL or a date never gets in the way.

**Autocomplete.** Type \`<\` and a list of components appears. Keep typing to filter it.

Whichever you use, the editor scrolls the new component into view and places your cursor inside it, ready to fill in.

<Callout type="tip">
  The menu only offers components that are valid on their own. Ones that must live inside a parent, like \`<Step>\` inside \`<Steps>\`, stay in the \`<\` autocomplete instead, so you can reach them while filling out a list.
</Callout>

## Live preview

The editor has three modes: **Code**, **Split**, and **Preview**. Split shows your source and the rendered result side by side.

The preview renders your document the way your published site will:

- **Components** render as themselves, not as raw tags
- **Images** resolve from your repository, so \`![Logo](/logo.png)\` shows the file from your \`public\` directory. Relative paths like \`./diagram.png\` resolve against the document's own folder, and images you've uploaded but not yet published appear too
- **Mermaid diagrams** render as diagrams rather than code blocks

If a component is missing or a diagram can't be parsed, the preview says so in place rather than failing, so you can see what went wrong and keep editing.

## Media folders

The **Media** tab browses folders, not just a flat list. Click a folder to open it, and use the breadcrumb to go back.

- **New folder** creates a folder in the folder you're currently viewing
- **Uploads** go into the folder you're viewing, not always the top level
- **Copy path** gives you the path to paste into MDX, relative to your site root

<Callout type="note">
  Git can't store an empty folder, so a new folder holds a hidden placeholder file until you add something to it. You'll never see the placeholder in the Media tab.
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
