export const treeMdxTemplate = `---
title: "Tree"
description: "Display hierarchical file and folder structures with collapsible nodes."
date: "2026-07-27"
category: "Components"
categoryOrder: 1
order: 9
---
# Tree

Display hierarchical structures like file systems, project directories, or nested content. The tree component supports full keyboard navigation and accessibility features.

Create trees with either a Markdown list or the \`Tree.Folder\` and \`Tree.File\` components. \`<Tree>\` and \`<FileTree>\` are aliases, so either tag works with either syntax.

Use the Markdown list syntax for quick, static trees where every folder with content expands by default. Use the component syntax when you need to control open state per folder with \`defaultOpen\`, mark folders as non-interactive with \`openable\`, or mix files and folders at arbitrary depth.

## Markdown list syntax

Write a nested Markdown list inside \`<FileTree>\` (or \`<Tree>\`) to describe a folder structure. Add a trailing slash to mark a folder, or nest items under it. Folders that contain nested items expand by default.

<FileTree>

- docs/
  - index.mdx
  - guides/
    - configuration.mdx
- docs.config.ts

</FileTree>

\`\`\`mdx
<FileTree>

- docs/
  - index.mdx
  - guides/
    - configuration.mdx
- docs.config.ts

</FileTree>
\`\`\`

<Callout type="note">
  Leave a blank line after the opening tag and before the closing tag so the list parses as Markdown. Names strip inline formatting like \`code\`, **bold**, or _italic_.
</Callout>

## Basic tree

Build trees with the \`Tree.Folder\` and \`Tree.File\` components when you want per-folder control. Folders start closed unless you set \`defaultOpen\`.

<Tree>
  <Tree.Folder name="app" defaultOpen>
    <Tree.File name="layout.tsx" />
    <Tree.File name="page.tsx" />
    <Tree.File name="global.css" />
  </Tree.Folder>
  <Tree.Folder name="lib">
    <Tree.File name="utils.ts" />
    <Tree.File name="db.ts" />
  </Tree.Folder>
  <Tree.File name="package.json" />
  <Tree.File name="tsconfig.json" />
</Tree>

\`\`\`mdx
<Tree>
  <Tree.Folder name="app" defaultOpen>
    <Tree.File name="layout.tsx" />
    <Tree.File name="page.tsx" />
    <Tree.File name="global.css" />
  </Tree.Folder>
  <Tree.Folder name="lib">
    <Tree.File name="utils.ts" />
    <Tree.File name="db.ts" />
  </Tree.Folder>
  <Tree.File name="package.json" />
  <Tree.File name="tsconfig.json" />
</Tree>
\`\`\`

## Nested folders

Create deeply nested structures by nesting \`Tree.Folder\` components within each other.

<Tree>
  <Tree.Folder name="app" defaultOpen>
    <Tree.File name="layout.tsx" />
    <Tree.File name="page.tsx" />
    <Tree.Folder name="api" defaultOpen>
      <Tree.Folder name="auth">
        <Tree.File name="route.ts" />
      </Tree.Folder>
      <Tree.File name="route.ts" />
    </Tree.Folder>
    <Tree.Folder name="components">
      <Tree.File name="button.tsx" />
      <Tree.File name="dialog.tsx" />
      <Tree.File name="tabs.tsx" />
    </Tree.Folder>
  </Tree.Folder>
  <Tree.File name="package.json" />
</Tree>

\`\`\`mdx
<Tree>
  <Tree.Folder name="app" defaultOpen>
    <Tree.File name="layout.tsx" />
    <Tree.File name="page.tsx" />
    <Tree.Folder name="api" defaultOpen>
      <Tree.Folder name="auth">
        <Tree.File name="route.ts" />
      </Tree.Folder>
      <Tree.File name="route.ts" />
    </Tree.Folder>
    <Tree.Folder name="components">
      <Tree.File name="button.tsx" />
      <Tree.File name="dialog.tsx" />
      <Tree.File name="tabs.tsx" />
    </Tree.Folder>
  </Tree.Folder>
  <Tree.File name="package.json" />
</Tree>
\`\`\`

## Keyboard navigation

Click a tree to focus it, then navigate with the keyboard:

- **Arrow up/down**: Move through visible items.
- **Arrow right**: Expand a closed folder, or move to the first child of an open folder.
- **Arrow left**: Collapse an open folder, or move to the parent folder.
- **Home**: Jump to the first item in the tree.
- **End**: Jump to the last visible item in the tree.
- **Enter/Space**: Toggle a folder open or closed.
- **Asterisk**: Expand all sibling folders at the current level.
- **Type-ahead search**: Type characters to jump to the next item that starts with them.

## Properties

### Tree.Folder

<Field value="name" type="string" required>
  The name of the folder displayed in the tree.
</Field>

<Field value="defaultOpen" type="boolean">
  Whether the folder expands by default. Defaults to \`false\`.
</Field>

<Field value="openable" type="boolean">
  Whether readers can open and close the folder. Set to \`false\` for a non-interactive folder that stays in its \`defaultOpen\` state. Defaults to \`true\`.
</Field>

### Tree.File

<Field value="name" type="string" required>
  The name of the file displayed in the tree.
</Field>`;
