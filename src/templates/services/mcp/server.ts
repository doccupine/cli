export const mcpServerTemplate = `import path from "node:path";
import fs from "node:fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  listDocs,
  getDoc,
  getAllDocsChunks,
  DOCS_TOOLS,
} from "@/services/mcp/tools";
import { getLLMConfig, isLLMAvailable, createEmbeddings } from "@/services/llm";
import {
  reduceDims,
  quantizeInt8,
  decodeInt8,
  cosineFloatInt8,
} from "@/services/mcp/vector";
import type { DocsChunk } from "@/services/mcp/types";

/** A doc chunk with its stored int8-quantized embedding. */
type IndexedChunk = DocsChunk & { embedding: Int8Array };

/**
 * In-memory cache for document embeddings.
 * Built once at server startup since docs are static.
 */
let docsIndex: {
  ready: boolean;
  building: boolean;
  chunks: IndexedChunk[];
} = {
  ready: false,
  building: false,
  chunks: [],
};

/** Resolves when the initial index build completes */
let indexReady: Promise<void> | null = null;

/**
 * Absolute path to the embeddings index precomputed at build time by
 * scripts/build-docs-index.mts. Bundled into serverless functions via
 * outputFileTracingIncludes in next.config.ts.
 */
const INDEX_FILE = path.join(
  process.cwd(),
  "services",
  "mcp",
  "docs-index.json",
);

/**
 * Load embeddings precomputed at build time. Returns null when the file is
 * missing/empty, was built with a different provider/model/dimension than the
 * current config, or is not int8-quantized - query and document vectors must
 * come from the same embedding model and the same transform (dims + int8).
 * A null return makes the caller fall back to embedding on demand at runtime.
 */
function loadPrecomputedIndex(): IndexedChunk[] | null {
  try {
    const parsed = JSON.parse(fs.readFileSync(INDEX_FILE, "utf8")) as {
      provider?: string;
      embeddingModel?: string;
      dims?: number;
      quantization?: string;
      chunks?: (DocsChunk & { embedding: string })[];
    };
    if (!parsed.chunks || parsed.chunks.length === 0) return null;
    const config = getLLMConfig();
    // Guard on the exact transform: the same dims value at build and query time
    // guarantees reduceDims produces matching-length vectors on both sides.
    if (
      parsed.provider !== config.provider ||
      parsed.embeddingModel !== config.embeddingModel ||
      parsed.dims !== config.embeddingDims ||
      parsed.quantization !== "int8"
    ) {
      return null;
    }
    const decoded: IndexedChunk[] = [];
    let expectedLen = -1;
    for (const c of parsed.chunks) {
      const embedding = decodeInt8(c.embedding);
      // Reject a corrupt index rather than scoring against ragged vectors.
      if (expectedLen === -1) expectedLen = embedding.length;
      else if (embedding.length !== expectedLen) return null;
      decoded.push({
        id: c.id,
        text: c.text,
        path: c.path,
        uri: c.uri,
        embedding,
      });
    }
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Build or rebuild the documentation index
 */
async function buildDocsIndex(force = false): Promise<void> {
  if (docsIndex.building) return;
  if (docsIndex.ready && !force) return;

  docsIndex.building = true;
  try {
    // Prefer embeddings precomputed at build time - avoids re-embedding the
    // entire doc set on every cold start (the main cause of slow first chats).
    if (!force) {
      const precomputed = loadPrecomputedIndex();
      if (precomputed) {
        docsIndex.chunks = precomputed;
        docsIndex.ready = true;
        return;
      }
    }

    const chunks = await getAllDocsChunks();

    if (chunks.length === 0) {
      docsIndex.chunks = [];
      docsIndex.ready = true;
      return;
    }

    const config = getLLMConfig();
    const embeddings = createEmbeddings(config);

    // Process embeddings in small batches to avoid exceeding token limits.
    // Reduce + quantize to the same int8 representation as the precomputed
    // index so searchDocs scores identically on either path.
    const BATCH_SIZE = 10;
    const texts = chunks.map((c) => c.text);
    const built: IndexedChunk[] = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      const batchVectors = await embeddings.embedDocuments(batch);
      for (let j = 0; j < batchVectors.length; j++) {
        built.push({
          ...chunks[i + j],
          embedding: quantizeInt8(
            reduceDims(batchVectors[j], config.embeddingDims),
          ),
        });
      }
    }

    docsIndex.chunks = built;
    docsIndex.ready = true;
  } catch (error) {
    // Reset so the next call to ensureDocsIndex retries
    indexReady = null;
    throw error;
  } finally {
    docsIndex.building = false;
  }
}

/**
 * Ensure the docs index is ready.
 * On first call, triggers the build; subsequent calls wait for the same promise.
 */
export async function ensureDocsIndex(force = false): Promise<void> {
  if (force) {
    // Wait for any in-flight build before starting a forced rebuild
    if (docsIndex.building && indexReady) {
      await indexReady.catch(() => {});
    }
    docsIndex.ready = false;
    docsIndex.chunks = [];
    indexReady = buildDocsIndex(true);
    return indexReady;
  }
  if (!indexReady) {
    indexReady = buildDocsIndex();
  }
  return indexReady;
}

// Eagerly start building the index on server startup if LLM is configured
if (isLLMAvailable()) {
  indexReady = buildDocsIndex();
}

/** Cached embeddings instance for search queries */
let cachedEmbeddings: ReturnType<typeof createEmbeddings> | null = null;

function getEmbeddings() {
  if (!cachedEmbeddings) {
    cachedEmbeddings = createEmbeddings(getLLMConfig());
  }
  return cachedEmbeddings;
}

/**
 * Search documents using semantic similarity
 */
export async function searchDocs(
  query: string,
  limit = 6,
): Promise<{ chunk: DocsChunk; score: number }[]> {
  await ensureDocsIndex();

  // Reduce the query vector with the exact same transform used at index time so
  // dimensions line up. Scoring runs directly against the int8 vectors - cosine
  // is scale-invariant, so no dequantization is needed.
  const rawQueryVector = await getEmbeddings().embedQuery(query);
  const queryVector = reduceDims(rawQueryVector, getLLMConfig().embeddingDims);

  const scored = docsIndex.chunks
    .map((c) => ({
      chunk: { id: c.id, text: c.text, path: c.path, uri: c.uri },
      score: cosineFloatInt8(queryVector, c.embedding),
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
