export const mcpMdxTemplate = `---
title: "Model Context Protocol"
description: "Connect your Doccupine documentation to AI tools with an MCP server for enhanced AI-powered documentation search."
date: "2025-01-24"
category: "Configuration"
categoryOrder: 3
order: 9
---
# Model Context Protocol
Connect your documentation to AI tools with a hosted MCP server.

Doccupine automatically generates a Model Context Protocol (MCP) server from your documentation, making your content accessible to AI applications like Claude, Cursor, VS Code, and other MCP-compatible tools. Your MCP server exposes semantic search capabilities, allowing AI tools to query your documentation directly and provide accuraxte, context-aware answers.

## About MCP servers

The Model Context Protocol (MCP) is an open protocol that creates standardized connections between AI applications and external services, like documentation. Doccupine generates an MCP server from your documentation, preparing your content for the broader AI ecosystem where any MCP client can connect to your documentation.

Your MCP server exposes search and retrieval tools for AI applications to query your documentation. Your users must connect your MCP server to their preferred AI tools to access your documentation.

### How MCP servers work

When an AI tool has your documentation MCP server connected, the AI tool can search your documentation directly instead of making a generic web search in response to a user's prompt. Your MCP server provides access to all indexed content from your documentation site.

* The LLM can proactively search your documentation while generating a response, not just when explicitly asked.
* The LLM determines when to use the search tool based on the context of the conversation and the relevance of your documentation.
* Each tool call happens during the generation process, so the LLM searches up-to-date information from your documentation to generate its response.

### MCP compared to web search

AI tools can search the web, but MCP provides distinct advantages for documentation.

* **Direct source access**: Web search depends on what search engines have indexed, which may be stale or incomplete. MCP searches your current indexed documentation directly.
* **Integrated workflow**: MCP allows the AI to search during response generation rather than performing a separate web search.
* **Semantic search**: MCP uses vector embeddings for semantic similarity search, providing more relevant results than keyword-based web search.
* **No search noise**: SEO and ranking algorithms influence web search results. MCP goes straight to your documentation content.

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

Requests without a valid token receive a \`401 Unauthorized\` response. When \`DOCS_API_KEY\` is not set, the MCP server is publicly accessible with no authentication required.

<Callout type="note">
  Authentication only applies to the \`/api/mcp\` endpoint. The \`/api/rag\` endpoint used by the built-in AI Assistant chat is not affected by this setting.
</Callout>

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
      "path": "app/deployment/page.tsx",
      "uri": "docs://deployment",
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
    "path": "app/deployment/page.tsx"
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

1. **Document Discovery**: The server scans your \`app/\` directory for all \`page.tsx\`, \`page.ts\`, \`page.jsx\`, and \`page.js\` files.
2. **Content Extraction**: It extracts content from \`const content =\` declarations in your page files.
3. **Chunking**: Large documents are split into chunks of approximately 1500 characters with 200 character overlap for better context preservation.
4. **Embedding Generation**: Each chunk is converted to a vector embedding using your configured LLM provider's embedding model.
5. **Index Building**: All embeddings are stored in memory for fast similarity search.

### Search Process

1. **Query Embedding**: The search query is converted to a vector embedding using the same embedding model.
2. **Similarity Calculation**: Cosine similarity is calculated between the query embedding and all document chunk embeddings.
3. **Ranking**: Results are sorted by similarity score (highest first).
4. **Response**: The top N results (based on the limit parameter) are returned with their paths, URIs, scores, and text content.

<Callout type="note">
  The index is built automatically when the first search is performed. The index is stored in memory and persists for the lifetime of the server process. If you update your documentation, restart the server to rebuild the index.
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

| Variable | Required | Description |
|---|---|---|
| \`LLM_PROVIDER\` | Yes | Your LLM provider (\`openai\`, \`anthropic\`, or \`google\`) |
| \`DOCS_API_KEY\` | No | When set, requires Bearer token authentication on \`/api/mcp\` |

<Callout type="warning">
  The MCP server requires an LLM provider to be configured for generating embeddings. Make sure you have set up your AI Assistant with a valid API key before using the MCP server.
</Callout>

See the [AI Assistant documentation](/ai-assistant) for configuration details.

## Content indexing

Your MCP server searches content extracted from your page files. The server automatically discovers and indexes all \`page.tsx\`, \`page.ts\`, \`page.jsx\`, and \`page.js\` files in your \`app/\` directory.

### Content extraction

The server extracts content from \`const content =\` declarations in your page files. Make sure your documentation pages export a \`content\` constant with your markdown or MDX content.

**Example:**
\`\`\`tsx
export const content = \`
# Getting Started

Welcome to the documentation...
\`;
\`\`\`

### Excluded directories

The following directories are automatically excluded from indexing:
- \`node_modules\`
- \`.next\`
- \`.git\`
- \`api\`

## Troubleshooting

### Index not building

If the index is not building, check:
- Your LLM provider is configured correctly in your \`.env\` file
- You have a valid API key set
- Your documentation pages export a \`content\` constant

### No search results

If searches return no results:
- Verify that your documentation pages are in the \`app/\` directory
- Check that your pages export a \`content\` constant
- Ensure the index has been built (check the \`index.ready\` status via GET \`/api/mcp\`)

### Slow search performance

The first search may be slower as it builds the index. Subsequent searches are fast as they use the in-memory index. If performance is consistently slow:
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

* **Keep content up-to-date**: Restart your server after updating documentation to rebuild the index with fresh content.
* **Use descriptive queries**: More specific queries yield better semantic search results.
* **Monitor index status**: Use the GET endpoint to check if your index is ready before performing searches.
* **Optimize content structure**: Well-structured markdown with clear headings improves search relevance.`;
