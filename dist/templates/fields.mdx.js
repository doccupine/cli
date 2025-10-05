export const fieldsMdxTemplate = `---
title: "Fields"
description: "This is my first Doccupine project"
date: "2025-01-15"
category: "Components"
categoryOrder: 0
order: 9
---
# Fields

Configure parameters for your API or SDK documentation.

Fields allow you to describe both the **inputs** (parameters) and **outputs** (responses) of your API. The main field component is available: \`Field\` for parameters and for responses.

## Fields Usage

Use the \`<Field>\` component to declare API or SDK parameters, or define the return values of an API.

<Field value="param" type="string" required>
  Example definition of a parameter field.
</Field>


\`\`\`text
<Field value="param" type="string" required>
  Example definition of a parameter field.
</Field>
\`\`\`

## Properties

<Field value="value" type="string" required>
  The name of the field.
</Field>

<Field value="type" type="string" required>
  The type of the field.
</Field>

<Field value="required" type="boolean">
  Whether the field is required.
</Field>`;
