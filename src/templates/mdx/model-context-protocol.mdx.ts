export const mcpMdxTemplate = `---
title: "Model Context Protocol"
description: "Connect your Doccupine documentation to AI tools with an MCP server for enhanced AI-powered documentation search."
date: "2026-02-19"
updated: "2026-11-15"
category: "AI & Integrations"
categoryOrder: 3
order: 2
---
# Model Context Protocol

Connect your documentation to AI tools with a hosted MCP server.

Doccupine automatically generates a Model Context Protocol (MCP) server from your documentation. AI tools like Claude, Cursor, and VS Code connect to it and search your docs directly, so they answer questions about your product with accurate, current information.

## Why use MCP

- **Current answers**: AI tools read your latest docs instead of web search results, which may be stale or incomplete.
- **Used when relevant**: The AI searches your docs on its own while it answers, whenever the conversation calls for them.
- **Better matches**: Search finds pages by meaning, not just keywords, without the noise of web search rankings.

## Access your MCP server

Your MCP server is hosted at your documentation URL with the \`/api/mcp\` path. For example, if your documentation is hosted at \`https://example.com\`, your MCP server is available at \`https://example.com/api/mcp\`.

<Callout type="note">
  The \`search_docs\` tool needs the [AI Assistant](/ai-assistant) to be configured,
  because it searches with the same provider. \`get_doc\` and \`list_docs\` work
  without it.
</Callout>

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

Tool calls to \`POST /api/mcp\` are rate limited. When the limit is exceeded, the server responds with \`429 Too Many Requests\` and a \`Retry-After\` header with the number of seconds to wait.

The built-in limit is lightweight and applies to each running server instance. For a strict limit across all instances, configure rate limiting on your hosting platform.

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
- \`language\` (optional): Language code to search on a site with [languages](/languages); defaults to the site's default language
- \`version\` (optional): Version slug to search on a site with [versions](/versions); defaults to the current version

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
- \`language\` (optional): Language code to list on a site with [languages](/languages); defaults to the site's default language
- \`version\` (optional): Version slug to list on a site with [versions](/versions); defaults to the current version

Results carry the page's \`language\` and \`version\` on such a site, and the \`docs://list\` resource lists every language and version at once.

**Example:**

\`\`\`json
{
  "tool": "list_docs",
  "params": {
    "directory": "configuration"
  }
}
\`\`\`

## Keep your docs up to date

Doccupine indexes your docs when you build the site, so searches are fast from the first request. After you change your docs, rebuild or redeploy your site so AI tools see the latest content.

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
        1. Use <Kbd>Mod+Shift+P</Kbd> to open the command palette.
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

| Variable       | Required            | Description                                                  |
| -------------- | ------------------- | ------------------------------------------------------------ |
| \`LLM_PROVIDER\` | For \`search_docs\` | Your LLM provider (\`openai\`, \`anthropic\`, or \`google\`)       |
| \`DOCS_API_KEY\` | No                  | When set, requires Bearer token authentication on \`/api/mcp\` |

See the [AI Assistant documentation](/ai-assistant) for configuration details.

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

- **Use descriptive queries**: More specific queries yield better semantic search results.
- **Monitor index status**: Use the GET endpoint to check if your index is ready before performing searches.
- **Optimize content structure**: Well-structured markdown with clear headings improves search relevance.`;
