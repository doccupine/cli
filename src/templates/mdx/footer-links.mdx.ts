export const footerLinksMdxTemplate = `---
title: "Footer Links"
description: "Add static links at the bottom of the documentation pages."
date: "2026-02-19"
category: "Configuration"
categoryOrder: 3
order: 4
---
# Footer Links
Add a row of static links at the bottom of your documentation pages, just above the footer. Links open in a new tab and are useful for pointing users to related resources, repositories, or external docs.

## links.json
Place a \`links.json\` at your project root (the same folder where you execute \`npx doccupine\`). When present, Doccupine displays the links at the bottom of each page. You can add as many links as you need.

### Example links.json

\`\`\`json
[
  {
    "title": "Back to Home",
    "url": "https://doccupine.com",
    "icon": "arrow-left"
  },
  {
    "title": "GitHub",
    "url": "https://github.com/doccupine",
    "icon": "github"
  },
  {
    "title": "Discord",
    "url": "https://discord.gg/E9BufYGPhG",
    "icon": "message-circle"
  }
]
\`\`\`

### Fields
- **title**: The label shown for the link.
- **url**: The destination URL. Links open in a new tab with \`target="_blank"\` and \`rel="noopener noreferrer"\`.
- **icon**: The icon to display next to the label. Icons are from [Lucide](https://lucide.dev/).

## Behavior
- **Empty or missing file**: If \`links.json\` is empty or not present, the footer links are hidden.
- **Order**: Links appear in the same order as in the array.
- **No limit**: Add as many links as you want; the row scrolls horizontally on smaller screens if needed.`;
