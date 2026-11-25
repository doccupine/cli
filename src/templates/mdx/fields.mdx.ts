export const fieldsMdxTemplate = `---
title: "Fields"
description: "Configure parameters for your API or SDK documentation."
date: "2026-02-19"
category: "Components"
categoryOrder: 1
order: 24
---
# Fields

Configure parameters for your API or SDK documentation.

Fields allow you to describe both the **inputs** (parameters) and **outputs** (responses) of your API. The main field component is available: \`Field\` for parameters and for responses.

## Fields Usage

Use the \`<Field>\` component to declare API or SDK parameters, or define the return values of an API.

<Field value="param" type="string" required>
  Example definition of a parameter field.
</Field>

\`\`\`html
<Field value="param" type="string" required>
  Example definition of a parameter field.
</Field>
\`\`\`

## Nested fields

When a field is an object, list its own properties in an \`<Accordion>\` inside the field. Inside a field, the accordion becomes a small **Show properties** toggle with the child fields indented under it, and it can nest as deep as your data does.

<Field value="user" type="object" required>
  The account that made the request.

  <Accordion title="Show properties">
    <Field value="id" type="string" required>
      The account's unique ID.
    </Field>

    <Field value="email" type="string">
      The address the account signs in with.
    </Field>

    <Field value="plan" type="object">
      The account's subscription.

      <Accordion title="Show properties">
        <Field value="name" type="string" required>
          \`free\`, \`pro\`, or \`team\`.
        </Field>

        <Field value="renewsAt" type="string">
          When the plan renews, as an ISO 8601 date.
        </Field>
      </Accordion>
    </Field>
  </Accordion>
</Field>

\`\`\`html
<Field value="user" type="object" required>
  The account that made the request.

  <Accordion title="Show properties">
    <Field value="id" type="string" required>
      The account's unique ID.
    </Field>

    <Field value="email" type="string">
      The address the account signs in with.
    </Field>

    <Field value="plan" type="object">
      The account's subscription.

      <Accordion title="Show properties">
        <Field value="name" type="string" required>
          \`free\`, \`pro\`, or \`team\`.
        </Field>

        <Field value="renewsAt" type="string">
          When the plan renews, as an ISO 8601 date.
        </Field>
      </Accordion>
    </Field>
  </Accordion>
</Field>
\`\`\`

The accordion's \`title\` is the toggle's label, so you can write "Show attributes" or "Show 3 properties" instead.

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
