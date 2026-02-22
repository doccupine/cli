export const ragRoutesTemplate = `import { NextResponse } from "next/server";
import { z } from "zod";
import { getLLMConfig, createChatModel } from "@/services/llm";
import {
  searchDocs,
  ensureDocsIndex,
  getIndexStatus,
} from "@/services/mcp/server";
import { rateLimit } from "@/utils/rateLimit";
import { config } from "@/utils/config";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(4000),
});

const ragSchema = z.object({
  question: z.string().min(1).max(2000),
  history: z.array(messageSchema).max(20).optional(),
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

## Internal Links
Each context chunk includes a "URL:" line with the pre-computed page URL. Use it directly when linking:
- Format links as markdown: [Page Title](/slug/).
- Never expose raw file paths like "/app/.../page.tsx" to the user.
- Always include relevant documentation links at the end of your answer in a "Related Pages" section. Only link to pages that explicitly appear in the provided context - never guess or fabricate page URLs.

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
    const { question, history, refresh } = parsed.data;

    let llmConfig;
    try {
      llmConfig = getLLMConfig();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "LLM configuration error";
      return NextResponse.json({ error: message }, { status: 500 });
    }

    // Use MCP service to ensure docs are indexed
    await ensureDocsIndex(Boolean(refresh));

    // Use MCP search_docs tool to find relevant documentation
    const searchResults = await searchDocs(question, 6);

    // Build context from search results
    const context = searchResults
      .map(({ chunk, score }) => {
        const slug = chunk.uri.replace("docs://", "").replace(/^\\/+/, "");
        const url = slug ? \`/\${slug}/\` : "/";
        return \`File: \${chunk.path}\\nURL: \${url}\\nScore: \${score.toFixed(3)}\\n----\\n\${chunk.text}\`;
      })
      .join("\\n\\n================\\n\\n");

    // Create chat model and stream response
    const llm = createChatModel(llmConfig);
    const prompt: { role: "system" | "user" | "assistant"; content: string }[] =
      [
        {
          role: "system" as const,
          content: systemContext,
        },
      ];

    // Include conversation history for multi-turn context
    if (history && history.length > 0) {
      for (const msg of history) {
        prompt.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    prompt.push({
      role: "user" as const,
      content: \`Question: \${question}\\n\\nContext:\\n\${context}\`,
    });

    const stream = await llm.stream(prompt);

    // Build metadata from MCP search results
    const indexStatus = getIndexStatus();
    const metadata = {
      sources: searchResults.map(({ chunk, score }) => ({
        id: chunk.id,
        path: chunk.path,
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
