export const mcpRoutesTemplate = `import { NextResponse } from "next/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import {
  createMCPServer,
  searchDocs,
  getIndexStatus,
  DOCS_TOOLS,
  listDocs,
  getDoc,
  MCP_MAX_REQUEST_BYTES,
  MCP_MAX_TOOL_ARGUMENT_BYTES,
  searchDocsArgsSchema,
  getDocArgsSchema,
  listDocsArgsSchema,
  serializeMCPResult,
} from "@/services/mcp";
import type { MCPToolName } from "@/services/mcp";
import { rateLimit } from "@/utils/rateLimit";
import { isMcpRequestAuthorized } from "@/lib/access";
import { readJsonBody, RequestTooLargeError } from "@/utils/requestBody";

const MAX_PROTOCOL_MESSAGES = 20;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function jsonByteLength(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value) ?? "null").byteLength;
}

function protocolToolCallError(body: unknown): string | null {
  const messages = Array.isArray(body) ? body : [body];
  if (messages.length === 0 || messages.length > MAX_PROTOCOL_MESSAGES) {
    return "Invalid protocol batch";
  }

  let toolCallCount = 0;
  for (const message of messages) {
    if (!isRecord(message) || message.method !== "tools/call") continue;
    toolCallCount++;
    if (toolCallCount > 1) {
      return "Only one tools/call is allowed per request";
    }
    if (!isRecord(message.params) || typeof message.params.name !== "string") {
      return "Invalid tool call";
    }

    const args = message.params.arguments ?? {};
    if (jsonByteLength(args) > MCP_MAX_TOOL_ARGUMENT_BYTES) {
      return "Tool arguments exceed the maximum size";
    }

    let valid = true;
    switch (message.params.name) {
      case "search_docs":
        valid = searchDocsArgsSchema.safeParse(args).success;
        break;
      case "get_doc":
        valid = getDocArgsSchema.safeParse(args).success;
        break;
      case "list_docs":
        valid = listDocsArgsSchema.safeParse(args).success;
        break;
    }
    if (!valid) return "Invalid tool arguments";
  }
  return null;
}

function protocolError(message: string, status = 400): Response {
  return Response.json(
    {
      jsonrpc: "2.0",
      error: { code: status === 500 ? -32603 : -32602, message },
      id: null,
    },
    { status },
  );
}

function createTransport() {
  return new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
}

async function handleMCPRequest(req: Request, parsedBody?: unknown) {
  const transport = createTransport();
  const server = createMCPServer();
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    void Promise.allSettled([transport.close(), server.close()]);
  };
  req.signal.addEventListener("abort", close, { once: true });

  try {
    await server.connect(transport);
    const response = await transport.handleRequest(
      req,
      parsedBody === undefined ? undefined : { parsedBody },
    );

    const body = response.clone().body;
    if (body) {
      void body
        .pipeTo(new WritableStream())
        .catch(() => {})
        .finally(close);
    } else {
      close();
    }
    return response;
  } catch (error: unknown) {
    console.error("[doccupine] MCP protocol request failed:", error);
    close();
    return protocolError("Internal server error", 500);
  }
}

interface ToolCallRequest {
  tool: MCPToolName;
  params: unknown;
}

function toolResponse(value: unknown): Response {
  const result = serializeMCPResult(value);
  if (result.tooLarge) {
    return NextResponse.json(
      { error: "Tool result exceeds the maximum response size" },
      { status: 413 },
    );
  }
  return new Response(result.text, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

async function handleRESTRequest(req: Request, body: ToolCallRequest) {
  try {
    const { tool, params } = body;

    switch (tool) {
      case "search_docs": {
        const parsed = searchDocsArgsSchema.safeParse(params);
        if (!parsed.success) {
          return NextResponse.json(
            { error: "Invalid params" },
            { status: 400 },
          );
        }
        const results = await searchDocs(
          parsed.data.query,
          parsed.data.limit ?? 6,
          req.signal,
        );
        return toolResponse({
          content: results.map(({ chunk, score }) => ({
            path: chunk.path,
            uri: chunk.uri,
            score: score.toFixed(3),
            text: chunk.text,
          })),
        });
      }

      case "get_doc": {
        const parsed = getDocArgsSchema.safeParse(params);
        if (!parsed.success) {
          return NextResponse.json(
            { error: "Invalid params" },
            { status: 400 },
          );
        }
        req.signal.throwIfAborted();
        const doc = await getDoc({ path: parsed.data.path });
        req.signal.throwIfAborted();
        if (!doc) {
          return NextResponse.json(
            { error: "Document not found" },
            { status: 404 },
          );
        }
        return toolResponse({ content: doc });
      }

      case "list_docs": {
        const parsed = listDocsArgsSchema.safeParse(params);
        if (!parsed.success) {
          return NextResponse.json(
            { error: "Invalid params" },
            { status: 400 },
          );
        }
        req.signal.throwIfAborted();
        const docs = await listDocs({ directory: parsed.data.directory });
        req.signal.throwIfAborted();
        return toolResponse({
          content: docs.map((doc) => ({
            name: doc.name,
            path: doc.path,
            uri: doc.uri,
          })),
        });
      }

      default:
        return NextResponse.json({ error: "Unknown tool" }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error("[doccupine] MCP REST tool failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  if (!(await isMcpRequestAuthorized(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed, retryAfter } = rateLimit(req);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await readJsonBody(req, MCP_MAX_REQUEST_BYTES);
  } catch (error: unknown) {
    if (req.signal.aborted) throw error;
    if (error instanceof RequestTooLargeError) {
      return NextResponse.json(
        { error: "Request body too large" },
        { status: 413 },
      );
    }
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (Array.isArray(body) || (isRecord(body) && "jsonrpc" in body)) {
    const validationError = protocolToolCallError(body);
    if (validationError) return protocolError(validationError);
    return handleMCPRequest(req, body);
  }

  if (isRecord(body) && typeof body.tool === "string") {
    if (jsonByteLength(body.params ?? {}) > MCP_MAX_TOOL_ARGUMENT_BYTES) {
      return NextResponse.json(
        { error: "Tool arguments exceed the maximum size" },
        { status: 413 },
      );
    }
    return handleRESTRequest(req, {
      tool: body.tool as MCPToolName,
      params: body.params ?? {},
    });
  }

  return NextResponse.json(
    { error: "Invalid request format" },
    { status: 400 },
  );
}

export async function GET(req: Request) {
  if (!(await isMcpRequestAuthorized(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = getIndexStatus();
  return NextResponse.json({
    tools: DOCS_TOOLS,
    index: { ready: status.ready, chunkCount: status.chunkCount },
  });
}

export async function DELETE(req: Request) {
  if (!(await isMcpRequestAuthorized(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return handleMCPRequest(req);
}
`;
