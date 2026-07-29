export const mcpToolsTemplate = `import fs from "node:fs";
import path from "node:path";
import type {
  MCPToolDefinition,
  DocsResource,
  DocsChunk,
  GetDocParams,
  ListDocsParams,
} from "@/services/mcp/types";

// Keep the corpus out of the function's JavaScript bundle. next.config.ts
// traces this fixed file into the RAG/MCP functions, just like docs-index.json.
const DOCS_CONTENT_FILE = path.join(
  process.cwd(),
  "services",
  "mcp",
  "docs-content.json",
);

let docsContentCache:
  { mtimeMs: number; size: number; docs: DocsResource[] } | undefined;

function loadDocsContent(): DocsResource[] {
  try {
    // Generated content changes while \`next dev\` stays alive. Key the cache by
    // file metadata so watch-mode updates become visible without parsing the
    // whole corpus on every tool call.
    const stat = fs.statSync(DOCS_CONTENT_FILE);
    if (
      docsContentCache?.mtimeMs === stat.mtimeMs &&
      docsContentCache.size === stat.size
    ) {
      return docsContentCache.docs;
    }
    const parsed: unknown = JSON.parse(
      fs.readFileSync(DOCS_CONTENT_FILE, "utf8"),
    );
    const docs = Array.isArray(parsed) ? (parsed as DocsResource[]) : [];
    docsContentCache = { mtimeMs: stat.mtimeMs, size: stat.size, docs };
    return docs;
  } catch {
    docsContentCache = undefined;
    return [];
  }
}

/**
 * Tool definitions for MCP - these describe the available tools
 */
export const DOCS_TOOLS: MCPToolDefinition[] = [
  {
    name: "search_docs",
    description:
      "Search through the documentation content using semantic search. Returns relevant chunks of documentation based on the query.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query to find relevant documentation",
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (default: 6)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_doc",
    description:
      "Get the full content of a specific documentation page by its path.",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description:
            "The file path to the documentation page (e.g., 'app/getting-started/page.tsx')",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "list_docs",
    description:
      "List all available documentation pages, optionally filtered by directory.",
    inputSchema: {
      type: "object",
      properties: {
        directory: {
          type: "string",
          description:
            "Optional directory to filter results (e.g., 'components')",
        },
      },
    },
  },
];

/**
 * List all documentation resources
 */
export async function listDocs(
  params?: ListDocsParams,
): Promise<DocsResource[]> {
  const docsContent = loadDocsContent();
  const filterDir = params?.directory?.replace(/\\\\/g, "/");
  const resources = filterDir
    ? docsContent.filter((doc) => doc.path.includes(filterDir))
    : docsContent;
  return resources.map((doc) => ({ ...doc }));
}

/**
 * Get a specific documentation page
 */
export async function getDoc(
  params: GetDocParams,
): Promise<DocsResource | null> {
  const docsContent = loadDocsContent();
  const requested = params.path.trim().replace(/\\\\/g, "/");
  if (!requested || requested.includes("\\0")) return null;

  const withoutScheme = requested.replace(/^docs:\\/\\//, "");
  const route = withoutScheme
    .replace(/^app\\/(?:\\([^/]+\\)\\/)?/, "")
    .replace(/(?:^|\\/)page\\.(?:tsx?|jsx?)$/, "")
    .replace(/^\\/+|\\/+$/g, "");

  const doc = docsContent.find((candidate) => {
    const candidateRoute = candidate.uri
      .replace(/^docs:\\/\\//, "")
      .replace(/^\\/+|\\/+$/g, "");
    return (
      candidate.path === requested ||
      candidate.uri === requested ||
      candidateRoute === route
    );
  });

  return doc ? { ...doc } : null;
}

/**
 * Chunk text for embeddings.
 * - chunkSize=800 chars balances granularity with embedding context window limits
 * - overlap=100 chars ensures continuity so searches don't miss content at chunk boundaries
 */
function chunkText(text: string, chunkSize = 800, overlap = 100): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + chunkSize, text.length);
    chunks.push(text.slice(i, end));
    if (end === text.length) break;
    i = end - overlap;
    if (i < 0) i = 0;
  }
  return chunks;
}

/**
 * Get all documentation chunks for indexing
 */
export async function getAllDocsChunks(): Promise<DocsChunk[]> {
  const allChunks: DocsChunk[] = [];
  const docs = await listDocs();

  for (const doc of docs) {
    const cleanContent = doc.content
      .replace(/\\r\\n/g, "\\n")
      .replace(/\\n{3,}/g, "\\n\\n")
      .slice(0, 200_000);

    const textChunks = chunkText(cleanContent);
    for (let i = 0; i < textChunks.length; i++) {
      allChunks.push({
        id: \`\${doc.path}:\${i}\`,
        text: textChunks[i],
        path: doc.path,
        uri: doc.uri,
      });
    }
  }

  return allChunks;
}
`;
