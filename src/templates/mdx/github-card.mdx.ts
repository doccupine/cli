export const githubCardMdxTemplate = `---
title: "GitHub card"
description: "Link to a GitHub repository with a card that shows its description, stars, and forks."
date: "2026-11-25"
category: "Components"
categoryOrder: 1
order: 14
---
# GitHub card

Link to a GitHub repository with a card that shows its description, stars, and forks.

<GitHubCard repo="doccupine/cli" />

## GitHub card usage

Pass the repository as \`owner/name\`.

\`\`\`html
<GitHubCard repo="doccupine/cli" />
\`\`\`

Cards sit side by side in [columns](/columns).

\`\`\`html
<Columns cols={2}>
  <GitHubCard repo="vercel/next.js" />
  <GitHubCard repo="facebook/react" />
</Columns>
\`\`\`

<Columns cols={2}>
  <GitHubCard repo="vercel/next.js" />
  <GitHubCard repo="facebook/react" />
</Columns>

## Where the numbers come from

The description and the counts are fetched from GitHub's API while your site builds, never from the reader's browser. They are kept for a day: where your host supports refreshing static pages (Vercel does), a page with a card is rebuilt at most once a day with fresh numbers.

When GitHub cannot be reached, answers slowly (after five seconds), or refuses the request, the card still shows the repository name and links to it, without the counts, and the build carries on.

### GitHub token

Without a token, GitHub allows 60 API requests an hour from one address, which a build with many cards can use up. Set a \`GITHUB_TOKEN\` environment variable to raise the limit:

\`\`\`bash
GITHUB_TOKEN=github_pat_...
\`\`\`

A fine-grained token with no extra permissions is enough for public repositories. The token is only read on the server while pages build, and is never sent to readers.

## Properties

<Field value="repo" type="string" required>
  The repository, as \`owner/name\`. A value that is not a valid GitHub repository name shows no card, with a warning in the build log.
</Field>`;
