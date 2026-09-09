export const mcpTypesTemplate = `export interface DocsResource {
  uri: string;
  name: string;
  path: string;
  content: string;
  /** Language code and version slug; present only on sites that configure
   *  languages.json / versions.json. */
  locale?: string;
  version?: string;
}

export interface DocsChunk {
  id: string;
  text: string;
  path: string;
  uri: string;
  locale?: string;
  version?: string;
}

export interface GetDocParams {
  path: string;
}

export interface ListDocsParams {
  directory?: string;
  /** Language code and version slug to list; each defaults to the site's
   *  default language / version when the site configures them. */
  language?: string;
  version?: string;
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
}
`;
