export const mcpMdxTemplate = `---
title: "Model Context Protocol"
description: "Connect your Doccupine documentation to AI tools with an MCP server for enhanced AI-powered documentation search."
date: "2026-02-19"
category: "AI & Integrations"
categoryOrder: 3
order: 2
---
# Model Context Protocol

Connect your documentation to AI tools with a hosted MCP server.

Doccupine automatically generates a Model Context Protocol (MCP) server from your documentation, making your content accessible to AI applications like Claude, Cursor, VS Code, and other MCP-compatible tools. Your MCP server exposes semantic search capabilities, allowing AI tools to query your documentation directly and provide accurate, context-aware answers.

<Callout type="warning">
  Semantic \`search_docs\` requires the [AI Assistant](/ai-assistant) embedding
  provider to be configured. \`get_doc\` and \`list_docs\` can retrieve the generated
  content manifest without an embedding provider.
</Callout>

## About MCP servers

The Model Context Protocol (MCP) is an open protocol that creates standardized connections between AI applications and external services, like documentation. Doccupine generates an MCP server from your documentation, preparing your content for the broader AI ecosystem where any MCP client can connect to your documentation.

Your MCP server exposes search and retrieval tools for AI applications to query your documentation. Your users must connect your MCP server to their preferred AI tools to access your documentation.

### How MCP servers work

When an AI tool has your documentation MCP server connected, the AI tool can search your documentation directly instead of making a generic web search in response to a user's prompt. Your MCP server provides access to all indexed content from your documentation site.

- The LLM can proactively search your documentation while generating a response, not just when explicitly asked.
- The LLM determines when to use the search tool based on the context of the conversation and the relevance of your documentation.
- Each tool call happens during the generation process, so the LLM searches up-to-date information from your documentation to generate its response.

### MCP compared to web search

AI tools can search the web, but MCP provides distinct advantages for documentation.

- **Direct source access**: Web search depends on what search engines have indexed, which may be stale or incomplete. MCP searches your current indexed documentation directly.
- **Integrated workflow**: MCP allows the AI to search during response generation rather than performing a separate web search.
- **Semantic search**: MCP uses vector embeddings for semantic similarity search, providing more relevant results than keyword-based web search.
- **No search noise**: SEO and ranking algorithms influence web search results. MCP goes straight to your documentation content.

## Access your MCP server

Doccupine automatically generates an MCP server for your documentation and hosts it at your documentation URL with the \`/api/mcp\` path. For example, if your documentation is hosted at \`https://example.com\`, your MCP server is available at \`https://example.com/api/mcp\`.

The MCP server provides both a GET endpoint to discover available tools and a POST endpoint to execute tool calls.

### Authentication

You can optionally protect your MCP server with an API key by setting the \`DOCS_API_KEY\` environment variable in your \`.env\` file:

\`\`\`bash
DOCS_API_KEY=your-secret-key
\`\`\`

When \`DOCS_API_KEY\` is set, all requests to \`/api/mcp\` must include an \`Authorization\` header with a Bearer token:

\`\`\`text
Authorization: Bearer your-secret-key
\`\`\`

Requests without a valid token receive a \`401 Unauthorized\` response. When \`DOCS_API_KEY\` is not set, the MCP server follows the site's access mode: it is public on a public site and requires the normal gate session when \`SITE_PASSWORD\` is configured.

<Callout type="note">
  \`DOCS_API_KEY\` applies to \`/api/mcp\` and its \`/mcp\` discovery alias; it does not grant access to the chat, search, or playground APIs. To gate the entire site behind a shared password, see the [Authentication](/authentication) documentation.
</Callout>

### Rate limiting

Tool calls to \`POST /api/mcp\` are rate limited per client IP when the generated app runs on a recognized platform that supplies a trusted client-address header. Unknown or self-hosted proxy setups use one conservative shared bucket instead of trusting spoofable forwarding headers. When the limit is exceeded, the server responds with \`429 Too Many Requests\` and a \`Retry-After\` header indicating how many seconds to wait before retrying.

The included limiter is intentionally lightweight and scoped to each running server instance. For a globally consistent limit across multiple serverless instances or regions, or accurate per-client limits behind a custom reverse proxy, configure rate limiting at your trusted hosting edge or use a shared external rate-limit store.

Requests are bounded before tool execution: request bodies, protocol batches, tool arguments, search result counts, and serialized responses all have fixed limits. A protocol body may contain at most one \`tools/call\` message, so one rate-limited request cannot execute multiple paid tools; batches containing only non-tool protocol messages remain compatible. Internal provider errors are logged on the server and returned to clients as generic failures so deployment details are not exposed.

### API Endpoints

#### GET /api/mcp

Returns information about available tools and the current index status.

**Response:**

\`\`\`json
{
  "tools": [
    {
      "name": "search_docs",
      "description": "Search through the documentation content using semantic search...",
      "inputSchema": { ... }
    },
    ...
  ],
  "index": {
    "ready": true,
    "chunkCount": 150
  }
}
\`\`\`

#### POST /api/mcp

Executes an MCP tool call.

**Request Body:**

\`\`\`json
{
  "tool": "search_docs",
  "params": {
    "query": "how to deploy",
    "limit": 6
  }
}
\`\`\`

**Response:**

\`\`\`json
{
  "content": [
    {
      "path": "app/deployment-and-hosting/page.tsx",
      "uri": "docs://deployment-and-hosting",
      "score": "0.892",
      "text": "Deploy your Doccupine site as a Next.js application..."
    },
    ...
  ]
}
\`\`\`

## Available Tools

Your MCP server exposes three tools for interacting with your documentation:

### search_docs

Search through the documentation content using semantic search. Returns relevant chunks of documentation based on the query using vector embeddings and cosine similarity.

**Parameters:**

- \`query\` (required): The search query to find relevant documentation
- \`limit\` (optional): Maximum number of results to return (default: 6)

**Example:**

\`\`\`json
{
  "tool": "search_docs",
  "params": {
    "query": "how to configure AI assistant",
    "limit": 5
  }
}
\`\`\`

### get_doc

Get the full content of a specific documentation page by its path.

**Parameters:**

- \`path\` (required): The file path to the documentation page (e.g., \`app/getting-started/page.tsx\`)

**Example:**

\`\`\`json
{
  "tool": "get_doc",
  "params": {
    "path": "app/deployment-and-hosting/page.tsx"
  }
}
\`\`\`

### list_docs

List all available documentation pages, optionally filtered by directory.

**Parameters:**

- \`directory\` (optional): Optional directory to filter results (e.g., \`components\`)

**Example:**

\`\`\`json
{
  "tool": "list_docs",
  "params": {
    "directory": "configuration"
  }
}
\`\`\`

## How it works

Doccupine's MCP server uses semantic search powered by vector embeddings to provide accurate, context-aware search results.

### Indexing Process

Doccupine runs this pipeline at build time and ships the resulting vectors with your site, so the server loads a ready-made index instead of re-embedding your docs on every cold start.

1. **Content Manifest**: During generation, Doccupine writes the source MDX and generated API-reference content to \`services/mcp/docs-content.json\`.
2. **Runtime Loading**: The build traces that manifest into the MCP and RAG functions, which read it from one fixed path without inlining the corpus into their JavaScript bundles.
3. **Chunking**: Large documents are split into chunks of approximately 800 characters with 100 character overlap for better context preservation.
4. **Embedding Generation**: Each chunk is converted to a vector embedding using your configured LLM provider's embedding model.
5. **Compaction**: Each vector is truncated to \`LLM_EMBEDDING_DIMS\` dimensions (default 512) and quantized to int8, keeping the index roughly 20x smaller than raw floats so large doc sets don't stall the chat on cold start.
6. **Index Building**: The compact embeddings are written to \`services/mcp/docs-index.json\`, traced into your serverless functions as a data file, and loaded into memory at runtime for fast similarity search.

### Search Process

1. **Query Embedding**: The search query is converted to a vector embedding using the same embedding model.
2. **Similarity Calculation**: Cosine similarity is calculated between the query embedding and all document chunk embeddings.
3. **Ranking**: Results are sorted by similarity score (highest first).
4. **Response**: The top N results (based on the limit parameter) are returned with their paths, URIs, scores, and text content.

<Callout type="note">
  Embeddings are precomputed at build time and shipped as a traced data file, so the server loads the ready-made index into memory on startup instead of re-embedding your docs on every cold start. It only embeds at runtime when the precomputed index is missing or was built with a different provider or model. When you update your documentation, regenerate and rebuild or redeploy your site to refresh both the content manifest and index.
</Callout>

## Use your MCP server

Your users must connect your MCP server to their preferred AI tools.

1. Make your MCP server URL publicly available.
2. Users copy your MCP server URL and add it to their tools.
3. Users access your documentation through their tools.

These are some of the ways you can help your users connect to your MCP server:

<Tabs>
  <TabContent title="Claude">
    <Steps>
      <Step title="Get your MCP server URL.">
        Your MCP server URL is available at \`https://your-domain.com/api/mcp\`.
      </Step>
      <Step title="Publish your MCP server URL for your users.">
        Create a guide for your users that includes your MCP server URL and the steps to connect it to Claude.
        1. Navigate to the [Connectors](https://claude.ai/settings/connectors) page in the Claude settings.
        2. Select **Add custom connector**.
        3. Add your MCP server name and URL.
        4. Select **Add**.
        5. When using Claude, select the attachments button (the plus icon).
        6. Select your MCP server.
      </Step>
    </Steps>
    See the [Model Context Protocol documentation](https://modelcontextprotocol.io/docs/tutorials/use-remote-mcp-server#connecting-to-a-remote-mcp-server) for more details.
  </TabContent>
  <TabContent title="Claude Code">
    <Steps>
      <Step title="Get your MCP server URL.">
        Your MCP server URL is available at \`https://your-domain.com/api/mcp\`.
      </Step>
      <Step title="Publish your MCP server URL for your users.">
        Create a guide for your users that includes your MCP server URL and the command to connect it to Claude Code.
        \`\`\`bash
        claude mcp add --transport http <name> <url>
        \`\`\`
      </Step>
    </Steps>
    See the [Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code/mcp#installing-mcp-servers) for more details.
  </TabContent>
  <TabContent title="Cursor">
    <Steps>
      <Step title="Get your MCP server URL.">
        Your MCP server URL is available at \`https://your-domain.com/api/mcp\`.
      </Step>
      <Step title="Publish your MCP server URL for your users.">
        Create a guide for your users that includes your MCP server URL and the steps to connect it to Cursor.
        1. Use <kbd>Command</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> (<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> on Windows) to open the command palette.
        2. Search for "Open MCP settings".
        3. Select **Add custom MCP**. This opens the \`mcp.json\` file.
        4. In \`mcp.json\`, configure your server:
        \`\`\`json
        {
          "mcpServers": {
            "<your-mcp-server-name>": {
              "url": "<your-mcp-server-url>"
            }
          }
        }
        \`\`\`
      </Step>
    </Steps>
    See the [Cursor documentation](https://docs.cursor.com/en/context/mcp#installing-mcp-servers) for more details.
  </TabContent>
  <TabContent title="VS Code">
    <Steps>
      <Step title="Get your MCP server URL.">
        Your MCP server URL is available at \`https://your-domain.com/api/mcp\`.
      </Step>
      <Step title="Publish your MCP server URL for your users.">
        Create a guide for your users that includes your MCP server URL and the steps to connect it to VS Code.
        1. Create a \`.vscode/mcp.json\` file.
        2. In \`mcp.json\`, configure your server:
        \`\`\`json
        {
          "servers": {
            "<your-mcp-server-name>": {
              "type": "http",
              "url": "<your-mcp-server-url>"
            }
          }
        }
        \`\`\`
      </Step>
    </Steps>
    See the [VS Code documentation](https://code.visualstudio.com/docs/copilot/chat/mcp-servers) for more details.
  </TabContent>
</Tabs>

## Requirements

To use the MCP server, you need to have the AI Assistant configured. The MCP server uses the same LLM configuration for generating embeddings.

| Variable       | Required | Description                                                  |
| -------------- | -------- | ------------------------------------------------------------ |
| \`LLM_PROVIDER\` | Yes      | Your LLM provider (\`openai\`, \`anthropic\`, or \`google\`)       |
| \`DOCS_API_KEY\` | No       | When set, requires Bearer token authentication on \`/api/mcp\` |

<Callout type="warning">
  The \`search_docs\` tool requires an LLM provider for query embeddings. Configure
  the AI Assistant with a valid API key before using semantic search.
</Callout>

See the [AI Assistant documentation](/ai-assistant) for configuration details.

## Content indexing

Doccupine builds a \`services/mcp/docs-content.json\` manifest from your source MDX and generated API-reference pages. The deployed MCP and RAG routes load that traced data file at runtime, so the documentation corpus is not inlined into the server function's JavaScript bundle and the server never scans user-controlled paths.

The manifest is refreshed whenever the CLI generates the site. In watch mode, saved MDX and OpenAPI changes become available to MCP automatically. For a one-time workflow, run \`doccupine build\` or \`doccupine generate\` before building and deploying the generated Next.js app.

## Troubleshooting

### Index not building

If the index is not building, check:

- Your LLM provider is configured correctly in your \`.env\` file
- You have a valid API key set
- \`services/mcp/docs-content.json\` exists in the generated app
- The latest Doccupine generation completed successfully before deployment

### No search results

If searches return no results:

- Verify that your source MDX files are inside the configured \`watchDir\`
- Regenerate the app so \`docs-content.json\` contains the latest pages
- Ensure the index has been built (check the \`index.ready\` status via GET \`/api/mcp\`)

### Slow search performance

Searches use the precomputed in-memory index and are fast. The first search is only slow when the app has to embed your docs at runtime, which happens when the precomputed index is missing or was built with a different provider or model. If performance is consistently slow:

- Confirm the build ran the doc-index precompute step (the \`build\` script runs it before \`next build\`) with a valid API key
- Check your embedding API response times
- Consider reducing the number of documentation pages
- Verify your server has sufficient memory

### Cloudflare blocking MCP requests

If you use Cloudflare as a proxy in front of your documentation site, Cloudflare's bot protection may block server-to-server requests from AI tools like Claude.ai. This can cause MCP connections to fail silently or return errors.

There are two ways to resolve this:

**Option 1: Disable the Cloudflare proxy (simplest)**

In your Cloudflare DNS settings, click the orange cloud icon next to your domain record to switch it to "DNS only" (grey cloud). This disables Cloudflare's proxy and bot protection for your domain, allowing MCP requests to reach your server directly.

**Option 2: Add a Cloudflare WAF exception (keeps your custom domain proxied)**

In Cloudflare dashboard:

1. Go to **Security > WAF**.
2. Click **Create rule**.
3. Set it up as:
   - **Rule name**: Allow MCP API
   - **Field**: URI Path
   - **Operator**: starts with
   - **Value**: \`/api/mcp\`
   - **Action**: Skip -- then check all remaining custom rules, Rate limiting rules, and Bot Fight Mode / Super Bot Fight Mode.
4. Deploy the rule and make sure it is ordered first (above other rules).

<Callout type="warning">
  Also check **Security > Bots** in your Cloudflare dashboard. If "Bot Fight Mode" or "Super Bot Fight Mode" is enabled, that is very likely what is blocking server-to-server requests from AI tools.
</Callout>

## Best practices

- **Keep content up-to-date**: Rebuild or redeploy your site after updating documentation to regenerate the index with fresh content.
- **Use descriptive queries**: More specific queries yield better semantic search results.
- **Monitor index status**: Use the GET endpoint to check if your index is ready before performing searches.
- **Optimize content structure**: Well-structured markdown with clear headings improves search relevance.`;
