export const platformMcpMdxTemplate = `---
title: "MCP"
description: "Connect external AI apps like Claude and Cursor to your documentation with a Model Context Protocol server, and protect it with an API key."
date: "2026-07-12"
category: "Configuration"
categoryOrder: 2
order: 7
section: "Platform"
---
# MCP

The **MCP** settings page lets external AI applications connect to your documentation through a hosted Model Context Protocol (MCP) server. Every Doccupine site exposes an MCP endpoint at \`/api/mcp\` that AI tools can query to search and read your content.

## Connect your site with AI apps

The **Connect your site with AI apps** card gives you a ready-to-paste MCP configuration for popular AI tools. Pick a tab, copy the snippet, and add it to that tool's MCP config:

- **Claude** - add the configuration to Claude Desktop's \`claude_desktop_config.json\`, or add the server URL as a connector from Claude's settings.
- **Cursor** - add the configuration to Cursor's \`~/.cursor/mcp.json\`, or connect it from Cursor's MCP settings.
- **Others** - a generic \`mcpServers\` block for any MCP-compatible application.

Every snippet points to your site's own MCP endpoint, for example:

\`\`\`json
{
  "mcpServers": {
    "Your Project": { "url": "https://your-site.com/api/mcp" }
  }
}
\`\`\`

<Callout type="note">
  The connection snippet appears once your site has been deployed. If you haven't published yet, deploy your site first to get its MCP server URL.
</Callout>

## MCP server authentication

By default your MCP endpoint is publicly accessible. You can restrict access with an API key:

1. Enable **Require API key for MCP access**.
2. Enter an API key.
3. Save.

Once enabled, clients must include the key as a Bearer token in the \`Authorization\` header of every request to \`/api/mcp\`.

<Callout type="warning">
  The API key is stored as an environment variable (\`DOCS_API_KEY\`) on your deployment, not in a JSON file. After saving, a redeploy is triggered automatically to apply the change.
</Callout>

<Callout type="note">
  For the full reference on how the MCP server works - available tools, rate limits, and endpoint details - see the [Model Context Protocol documentation](/model-context-protocol).
</Callout>`;
