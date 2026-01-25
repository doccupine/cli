export const mcpRoutesTemplate = `import { NextResponse } from "next/server";
import {
  searchDocs,
  ensureDocsIndex,
  getIndexStatus,
  DOCS_TOOLS,
  listDocs,
  getDoc,
} from "@/services/mcp";
import type { MCPToolName } from "@/services/mcp";

interface ToolCallRequest {
  tool: MCPToolName;
  params: Record<string, unknown>;
}

export async function POST(req: Request) {
  try {
    const { tool, params } = (await req.json()) as ToolCallRequest;

    if (!tool) {
      return NextResponse.json(
        { error: "Missing 'tool' parameter" },
        { status: 400 },
      );
    }

    switch (tool) {
      case "search_docs": {
        const query = String(params?.query || "");
        const limit = typeof params?.limit === "number" ? params.limit : 6;
        await ensureDocsIndex();
        const results = await searchDocs(query, limit);
        return NextResponse.json({
          content: results.map(({ chunk, score }) => ({
            path: chunk.path,
            uri: chunk.uri,
            score: score.toFixed(3),
            text: chunk.text,
          })),
        });
      }

      case "get_doc": {
        const path = String(params?.path || "");
        const doc = await getDoc({ path });
        if (!doc) {
          return NextResponse.json(
            { error: "Document not found" },
            { status: 404 },
          );
        }
        return NextResponse.json({ content: doc });
      }

      case "list_docs": {
        const directory =
          typeof params?.directory === "string" ? params.directory : undefined;
        const docs = await listDocs({ directory });
        return NextResponse.json({
          content: docs.map((d) => ({
            name: d.name,
            path: d.path,
            uri: d.uri,
          })),
        });
      }

      default:
        return NextResponse.json(
          { error: \`Unknown tool: \${tool}\` },
          { status: 400 },
        );
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const status = getIndexStatus();
  return NextResponse.json({
    tools: DOCS_TOOLS,
    index: {
      ready: status.ready,
      chunkCount: status.chunkCount,
    },
  });
}`;
