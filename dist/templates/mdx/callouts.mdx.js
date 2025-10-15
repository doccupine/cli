export const calloutsMdxTemplate = `---
title: "Callouts"
description: "Make your content stand out by using callouts for extra emphasis."
date: "2025-01-15"
category: "Components"
categoryOrder: 1
order: 7
---
# Callouts
Make your content stand out by using callouts for extra emphasis.

You can format them as Note, Warning, Info, Danger and Success.

## Callouts Usage
You can use the Callouts component directly within your MDX files without any import. The following example shows a basic usage:

~~~mdx
<Callout type="note">
  This is a note callout
</Callout>

<Callout type="warning">
  This is a warning callout
</Callout>

<Callout type="info">
  This is an info callout
</Callout>

<Callout type="danger">
  This is a danger callout
</Callout>

<Callout type="success">
 This is a success callout
</Callout>
~~~

<Callout type="note">
  This is a note callout
</Callout>

<Callout type="warning">
  This is a warning callout
</Callout>

<Callout type="info">
  This is an info callout
</Callout>

<Callout type="danger">
  This is a danger callout
</Callout>

<Callout type="success">
 This is a success callout
</Callout>

## Properties

<Field value="type" type="string" required>
  The type of the callout.
</Field>

<Field value="children" type="string" required>
  The content of the callout.
</Field>`;
