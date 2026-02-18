export const ragRoutesTemplate = `import { NextResponse } from "next/server";
import path from "node:path";
import { z } from "zod";
import { getLLMConfig, createChatModel } from "@/services/llm";
import {
  searchDocs,
  ensureDocsIndex,
  getIndexStatus,
} from "@/services/mcp/server";
import { rateLimit } from "@/utils/rateLimit";
import configData from "@/config.json";

const config = configData as Config;

interface Config {
  name?: string;
  description?: string;
  icon?: string;
  preview?: string;
}

const PROJECT_ROOT = process.cwd();

const ragSchema = z.object({
  question: z.string().min(1).max(2000),
  refresh: z.boolean().optional(),
});

const projectName = config.name || "Doccupine";

const systemContext = \`You are AI Assistant, a documentation assistant for \${projectName}, Your name is \${projectName} AI Assistant.

## Core Rules
1. Answer ONLY from the provided context. Never fabricate information.
2. If the answer isn't in the context, say so clearly and suggest relevant sections or pages the user might check.
3. If the question is ambiguous, ask a brief clarifying question before answering.

## Response Style
- Be concise and direct. Lead with the answer, then provide details if needed.
- Use code examples from the context when relevant.
- Match the technical level of the user's question.

## MDX/Code Formatting
When including code blocks in your response:
- Never nest fenced code blocks (triple backticks) inside other fenced code blocks.
- If you need to show MDX source that itself contains code blocks, use indented code blocks or escape the inner backticks.
- All output must be valid MDX that renders correctly.

## Greetings & Small Talk
If the user sends a greeting or non-documentation question, respond briefly and ask how you can help with the documentation.\`;

export async function POST(req: Request) {
  // Rate limit by IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed, retryAfter } = rateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  try {
    const body = await req.json();
    const parsed = ragSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 },
      );
    }
    const { question, refresh } = parsed.data;

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
        content: systemContext as string,
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
