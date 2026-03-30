export const platformExternalLinksMdxTemplate = `---
title: "External Links"
description: "Add quick-access link buttons to your site's footer for GitHub, Discord, and other external resources."
date: "2026-02-19"
category: "Configuration"
categoryOrder: 2
order: 5
section: "Platform"
---
# External Links
The External Links settings page lets you add external link buttons to your documentation site's footer. These provide quick access to your project's GitHub repository, Discord server, social profiles, and other resources.

## Adding a link
Click **Add Link** and configure:

- **Icon** (optional) - search and pick from any [Lucide](https://lucide.dev/) icon
- **Title** - the display text for the link
- **URL** - the target URL

## Choosing an icon
The icon picker lets you search through the full [Lucide](https://lucide.dev/) icon set. Type a keyword to filter (e.g. "github", "mail", "globe") and click to select.

Leave the icon unset for a text-only link.

If you edit \`links.json\` directly, use Lucide icon names in kebab-case (e.g. \`github\`, \`message-circle\`, \`heart\`).

## How it works
Link settings are stored in \`links.json\` at the root of your repository:

\`\`\`json
[
  {
    "title": "GitHub",
    "url": "https://github.com/your-org/your-repo",
    "icon": "git-branch"
  },
  {
    "title": "Discord",
    "url": "https://discord.gg/your-invite",
    "icon": "discord"
  }
]
\`\`\``;
