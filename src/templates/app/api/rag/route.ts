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
- Never include route group segments in parentheses, like "(site)", in any link - they are internal folder names and do not exist in real URLs. Use "/code/" not "/(site)/code/".
- Do NOT add a "Related Pages" section at the end - sources are shown separately by the UI.

## Greetings & Small Talk
If the user sends a greeting or non-documentation question, respond briefly and ask how you can help with the documentation.\`;

// LangChain + the MCP SDK require the Node.js runtime (not edge).
export const runtime = "nodejs";
// Safety net for the streaming function (Vercel-only; ignored elsewhere).
// The heartbeat below, not this value, is what prevents proxy 524 timeouts.
export const maxDuration = 60;

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

  // Validate the request up front so genuine client/config errors still return
  // real status codes before we commit to a 200 streaming response.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

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

  const encoder = new TextEncoder();
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let streamClosed = false;

  // Return the streaming response immediately and do ALL slow work (indexing,
  // search, model streaming) inside start(). This flushes headers + a first
  // byte right away so edge proxies never hit their time-to-first-byte timeout.
  const readableStream = new ReadableStream({
    async start(controller) {
      const safeEnqueue = (payload: string) => {
        if (streamClosed) return;
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          // Stream already closed or cancelled - stop emitting.
          streamClosed = true;
          if (heartbeat) clearInterval(heartbeat);
        }
      };

      // Keep the connection alive while the index and model warm up.
      heartbeat = setInterval(() => safeEnqueue(\`: keep-alive\\n\\n\`), 15000);

      try {
        // First byte, before any slow work - satisfies the proxy TTFB window.
        safeEnqueue(\`: connected\\n\\n\`);

        // Ensure docs are indexed (loads precomputed embeddings when present).
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

        // Build metadata from MCP search results and send it before the answer.
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
        safeEnqueue(
          \`data: \${JSON.stringify({ type: "metadata", data: metadata })}\\n\\n\`,
        );

        // Assemble the prompt, including conversation history for multi-turn.
        const prompt: {
          role: "system" | "user" | "assistant";
          content: string;
        }[] = [
          {
            role: "system" as const,
            content: systemContext,
          },
        ];
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

        // Create chat model and stream the response.
        const llm = createChatModel(llmConfig);
        const stream = await llm.stream(prompt);
        for await (const chunk of stream) {
          const content = chunk?.content || "";
          if (content) {
            safeEnqueue(
              \`data: \${JSON.stringify({ type: "content", data: content })}\\n\\n\`,
            );
          }
        }

        safeEnqueue(\`data: \${JSON.stringify({ type: "done" })}\\n\\n\`);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Stream error";
        safeEnqueue(
          \`data: \${JSON.stringify({ type: "error", data: message })}\\n\\n\`,
        );
      } finally {
        if (heartbeat) clearInterval(heartbeat);
        streamClosed = true;
        try {
          controller.close();
        } catch {
          // Already closed.
        }
      }
    },
    cancel() {
      streamClosed = true;
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}

export async function GET() {
  const status = getIndexStatus();
  return NextResponse.json({
    ready: status.ready,
    chunks: status.chunkCount,
  });
}
`;
