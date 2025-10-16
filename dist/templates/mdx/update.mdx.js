export const updateMdxTemplate = `---
title: "Update"
description: "Easily manage and present change history."
date: "2025-01-15"
category: "Components"
categoryOrder: 1
order: 11
---
# Update

Easily manage and present change history.

The \`Update\` component helps you display release notes, version details, and changelogs in a standardized format.

<Update label="Example" description="v0.0.1">
  ## Example entry

  You can include anything here—images, code snippets, or a bullet list of modifications.

  ![Demo Image](https://doccupine.com/demo.png)

  ### Key additions

  - Fully responsive layout
  - Individual anchor for each update
  - Automatic RSS feed entry generation
</Update>

## Update Usage

You can combine multiple \`Update\` components to build complete changelogs.

~~~text
<Update label="Example" description="v0.0.1">
  ## Example entry

  You can include anything here—images, code snippets, or a bullet list of modifications.

  ![Demo Image](https://doccupine.com/demo.png)

  ### Key additions

  - Fully responsive layout
  - Individual anchor for each update
  - Automatic RSS feed entry generation
</Update>
~~~

## Properties

<Field value="label" type="string" required>
  The label of the update.
</Field>

<Field value="description" type="string" required>
  The description of the update.
</Field>`;
