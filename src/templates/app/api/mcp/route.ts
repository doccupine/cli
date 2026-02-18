export const mcpRoutesTemplate = `import { NextResponse } from "next/server";
import { z } from "zod";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createMCPServer } from "@/services/mcp/server";
import {
  searchDocs,
  ensureDocsIndex,
  getIndexStatus,
  DOCS_TOOLS,
  listDocs,
  getDoc,
} from "@/services/mcp";
import type { MCPToolName } from "@/services/mcp";
import { rateLimit } from "@/utils/rateLimit";

const searchDocsSchema = z.object({
  query: z.string().min(1).max(2000),
  limit: z.number().int().min(1).max(50).optional(),
});

const getDocSchema = z.object({
  path: z.string().min(1).max(500),
});

const listDocsSchema = z.object({
  directory: z.string().max(500).optional(),
});

// Create a stateless transport for serverless environment
function createTransport() {
  return new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Stateless mode for serverless
    enableJsonResponse: true,
  });
}

// Handle MCP protocol requests
async function handleMCPRequest(req: Request) {
  const transport = createTransport();
  const server = createMCPServer();

  try {
    await server.connect(transport);
    const response = await transport.handleRequest(req);

    // Clean up after response is done
    response
      .clone()
      .body?.pipeTo(
        new WritableStream({
          close() {
            transport.close();
            server.close();
          },
        }),
      )
      .catch(() => {});

    return response;
  } catch (error) {
    console.error("MCP request error:", error);
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: null,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

// Handle REST API requests (original JSON format)
interface ToolCallRequest {
  tool: MCPToolName;
  params: Record<string, unknown>;
}

async function handleRESTRequest(body: ToolCallRequest) {
  try {
    const { tool, params } = body;

    if (!tool) {
      return NextResponse.json(
        { error: "Missing 'tool' parameter" },
        { status: 400 },
      );
    }

    switch (tool) {
      case "search_docs": {
        const parsed = searchDocsSchema.safeParse(params);
        if (!parsed.success) {
          return NextResponse.json(
            { error: "Invalid params", details: parsed.error.issues },
            { status: 400 },
          );
        }
        await ensureDocsIndex();
        const results = await searchDocs(
          parsed.data.query,
          parsed.data.limit ?? 6,
        );
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
        const parsed = getDocSchema.safeParse(params);
        if (!parsed.success) {
          return NextResponse.json(
            { error: "Invalid params", details: parsed.error.issues },
            { status: 400 },
          );
        }
        const doc = await getDoc({ path: parsed.data.path });
        if (!doc) {
          return NextResponse.json(
            { error: "Document not found" },
            { status: 404 },
          );
        }
        return NextResponse.json({ content: doc });
      }

      case "list_docs": {
        const parsed = listDocsSchema.safeParse(params);
        if (!parsed.success) {
          return NextResponse.json(
            { error: "Invalid params", details: parsed.error.issues },
            { status: 400 },
          );
        }
        const docs = await listDocs({
          directory: parsed.data.directory,
        });
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

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed, retryAfter } = rateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  // Clone the request to read body twice if needed
  const clonedReq = req.clone();

  try {
    const body = await clonedReq.json();

    // Check if this is an MCP protocol request (has jsonrpc field)
    // or a REST API request (has tool field)
    if ("jsonrpc" in body) {
      // MCP protocol request - use the original request
      return handleMCPRequest(req);
    } else if ("tool" in body) {
      // REST API request
      return handleRESTRequest(body as ToolCallRequest);
    } else {
      return NextResponse.json(
        {
          error:
            "Invalid request format. Expected 'jsonrpc' (MCP) or 'tool' (REST) field.",
        },
        { status: 400 },
      );
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}

export async function GET() {
  // GET always returns REST API format (tools list and index status)
  const status = getIndexStatus();
  return NextResponse.json({
    tools: DOCS_TOOLS,
    index: {
      ready: status.ready,
      chunkCount: status.chunkCount,
    },
  });
}

export async function DELETE(req: Request) {
  // DELETE is only used by MCP protocol
  return handleMCPRequest(req);
}
`;
