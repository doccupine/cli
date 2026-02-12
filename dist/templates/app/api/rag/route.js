export const ragRoutesTemplate = `import { NextResponse } from "next/server";
import path from "node:path";
import { getLLMConfig, createChatModel } from "@/services/llm";
import {
  searchDocs,
  ensureDocsIndex,
  getIndexStatus,
} from "@/services/mcp/server";

const PROJECT_ROOT = process.cwd();

export async function POST(req: Request) {
  try {
    const { question, refresh } = await req.json();

    let config;
    try {
      config = getLLMConfig();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "LLM configuration error";
      return NextResponse.json({ error: message }, { status: 500 });
    }

    // Use MCP service to ensure docs are indexed
    await ensureDocsIndex(Boolean(refresh));

    // Use MCP search_docs tool to find relevant documentation
    const searchResults = await searchDocs(String(question || ""), 6);

    // Build context from search results
    const context = searchResults
      .map(
        ({ chunk, score }) =>
          \`File: \${path.relative(PROJECT_ROOT, chunk.path)}\\nScore: \${score.toFixed(3)}\\n----\\n\${chunk.text}\`,
      )
      .join("\\n\\n================\\n\\n");

    // Create chat model and stream response
    const llm = createChatModel(config);
    const prompt = [
      {
        role: "system" as const,
        content:
          "You are a helpful documentation assistant. Answer strictly from the provided context. If the answer is not in the context, say you don't know and suggest where to look. Make sure the mdx can be nested properly if you show code components within nested \`\`\` it has to be valid md/mdx output.",
      },
      {
        role: "user" as const,
        content: \`Question: \${question}\\n\\nContext:\\n\${context}\`,
      },
    ];

    const stream = await llm.stream(prompt);

    // Build metadata from MCP search results
    const indexStatus = getIndexStatus();
    const metadata = {
      sources: searchResults.map(({ chunk, score }) => ({
        id: chunk.id,
        path: path.relative(PROJECT_ROOT, chunk.path),
        uri: chunk.uri,
        score,
      })),
      chunkCount: indexStatus.chunkCount,
    };

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(
            encoder.encode(
              \`data: \${JSON.stringify({ type: "metadata", data: metadata })}\\n\\n\`,
            ),
          );

          for await (const chunk of stream) {
            const content = chunk?.content || "";
            if (content) {
              controller.enqueue(
                encoder.encode(
                  \`data: \${JSON.stringify({ type: "content", data: content })}\\n\\n\`,
                ),
              );
            }
          }

          controller.enqueue(
            encoder.encode(\`data: \${JSON.stringify({ type: "done" })}\\n\\n\`),
          );
          controller.close();
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : "Stream error";
          controller.enqueue(
            encoder.encode(
              \`data: \${JSON.stringify({ type: "error", data: message })}\\n\\n\`,
            ),
          );
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const status = getIndexStatus();
  return NextResponse.json({
    ready: status.ready,
    chunks: status.chunkCount,
  });
}
`;
