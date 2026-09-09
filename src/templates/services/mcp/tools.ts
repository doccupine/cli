export const mcpToolsTemplate = `import fs from "node:fs";
import path from "node:path";
import type {
  MCPToolDefinition,
  DocsResource,
  DocsChunk,
  GetDocParams,
  ListDocsParams,
} from "@/services/mcp/types";
import {
  defaultLanguage,
  isVariantsConfigured,
  languages,
  versions,
} from "@/utils/variants";

/** The language/version a docs query is scoped to. Empty when the site has
 *  neither configured, so every page matches. */
export interface DocsFilter {
  locale?: string;
  version?: string;
}

/**
 * Resolve the scope of a docs query: the requested language and version, or
 * the site's default language / default version when a request names none.
 * A language or version the site does not declare matches nothing.
 */
export function resolveDocsFilter(params?: {
  language?: string;
  version?: string;
}): DocsFilter {
  if (!isVariantsConfigured()) return {};
  const filter: DocsFilter = {};
  if (languages) {
    filter.locale = params?.language ?? defaultLanguage()?.code ?? "";
  }
  if (versions) {
    filter.version = params?.version ?? "";
  }
  return filter;
}

export function matchesDocsFilter(
  doc: { locale?: string; version?: string },
  filter: DocsFilter,
): boolean {
  return (
    (filter.locale === undefined || doc.locale === filter.locale) &&
    (filter.version === undefined || doc.version === filter.version)
  );
}

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
        language: {
          type: "string",
          description:
            "Language code to search (e.g. 'de'); defaults to the site's default language",
        },
        version: {
          type: "string",
          description:
            "Documentation version slug to search (e.g. 'v1'); defaults to the current version",
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
        language: {
          type: "string",
          description:
            "Language code to list (e.g. 'de'); defaults to the site's default language",
        },
        version: {
          type: "string",
          description:
            "Documentation version slug to list (e.g. 'v1'); defaults to the current version",
        },
      },
    },
  },
];

/**
 * Every documentation resource in every language and version. Indexes are
 * built from this and filtered at query time.
 */
export async function listAllDocs(): Promise<DocsResource[]> {
  return loadDocsContent().map((doc) => ({ ...doc }));
}

/**
 * List the documentation resources of one language/version (the default
 * variant unless the params name another), optionally under a directory.
 */
export async function listDocs(
  params?: ListDocsParams,
): Promise<DocsResource[]> {
  const docsContent = loadDocsContent();
  const filterDir = params?.directory?.replace(/\\\\/g, "/");
  const filter = resolveDocsFilter(params);
  return docsContent
    .filter((doc) => matchesDocsFilter(doc, filter))
    .filter((doc) => !filterDir || doc.path.includes(filterDir))
    .map((doc) => ({ ...doc }));
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
  const docs = await listAllDocs();

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
        ...(doc.locale !== undefined ? { locale: doc.locale } : {}),
        ...(doc.version !== undefined ? { version: doc.version } : {}),
      });
    }
  }

  return allChunks;
}
`;
