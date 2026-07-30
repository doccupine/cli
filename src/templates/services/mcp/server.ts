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

export const MCP_MAX_REQUEST_BYTES = 64 * 1024;
export const MCP_MAX_TOOL_ARGUMENT_BYTES = 8 * 1024;
export const MCP_MAX_RESULT_BYTES = 256 * 1024;

export const searchDocsArgsSchema = z
  .object({
    query: z.string().min(1).max(2000),
    limit: z.number().int().min(1).max(20).optional(),
  })
  .strict();

export const getDocArgsSchema = z
  .object({ path: z.string().min(1).max(500) })
  .strict();

export const listDocsArgsSchema = z
  .object({ directory: z.string().max(500).optional() })
  .strict();

export function serializeMCPResult(value: unknown): {
  text: string;
  tooLarge: boolean;
} {
  const text = JSON.stringify(value, null, 2) ?? "null";
  if (new TextEncoder().encode(text).byteLength <= MCP_MAX_RESULT_BYTES) {
    return { text, tooLarge: false };
  }
  return {
    text: JSON.stringify({
      error: "Tool result exceeds the maximum response size",
    }),
    tooLarge: true,
  };
}

/**
 * Thrown when a query arrives but no usable prebuilt embeddings index exists AND
 * the doc set is too large to embed within a single serverless request. Surfaced
 * to the client as a clear "temporarily unavailable" message instead of letting
 * the request hang until the platform's function timeout (the old failure mode:
 * the chat connected, streamed heartbeats, and never answered on large docs).
 */
export class IndexNotBuiltError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IndexNotBuiltError";
  }
}

/**
 * Max chunks we will embed on demand inside one request when the prebuilt index
 * is missing. Above this, embedding the whole set (one round trip per BATCH_SIZE
 * chunks) cannot finish within a serverless function's time limit, so the chat
 * would hang forever. Only enforced in production - \`next dev\` has no time cap,
 * so it keeps embedding on demand and works without running the build. Override
 * per deployment with RAG_RUNTIME_EMBED_MAX_CHUNKS (0 = always require a prebuilt
 * index). Parsed defensively so a bad value falls back to the default rather
 * than silently disabling the guard; note \`Number(x) || 400\` would drop a valid 0.
 */
function resolveRuntimeEmbedMax(): number {
  const raw = process.env.RAG_RUNTIME_EMBED_MAX_CHUNKS;
  if (raw !== undefined && raw !== "") {
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed >= 0) return Math.floor(parsed);
  }
  return 400;
}
const RUNTIME_EMBED_MAX_CHUNKS = resolveRuntimeEmbedMax();

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
 * Human-readable reason the index is unavailable, or null when healthy. Surfaced
 * by getIndexStatus (and GET /api/rag) so a missing/broken index is diagnosable
 * from outside without reading server logs.
 */
let indexUnavailableReason: string | null = null;

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
  indexUnavailableReason = null;
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

    // Reaching here means no usable prebuilt index was loaded (missing, empty,
    // or built with a different provider/model/dims). Embedding the whole set on
    // demand only completes in time for small doc sets; for large ones it runs
    // one round trip per BATCH_SIZE chunks and blows past the serverless function
    // limit, so the chat connects and then hangs forever with no answer. In
    // production, fail fast with an actionable error instead of hanging (this
    // also stops a client-forced \`refresh\` from burning embedding quota).
    if (
      process.env.NODE_ENV === "production" &&
      chunks.length > RUNTIME_EMBED_MAX_CHUNKS
    ) {
      indexUnavailableReason =
        \`Prebuilt embeddings index missing; refusing to embed \${chunks.length} \` +
        \`chunks at request time (limit \${RUNTIME_EMBED_MAX_CHUNKS}). Run the build \` +
        \`with an embedding API key set so scripts/build-docs-index.mts writes \` +
        \`services/mcp/docs-index.json, then redeploy.\`;
      console.error(\`[doccupine] \${indexUnavailableReason}\`);
      throw new IndexNotBuiltError(
        "The AI assistant is temporarily unavailable: its documentation search " +
          "index has not been built for this deployment. If you are the site " +
          "owner, redeploy with an embedding API key available at build time.",
      );
    }

    // Small enough (or local dev): embed on demand. This still re-embeds on every
    // cold start, so a prebuilt index is strongly preferred in production.
    console.warn(
      \`[doccupine] No prebuilt embeddings index found; embedding \${chunks.length} \` +
        \`chunks on demand. Precompute at build time to avoid this on each cold start.\`,
    );

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
export async function ensureDocsIndex(
  force = false,
  signal?: AbortSignal,
): Promise<void> {
  signal?.throwIfAborted();
  if (force) {
    // Wait for any in-flight build before starting a forced rebuild
    if (docsIndex.building && indexReady) {
      await indexReady.catch(() => {});
    }
    docsIndex.ready = false;
    docsIndex.chunks = [];
    indexReady = buildDocsIndex(true);
  } else if (!indexReady) {
    indexReady = buildDocsIndex();
  }

  const build = indexReady;
  if (!signal) return build;

  // Embedding clients do not expose AbortSignal parameters. Keep the shared
  // index build alive for other requests, but stop this caller waiting as soon
  // as its request is cancelled.
  await new Promise<void>((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener("abort", abort, { once: true });
    void build.then(resolve, reject).finally(() => {
      signal.removeEventListener("abort", abort);
    });
  });
  signal.throwIfAborted();
}

function throwIfCancelled(signal?: AbortSignal): void {
  signal?.throwIfAborted();
}

async function embedQuery(
  query: string,
  signal?: AbortSignal,
): Promise<number[]> {
  throwIfCancelled(signal);
  // LangChain's provider-neutral Embeddings interface has no signal option.
  const vector = await getEmbeddings().embedQuery(query);
  throwIfCancelled(signal);
  return vector;
}

function normalizeSearchLimit(limit: number): number {
  if (!Number.isFinite(limit)) return 6;
  return Math.max(1, Math.min(20, Math.floor(limit)));
}

function toolResult(value: unknown) {
  const serialized = serializeMCPResult(value);
  return {
    content: [{ type: "text" as const, text: serialized.text }],
    ...(serialized.tooLarge ? { isError: true as const } : {}),
  };
}

function toolError(message: string) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ error: message }),
      },
    ],
    isError: true as const,
  };
}

function resourceText(value: unknown): string {
  return serializeMCPResult(value).text;
}

// Eagerly start building the index on server startup if LLM is configured
if (isLLMAvailable()) {
  const initialBuild = buildDocsIndex();
  indexReady = initialBuild;
  // A failed eager build (e.g. a missing prebuilt index on a large doc set) must
  // not surface as an unhandledRejection at startup; the first request retries
  // via ensureDocsIndex and returns a real error to the client.
  void initialBuild.catch(() => {});
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
  signal?: AbortSignal,
): Promise<{ chunk: DocsChunk; score: number }[]> {
  await ensureDocsIndex(false, signal);
  throwIfCancelled(signal);

  // Reduce the query vector with the exact same transform used at index time so
  // dimensions line up. Scoring runs directly against the int8 vectors - cosine
  // is scale-invariant, so no dequantization is needed.
  const rawQueryVector = await embedQuery(query, signal);
  const queryVector = reduceDims(rawQueryVector, getLLMConfig().embeddingDims);

  const scored = docsIndex.chunks
    .map((c) => ({
      chunk: { id: c.id, text: c.text, path: c.path, uri: c.uri },
      score: cosineFloatInt8(queryVector, c.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, normalizeSearchLimit(limit));

  return scored;
}

/**
 * Get the current index status
 */
export function getIndexStatus(): {
  ready: boolean;
  chunkCount: number;
  reason: string | null;
} {
  return {
    ready: docsIndex.ready,
    chunkCount: docsIndex.chunks.length,
    reason: indexUnavailableReason,
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
  server.registerTool(
    "search_docs",
    {
      description: DOCS_TOOLS[0].description,
      inputSchema: searchDocsArgsSchema,
    },
    async ({ query, limit }, { signal }) => {
      const results = await searchDocs(query, limit ?? 6, signal);
      return toolResult(
        results.map(({ chunk, score }) => ({
          path: chunk.path,
          uri: chunk.uri,
          score: score.toFixed(3),
          text: chunk.text,
        })),
      );
    },
  );

  // Register the get_doc tool
  server.registerTool(
    "get_doc",
    {
      description: DOCS_TOOLS[1].description,
      inputSchema: getDocArgsSchema,
    },
    async ({ path }, { signal }) => {
      signal.throwIfAborted();
      const doc = await getDoc({ path });
      signal.throwIfAborted();
      if (!doc) {
        return toolError("Document not found");
      }
      return toolResult(doc);
    },
  );

  // Register the list_docs tool
  server.registerTool(
    "list_docs",
    {
      description: DOCS_TOOLS[2].description,
      inputSchema: listDocsArgsSchema,
    },
    async ({ directory }, { signal }) => {
      signal.throwIfAborted();
      const docs = await listDocs({ directory });
      signal.throwIfAborted();
      return toolResult(
        docs.map((d) => ({
          name: d.name,
          path: d.path,
          uri: d.uri,
        })),
      );
    },
  );

  // Register documentation as resources
  server.resource("docs://list", "docs://list", async () => {
    const docs = await listDocs();
    return {
      contents: [
        {
          uri: "docs://list",
          text: resourceText(
            docs.map((d) => ({ name: d.name, path: d.path, uri: d.uri })),
          ),
        },
      ],
    };
  });

  return server;
}
`;
