export const platformApiPlaygroundMdxTemplate = `---
title: "API Playground"
description: "Register an OpenAPI spec and turn it into an interactive API reference with a live request playground."
date: "2026-07-26"
updated: "2026-07-30"
category: "AI & Integrations"
categoryOrder: 3
order: 2
section: "Platform"
---
# API Playground

The API Playground settings page turns an OpenAPI spec in your repository into an interactive API reference. Any page can embed a live "try it" playground for a single endpoint, and you can generate a full reference with one page per operation.

## Registering a spec

Open the **API Playground** settings page and choose your OpenAPI file with the **OpenAPI spec file** picker. It searches your repository for YAML and JSON files - start typing to filter, or type a path to use one that is not listed yet. The path is stored, relative to \`doccupine.json\`, as the \`openapi\` field:

\`\`\`json
{
  "openapi": "openapi.yaml"
}
\`\`\`

Press **Save Configuration**, then commit the change. Both YAML and JSON specs (OpenAPI 3.0 and 3.1) are supported.

> For multiple specs, edit the \`openapi\` array in \`doccupine.json\` directly - the settings page manages a single spec.

<Callout type="warning">
  The spec has to be in the repository for the site to build - a configured \`openapi\` path that resolves to nothing stops the whole build, not just the API pages. Publish the config change and the spec file together, and if you later move or delete a spec, update \`doccupine.json\` in the same change set. Doccupine [checks this before publishing](/platform/publishing) rather than letting the deploy fail.
</Callout>

## Embedding a playground on a page

Add an \`openapi\` field to any page's frontmatter to render the interactive playground for that operation above the page content. The value is either \`"METHOD /path"\` or an \`operationId\`:

\`\`\`mdx
---
title: "Create a post"
openapi: "POST /posts"
---

Posts are created for a user. The playground above is live - fill in the fields and press **Send**.
\`\`\`

The playground resolves the operation from your configured spec, so its parameters, request body, and responses always match the source of truth.

## Generating an API reference

Press **Generate API pages** to create one page per operation from your spec. Each generated page:

- carries an \`openapi:\` frontmatter reference, so it renders the live playground,
- is placed under an **API Reference** section, grouped by tag,
- documents every parameter, the request body, and each response,
- is staged as a pending change for you to review and commit.

Alongside them you get an **API Reference** landing page at the section root, listing every endpoint as a card with its method and path. It is a normal page like any other, so you can edit it, add an introduction, or delete it if you would rather write your own.

Generation reads the committed spec, so save and commit your configuration first. Endpoints are shown with a colored HTTP-method badge so they are easy to scan in the file list.

## Sending requests

Inside the playground, **Try it** opens the request editor. Fill in parameters, authentication, and the body, then press **Send**:

- **Proxy** mode runs the request from the server, so endpoints that block cross-origin browser calls still work. Requests are restricted to the servers declared in your spec.
- **Direct** mode calls the API straight from the browser.

Secrets you enter are never logged, and appear as \`<YOUR_CREDENTIALS>\` in the generated code snippets unless you choose to reveal them.
`;
