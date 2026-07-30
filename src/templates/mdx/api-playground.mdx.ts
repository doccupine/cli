export const apiPlaygroundMdxTemplate = `---
title: "API Playground"
description: "Turn an OpenAPI document into an interactive API reference where readers send real requests and see live responses, right inside your docs."
date: "2026-07-25"
category: "Components"
categoryOrder: 1
order: 20
---
# API Playground

Point Doccupine at an OpenAPI document and it generates a complete, interactive API reference: one page per endpoint, grouped by tag in the sidebar, each with a "Send request" panel that makes real calls and shows the live response - plus copy-pasteable code snippets.

<Callout type="note">
The playground is driven entirely by your OpenAPI document. There is nothing to wire up by hand - add one line of config and every endpoint becomes a documented, runnable page.
</Callout>

## Try it

Press **Try it** below to open the playground, tweak the request body, and send a real request to a live API - right from these docs.

<ApiPlaygroundDemo />

## Enabling the playground

<Steps>
  <Step title="Add an openapi path to doccupine.json.">
    Point at a local \`.json\`, \`.yaml\`, or \`.yml\` OpenAPI 3.0 or 3.1 document.

\`\`\`json
{
  "watchDir": "docs",
  "outputDir": "nextjs-app",
  "openapi": "openapi.yaml"
}
\`\`\`
  </Step>
  <Step title="Run Doccupine.">
    On the next build (or live, while watching) Doccupine parses the document and writes an endpoint page for each operation. Local \`$ref\` files must stay inside the configured spec's directory, use \`.json\`, \`.yaml\`, or \`.yml\`, and cannot be dotfiles or live inside dot-directories.
  </Step>
  <Step title="Open the API Reference section.">
    Endpoints appear in the sidebar grouped by their OpenAPI tag. Editing the spec regenerates the pages automatically.
  </Step>
</Steps>

## Example spec

Do not have a document yet? This \`openapi.yaml\` points at [JSONPlaceholder](https://jsonplaceholder.typicode.com), a free public test API, so it works end to end - save it, set \`openapi\` to it, and the generated pages can send real requests:

\`\`\`yaml
openapi: 3.1.0
info:
  title: JSONPlaceholder
  version: 1.0.0
servers:
  - url: https://jsonplaceholder.typicode.com
tags:
  - name: Todos
  - name: Posts
paths:
  /todos/{id}:
    get:
      summary: Get a to-do
      tags: [Todos]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        "200":
          description: Just a demo of a to-do item
  /posts:
    post:
      summary: Create a post
      tags: [Posts]
      requestBody:
        required: true
        content:
          application/json:
            example:
              title: Hello
              body: Sent from the docs
              userId: 1
      responses:
        "201":
          description: Just a demo of the created post
\`\`\`

Each part maps to something in the playground: \`servers\` sets the request target - and the only host the proxy will call - \`tags\` group endpoints in the sidebar, and \`parameters\` and \`requestBody\` become the inputs (adding a \`securitySchemes\` entry would produce authentication fields). Doccupine reads OpenAPI 3.0 and 3.1; see the [OpenAPI specification](https://spec.openapis.org) for the full format.

## What gets generated

The generated \`/api-reference\` index lists every operation with a direct link, grouped by API and tag. Each operation also gets its own page under \`/api-reference/{tag}/{operation}\`, showing:

<Field value="Parameters" type="path, query, header, cookie">
Each parameter is rendered with its name, type, and whether it is required, grouped into a collapsible section with an input to fill in.
</Field>

<Field value="Request body" type="editable">
A JSON editor prefilled from the schema's example, ready to tweak and send.
</Field>

<Field value="Authentication" type="from securitySchemes">
Inputs for the endpoint's security schemes - API keys, bearer tokens, or basic auth - generated from the document.
</Field>

<Field value="Response" type="live">
The real status, timing, and body from your API, rendered to match its content type.
</Field>

## Embedding a single endpoint

To mix prose and a live endpoint on a hand-written page, reference an operation from the page's frontmatter with \`openapi\`. Use \`METHOD /path\` or an \`operationId\`:

\`\`\`mdx
---
title: "Create a post"
openapi: "POST /posts"
---

Posts are created for a user. The playground above is fully live - fill in the
body and send a real request.
\`\`\`

Doccupine renders that endpoint's playground above your prose. If the reference does not match any operation in your document, the page still renders its prose and a warning is logged.

## Running requests

Requests run one of two ways, and readers can switch between them:

<Callout type="note">
**Proxy (default).** The request is forwarded server-side, so it works even when the target API blocks cross-origin browser calls. **Direct.** The browser calls the API itself - useful when the API allows CORS and you want requests to never leave the reader's machine.
</Callout>

The proxy is deliberately locked down. It only forwards to servers declared in your OpenAPI document and refuses private, internal, metadata, and reserved network addresses, including IPv4 destinations represented through IPv6 translation ranges. An explicitly declared loopback server such as \`http://localhost:4000\` is available only outside production for local development and tests; production always blocks loopback and every other private target even when the spec declares one. Request URLs, headers, and bodies are never logged, so API keys a reader enters are not written anywhere. On a [password-protected site](/authentication), the proxy also requires the visitor's unlocked session, so it cannot be called anonymously.

Proxy requests are rate limited per trusted client address on recognized hosting platforms. Unknown and self-hosted proxy setups share one fallback bucket rather than trusting spoofable forwarding headers; use your trusted edge or a shared rate-limit store when those deployments need accurate per-client limits.

<Callout type="warning">
Keys and tokens a reader types are used only to make the request. Turn on "Show secrets" to reveal them in the generated code snippets; they are redacted by default.
</Callout>

## Responses and snippets

Responses render to match their type: images and video play inline, everything else is shown as a formatted, syntax-highlighted body. Alongside the response, the playground generates ready-to-run **cURL**, **JavaScript**, and **Python** snippets for the exact request you built.

## Documenting more than one API

Pass an array to document several APIs at once. Each spec becomes its own namespaced section:

\`\`\`json
{
  "openapi": [
    { "name": "public", "file": "specs/public.yaml" },
    { "name": "admin", "file": "specs/admin.yaml" }
  ]
}
\`\`\`
`;
