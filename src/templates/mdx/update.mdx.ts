export const updateMdxTemplate = `---
title: "Update"
description: "Easily manage and present change history."
date: "2026-02-19"
category: "Components"
categoryOrder: 1
order: 21
rss: true
---
# Update

Easily manage and present change history.

The \`Update\` component helps you display release notes, version details, and changelogs in a standardized format.

Each \`Update\` label is added to the "On this page" sidebar and gets its own anchor, so you can link directly to a specific entry.

<Update label="v0.0.1" description="Example">
  ## Example entry

  You can include anything here - images, code snippets, or a bullet list of modifications.

  ![Demo Image](https://docs.doccupine.com/demo.png)

  ### Key additions

  - Fully responsive layout
  - Individual anchor for each update
  - Automatic RSS feed entry generation
</Update>

## Update Usage

You can combine multiple \`Update\` components to build complete changelogs.

\`\`\`html
<Update label="v0.0.1" description="Example">
  ## Example entry

  You can include anything here - images, code snippets, or a bullet list of modifications.

  ![Demo Image](https://docs.doccupine.com/demo.png)

  ### Key additions

  - Fully responsive layout
  - Individual anchor for each update
  - Automatic RSS feed entry generation
</Update>
\`\`\`

## Subscribable changelogs

Every page that contains at least one \`Update\` component automatically publishes an RSS feed at its page URL with \`/rss.xml\` appended. For example, this page's feed lives at \`/update/rss.xml\`.

Each \`Update\` becomes a feed entry: the \`label\` is the entry title, and the entry link deep-links to the update's anchor on the page. New entries reach subscribers as soon as the site is rebuilt with new \`Update\` components.

Feed entries contain pure Markdown only. They exclude components, code, and HTML elements. Use the \`rss\` property to provide alternative text for feed readers when an update consists mostly of excluded content:

\`\`\`html
<Update label="v0.0.2" rss="Added dark mode and fixed sidebar links.">
  <Frame>![Dark mode](https://docs.doccupine.com/demo.png)</Frame>
</Update>
\`\`\`

The feed's channel title and description come from the page frontmatter, falling back to the site name and description from \`config.json\`. RSS feeds are only available on public documentation - password-protected sites do not expose them.

RSS feeds can integrate with Slack, email, or other subscription tools to notify readers of changes. Some options include:

- [Slack](https://slack.com/help/articles/218688467-Add-RSS-feeds-to-Slack)
- [Email](https://zapier.com/apps/email/integrations/rss/1441/send-new-rss-feed-entries-via-email) via Zapier
- Discord bots like [Readybot](https://readybot.io)

## RSS button

To make the feed discoverable, add \`rss: true\` to the page frontmatter. This displays an RSS button at the top of the page that links to the feed - this page shows one. The button only appears when the page actually contains \`Update\` components.

\`\`\`yaml
---
rss: true
---
\`\`\`

## Properties

<Field value="label" type="string" required>
  The label of the update. It also appears in the page's "On this page"
  navigation, acts as a deep-link anchor to this entry, and becomes the entry
  title in the page's RSS feed.
</Field>

<Field value="description" type="string">
  An optional description for the update. When omitted, no description is shown.
</Field>

<Field value="rss" type="string">
  Alternative pure-Markdown text for this entry in the page's RSS feed. When
  omitted, the feed uses the entry content with components, code, and HTML
  removed. Never rendered on the page.
</Field>

<Field value="children" type="node" required>
  The content of the update.
</Field>`;
