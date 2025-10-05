export const listTableMdxTemplate = `---
title: "Lists and tables"
description: "This is my first Doccupine project"
date: "2025-01-15"
category: "Components"
categoryOrder: 0
order: 2
---
# Lists and Tables

Present structured information using lists or tables.

## Lists

Markdown supports both *ordered* and *unordered* lists, as well as nested list structures.

### Ordered List

Start each item with a number followed by a period to create an ordered list.

\`\`\`md
1. First item
2. Second item
3. Third item
4. Fourth item
\`\`\`

1. First item
2. Second item
3. Third item
4. Fourth item


### Unordered List

Use dashes (\`-\`), asterisks (\`*\`), or plus signs (\`+\`) before each item for unordered lists.

\`\`\`md
- First item
- Second item
- Third item
- Fourth item
\`\`\`

- First item
- Second item
- Third item
- Fourth item

### Nested List

Indent items under another to create nested lists.

\`\`\`md
- First item
- Second item  
  - Additional item  
  - Additional item  
- Third item
\`\`\`

- First item
- Second item  
  - Additional item  
  - Additional item  
- Third item

## Tables

Markdown tables use pipes (\`|\`) to separate columns and hyphens (\`---\`) to define the header row. Place a pipe at the start and end of each row for better compatibility.

\`\`\`md
| Property | Description                            |
| -------- | -------------------------------------- |
| Name     | Full name of the user                  |
| Age      | Age in years                           |
| Joined   | Indicates if user joined the community |
\`\`\`


| Property | Description                            |
| -------- | -------------------------------------- |
| Name     | Full name of the user                  |
| Age      | Age in years                           |
| Joined   | Indicates if user joined the community |`;
