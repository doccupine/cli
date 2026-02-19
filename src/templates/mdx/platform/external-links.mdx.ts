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
The Footer Links settings page lets you add external link buttons to your documentation site's footer. These provide quick access to your project's GitHub repository, Discord server, social profiles, and other resources.

## Adding a link
Click **Add Link** and configure:

- **Title** - the display text for the link
- **URL** - the target URL
- **Icon** (optional) - choose from one of the preset icons

## Available icons
You can assign one of these icons to each link:

- GitHub
- Twitter / X
- Discord
- Slack
- LinkedIn
- YouTube
- Website (globe)
- Email
- Docs (book)
- Code
- Package
- RSS
- Chat
- Sponsor (heart)

Leave the icon unset for a text-only link.

## How it works
Link settings are stored in \`links.json\` at the root of your repository:

\`\`\`json
[
  {
    "title": "GitHub",
    "url": "https://github.com/your-org/your-repo",
    "icon": "github"
  },
  {
    "title": "Discord",
    "url": "https://discord.gg/your-invite",
    "icon": "discord"
  }
]
\`\`\``;
