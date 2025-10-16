export const columnsMdxTemplate = `---
title: "Columns"
description: "Columns are used to organize content in a grid-like structure."
date: "2025-01-15"
category: "Components"
categoryOrder: 1
order: 12
---
# Columns

Arrange multiple cards neatly in a side-by-side grid layout.

The \`Columns\` component helps you organize several \`Card\` elements into a visually balanced grid. By choosing how many columns you want, you can control the layout and spacing of your cards.

## Columns Usage

You can use the \`Columns\` component to create a grid of cards with a specified number of columns.

\`\`\`jsx
<Columns cols={2}>
  <Card title="Getting Started" icon="rocket">
    Kick off your project using our easy quickstart guide.
  </Card>

  <Card title="API Reference" icon="code">
    Browse all endpoints, parameters, and code examples for your API integration.
  </Card>
</Columns>
\`\`\`

<Columns cols={2}>
  <Card title="Getting Started" icon="rocket">
    Kick off your project using our easy quickstart guide.
  </Card>

  <Card title="API Reference" icon="code">
    Browse all endpoints, parameters, and code examples for your API integration.
  </Card>
</Columns>


## Properties

<Field value="cols" type="number" required>
  The number of columns in the grid.
</Field>`;
