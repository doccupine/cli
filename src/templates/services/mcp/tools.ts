export const mcpToolsTemplate = `import path from "node:path";
import fs from "node:fs/promises";
import type {
  MCPToolDefinition,
  DocsResource,
  DocsChunk,
  GetDocParams,
  ListDocsParams,
} from "@/services/mcp/types";

const PROJECT_ROOT = process.cwd();
const APP_DIR = path.join(PROJECT_ROOT, "app");
const VALID_EXT = new Set([".ts", ".tsx", ".js", ".jsx"]);

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
 * Recursively walk directory to find documentation files
 */
async function* walkDocs(dir: string): AsyncGenerator<string> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".next", ".git", "api"].includes(entry.name)) {
        continue;
      }
      yield* walkDocs(fullPath);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (VALID_EXT.has(ext) && entry.name.startsWith("page.")) {
        yield fullPath;
      }
    }
  }
}

/**
 * Extract content blocks from a file
 */
function extractContentBlocks(fileText: string): string[] {
  const results: string[] = [];

  const tplRegex = /(?:export\\s+)?const\\s+content\\s*=\\s*\`((?:\\\\\`|[^\`])*)\`\\s*;/g;
  let m: RegExpExecArray | null;
  while ((m = tplRegex.exec(fileText)) !== null) {
    results.push(m[1]);
  }

  const sglRegex = /(?:export\\s+)?const\\s+content\\s*=\\s*'([^']*)'\\s*;/g;
  while ((m = sglRegex.exec(fileText)) !== null) {
    results.push(m[1]);
  }

  const dblRegex = /(?:export\\s+)?const\\s+content\\s*=\\s*"([^"]*)"\\s*;/g;
  while ((m = dblRegex.exec(fileText)) !== null) {
    results.push(m[1]);
  }

  return results;
}

/**
 * Get the title from markdown content
 */
function extractTitle(content: string): string {
  const match = content.match(/^#\\s+(.+)$/m);
  return match ? match[1].trim() : "Untitled";
}

/**
 * List all documentation resources
 */
export async function listDocs(
  params?: ListDocsParams,
): Promise<DocsResource[]> {
  const resources: DocsResource[] = [];
  const filterDir = params?.directory;

  for await (const filePath of walkDocs(APP_DIR)) {
    const relativePath = path.relative(PROJECT_ROOT, filePath);

    if (filterDir && !relativePath.includes(filterDir)) {
      continue;
    }

    try {
      const fileContent = await fs.readFile(filePath, "utf8");
      const blocks = extractContentBlocks(fileContent);
      const content = blocks.join("\\n\\n");
      const title = extractTitle(content);
      const docPath = path.dirname(relativePath).replace(/^app\\/?/, "") || "/";

      resources.push({
        uri: \`docs://\${docPath}\`,
        name: title,
        path: relativePath,
        content,
      });
    } catch {
      // Skip files that can't be read
    }
  }

  return resources;
}

/**
 * Get a specific documentation page
 */
export async function getDoc(
  params: GetDocParams,
): Promise<DocsResource | null> {
  let targetPath = params.path;

  // Normalize path
  if (!targetPath.startsWith("app/")) {
    targetPath = \`app/\${targetPath}\`;
  }
  if (!targetPath.includes("page.")) {
    targetPath = path.join(targetPath, "page.tsx");
  }

  const fullPath = path.join(PROJECT_ROOT, targetPath);

  try {
    const fileContent = await fs.readFile(fullPath, "utf8");
    const blocks = extractContentBlocks(fileContent);
    const content = blocks.join("\\n\\n");
    const title = extractTitle(content);
    const docPath = path.dirname(targetPath).replace(/^app\\/?/, "") || "/";

    return {
      uri: \`docs://\${docPath}\`,
      name: title,
      path: targetPath,
      content,
    };
  } catch {
    return null;
  }
}

/**
 * Chunk text for embeddings
 */
export function chunkText(
  text: string,
  chunkSize = 1500,
  overlap = 200,
): string[] {
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
}`;
