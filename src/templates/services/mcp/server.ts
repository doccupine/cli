export const mcpServerTemplate = `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  listDocs,
  getDoc,
  getAllDocsChunks,
  DOCS_TOOLS,
} from "@/services/mcp/tools";
import { getLLMConfig, createEmbeddings } from "@/services/llm";
import type { DocsChunk } from "@/services/mcp/types";

/**
 * In-memory cache for document embeddings
 */
let docsIndex: {
  ready: boolean;
  building: boolean;
  chunks: (DocsChunk & { embedding: number[] })[];
} = {
  ready: false,
  building: false,
  chunks: [],
};

/**
 * Cosine similarity between two vectors
 */
function cosineSim(a: number[], b: number[]): number {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * Build or rebuild the documentation index
 */
export async function buildDocsIndex(force = false): Promise<void> {
  if (docsIndex.building) return;
  if (docsIndex.ready && !force) return;

  docsIndex.building = true;
  try {
    const chunks = await getAllDocsChunks();

    if (chunks.length === 0) {
      docsIndex.chunks = [];
      docsIndex.ready = true;
      return;
    }

    const config = getLLMConfig();
    const embeddings = createEmbeddings(config);
    const vectors = await embeddings.embedDocuments(chunks.map((c) => c.text));

    docsIndex.chunks = chunks.map((c, i) => ({
      ...c,
      embedding: vectors[i],
    }));
    docsIndex.ready = true;
  } finally {
    docsIndex.building = false;
  }
}

/**
 * Ensure the docs index is ready
 */
export async function ensureDocsIndex(force = false): Promise<void> {
  if (force) {
    docsIndex.ready = false;
    docsIndex.chunks = [];
  }
  if (!docsIndex.ready) {
    await buildDocsIndex();
  }
}

/**
 * Search documents using semantic similarity
 */
export async function searchDocs(
  query: string,
  limit = 6,
): Promise<{ chunk: DocsChunk; score: number }[]> {
  await ensureDocsIndex();

  const config = getLLMConfig();
  const embeddings = createEmbeddings(config);
  const queryVector = await embeddings.embedQuery(query);

  const scored = docsIndex.chunks
    .map((c) => ({
      chunk: { id: c.id, text: c.text, path: c.path, uri: c.uri },
      score: cosineSim(queryVector, c.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
}

/**
 * Get the current index status
 */
export function getIndexStatus(): { ready: boolean; chunkCount: number } {
  return {
    ready: docsIndex.ready,
    chunkCount: docsIndex.chunks.length,
  };
}

/**
 * Create and configure the MCP server with documentation tools
 */
export function createMCPServer(): McpServer {
  const server = new McpServer({
    name: "docs-server",
    version: "1.0.0",
  });

  // Register the search_docs tool
  server.tool(
    "search_docs",
    DOCS_TOOLS[0].description,
    {
      query: z
        .string()
        .describe("The search query to find relevant documentation"),
      limit: z
        .number()
        .optional()
        .describe("Maximum number of results to return (default: 6)"),
    },
    async ({ query, limit }) => {
      const results = await searchDocs(query, limit ?? 6);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              results.map(({ chunk, score }) => ({
                path: chunk.path,
                uri: chunk.uri,
                score: score.toFixed(3),
                text: chunk.text,
              })),
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // Register the get_doc tool
  server.tool(
    "get_doc",
    DOCS_TOOLS[1].description,
    {
      path: z.string().describe("The file path to the documentation page"),
    },
    async ({ path }) => {
      const doc = await getDoc({ path });
      if (!doc) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ error: "Document not found" }),
            },
          ],
          isError: true,
        };
      }
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(doc, null, 2),
          },
        ],
      };
    },
  );

  // Register the list_docs tool
  server.tool(
    "list_docs",
    DOCS_TOOLS[2].description,
    {
      directory: z
        .string()
        .optional()
        .describe("Optional directory to filter results"),
    },
    async ({ directory }) => {
      const docs = await listDocs({ directory });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              docs.map((d) => ({
                name: d.name,
                path: d.path,
                uri: d.uri,
              })),
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // Register documentation as resources
  server.resource("docs://list", "docs://list", async () => {
    const docs = await listDocs();
    return {
      contents: [
        {
          uri: "docs://list",
          text: JSON.stringify(
            docs.map((d) => ({ name: d.name, path: d.path, uri: d.uri })),
            null,
            2,
          ),
        },
      ],
    };
  });

  return server;
}
`;
