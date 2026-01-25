export const mcpTypesTemplate = `export interface MCPToolResult {
  content: string;
  metadata?: Record<string, unknown>;
}

export interface DocsResource {
  uri: string;
  name: string;
  path: string;
  content: string;
}

export interface DocsChunk {
  id: string;
  text: string;
  path: string;
  uri: string;
}

export interface SearchDocsParams {
  query: string;
  limit?: number;
}

export interface GetDocParams {
  path: string;
}

export interface ListDocsParams {
  directory?: string;
}

export type MCPToolName = "search_docs" | "get_doc" | "list_docs";

export interface MCPToolDefinition {
  name: MCPToolName;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}`;
