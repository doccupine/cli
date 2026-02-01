export const linksMdxTemplate = `---
title: "Links"
description: "Add static links at the top of the documentation website."
date: "2025-01-15"
category: "Configuration"
categoryOrder: 3
order: 3
---
# Links
Add a row of static links at the top of your documentation. Links open in a new tab and are useful for pointing users to related resources, repositories, or external docs.

## links.json
Place a \`links.json\` at your project root (the same folder where you execute \`npx doccupine\`). When present, Doccupine displays the links in a bar above the main content. You can add as many links as you need.

### Example links.json

\`\`\`json
[
  {
    "title": "OpenClaw",
    "url": "https://github.com/openclaw/openclaw"
  },
  {
    "title": "Doccupine",
    "url": "https://github.com/doccupine/doccupine"
  },
  {
    "title": "OpenAI",
    "url": "https://openai.com/"
  }
]
\`\`\`

### Fields
- **title**: The label shown for the link in the bar.
- **url**: The destination URL. Links open in a new tab with \`target="_blank"\` and \`rel="noopener noreferrer"\`.

## Behavior
- **Empty or missing file**: If \`links.json\` is empty or not present, the links bar is hidden.
- **Order**: Links appear in the same order as in the array.
- **No limit**: Add as many links as you want; the bar scrolls horizontally on smaller screens if needed.`;
