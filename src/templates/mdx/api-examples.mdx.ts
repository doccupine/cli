export const apiExamplesMdxTemplate = `---
title: "API examples"
description: "Show request and response examples beside an API page's content, pinned to the right column on wide screens."
date: "2026-11-25"
category: "Components"
categoryOrder: 1
order: 26
---
# API examples

Show request and response examples beside an API page's content, pinned to the right column on wide screens.

## List projects

Returns the projects the API key can access, newest first. This page shows its examples the way an endpoint page would: on a wide screen they sit in the right column and stay in view while you read, and on a phone they appear right here.

<RequestExample>

\`\`\`bash title="cURL"
curl https://api.example.com/v1/projects \\
  -H "Authorization: Bearer $API_KEY"
\`\`\`

\`\`\`javascript title="JavaScript"
const response = await fetch("https://api.example.com/v1/projects", {
  headers: { Authorization: \`Bearer \${process.env.API_KEY}\` },
});
const projects = await response.json();
\`\`\`

\`\`\`python title="Python"
import os, requests

projects = requests.get(
    "https://api.example.com/v1/projects",
    headers={"Authorization": f"Bearer {os.environ['API_KEY']}"},
).json()
\`\`\`

</RequestExample>

<ResponseExample>

\`\`\`json title="200"
{
  "data": [
    { "id": "prj_8f2k", "name": "Docs", "createdAt": "2026-11-02T09:14:00Z" }
  ],
  "hasMore": false
}
\`\`\`

\`\`\`json title="401"
{
  "error": { "code": "unauthorized", "message": "Missing or invalid API key." }
}
\`\`\`

</ResponseExample>

## API examples usage

Wrap one or more fenced code blocks in \`<RequestExample>\` or \`<ResponseExample>\`. Several code blocks become tabs, labeled by each block's \`title\`, or by its language when it has none.

\`\`\`\`mdx
<RequestExample>

\`\`\`bash title="cURL"
curl https://api.example.com/v1/projects \\
  -H "Authorization: Bearer $API_KEY"
\`\`\`

\`\`\`javascript title="JavaScript"
const response = await fetch("https://api.example.com/v1/projects", {
  headers: { Authorization: \`Bearer \${process.env.API_KEY}\` },
});
const projects = await response.json();
\`\`\`

\`\`\`python title="Python"
import os, requests

projects = requests.get(
    "https://api.example.com/v1/projects",
    headers={"Authorization": f"Bearer {os.environ['API_KEY']}"},
).json()
\`\`\`

</RequestExample>

<ResponseExample>

\`\`\`json title="200"
{
  "data": [
    { "id": "prj_8f2k", "name": "Docs", "createdAt": "2026-11-02T09:14:00Z" }
  ],
  "hasMore": false
}
\`\`\`

\`\`\`json title="401"
{
  "error": { "code": "unauthorized", "message": "Missing or invalid API key." }
}
\`\`\`

</ResponseExample>
\`\`\`\`

Start each block on its own line, and leave a blank line around the code blocks inside it.

## Behavior

- **Wide screens**: every example on the page is gathered into the right column, in the order you wrote them, and stays in view while the page scrolls. The column replaces the "On this page" list, just like a [Side Panel](/side-panel).
- **Phones**: the examples appear inline, where the first one is written.
- **Tabs**: picking a language in one request example picks it in every request example on the site, and the pick is remembered.
- **With a Side Panel**: a page that also has a \`<SidePanel>\` keeps its examples inline, since the panel already holds the right column.

<Callout type="note">
  The [API playground](/api-playground) generates complete endpoint pages from an OpenAPI document. Use these components when you write an API page by hand.
</Callout>

## Properties

Both components take the same properties.

<Field value="children" type="node" required>
  One or more fenced code blocks. Add \`title="cURL"\` after a block's language to name its tab.
</Field>

<Field value="title" type="string">
  The label above the code. Defaults to "Request" or "Response".
</Field>`;
