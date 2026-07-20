export const updateMdxTemplate = `---
title: "Update"
description: "Easily manage and present change history."
date: "2026-02-19"
category: "Components"
categoryOrder: 1
order: 12
---
# Update

Easily manage and present change history.

The \`Update\` component helps you display release notes, version details, and changelogs in a standardized format.

Each \`Update\` label is added to the "On this page" sidebar and gets its own anchor, so you can link directly to a specific entry.

<Update label="v0.0.1" description="Example">
  ## Example entry

  You can include anything here - images, code snippets, or a bullet list of modifications.

  ![Demo Image](https://docs.doccupine.com/demo.png)

  ### Key additions

  - Fully responsive layout
  - Individual anchor for each update
  - Automatic RSS feed entry generation
</Update>

## Update Usage

You can combine multiple \`Update\` components to build complete changelogs.

\`\`\`html
<Update label="v0.0.1" description="Example">
  ## Example entry

  You can include anything here - images, code snippets, or a bullet list of modifications.

  ![Demo Image](https://docs.doccupine.com/demo.png)

  ### Key additions

  - Fully responsive layout
  - Individual anchor for each update
  - Automatic RSS feed entry generation
</Update>
\`\`\`

## Properties

<Field value="label" type="string" required>
  The label of the update. It also appears in the page's "On this page"
  navigation and acts as a deep-link anchor to this entry.
</Field>

<Field value="description" type="string">
  An optional description for the update. When omitted, no description is shown.
</Field>

<Field value="children" type="node" required>
  The content of the update.
</Field>`;
