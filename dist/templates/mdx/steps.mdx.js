export const stepsMdxTemplate = `---
title: "Steps"
description: "Guide readers step-by-step using the Steps component."
date: "2025-01-15"
category: "Components"
categoryOrder: 1
order: 13
---

# Steps

Guide readers step-by-step using the Steps component.

The Steps component is perfect for organizing procedures or workflows in a clear sequence. Include as many individual steps as necessary to outline your process.

## Steps Usage

You can use the \`Steps\` component to create a step-by-step guide. Each step is represented by a \`Step\` component, which includes a title and content.

\`\`\`jsx
  <Steps>
  <Step title="Step 1">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
  </Step>

  <Step title="Step 2">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
  </Step>

  <Step title="Step 3">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
  </Step>
</Steps>
\`\`\`

<Steps>
  <Step title="Step 1">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
  </Step>

  <Step title="Step 2">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
  </Step>

  <Step title="Step 3">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
  </Step>
</Steps>


## Properties

<Field value="title" type="string" required>
  The title of the step.
</Field>

<Field value="children" type="node" required>
  The content of the step.
</Field>
`;
