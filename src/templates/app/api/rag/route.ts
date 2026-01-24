export const ragRoutesTemplate = `import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";
import {
  getLLMConfig,
  createChatModel,
  createEmbeddings,
} from "@/services/llm";

type Chunk = {
  id: string;
  text: string;
  path: string;
  embedding: number[];
};

let indexCache: { ready: boolean; building: boolean; chunks: Chunk[] } = {
  ready: false,
  building: false,
  chunks: [],
};

const PROJECT_ROOT = process.cwd();
const APP_DIR = path.join(PROJECT_ROOT, "app");

const VALID_EXT = new Set([".ts", ".tsx", ".js", ".jsx"]);

async function* walk(dir: string): AsyncGenerator<string> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === "node_modules" ||
        entry.name === ".next" ||
        entry.name === ".git"
      )
        continue;
      yield* walk(p);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (VALID_EXT.has(ext)) {
        yield p;
      }
    }
  }
}

function extractContentBlocks(fileText: string): string[] {
  const results: string[] = [];

  // Template literal form: const content = \`...\`;
  const tplRegex = /(?:export\\s+)?const\\s+content\\s*=\\s*\`((?:\\\\\`|[^\`])*)\`\\s*;/g;
  let m: RegExpExecArray | null;
  while ((m = tplRegex.exec(fileText)) !== null) {
    results.push(m[1]);
  }

  // Single-quoted form: const content = '...'; (single line)
  const sglRegex = /(?:export\\s+)?const\\s+content\\s*=\\s*'([^']*)'\\s*;/g;
  while ((m = sglRegex.exec(fileText)) !== null) {
    results.push(m[1]);
  }

  // Double-quoted form: const content = "..."; (single line)
  const dblRegex = /(?:export\\s+)?const\\s+content\\s*=\\s*"([^"]*)"\\s*;/g;
  while ((m = dblRegex.exec(fileText)) !== null) {
    results.push(m[1]);
  }

  return results;
}

function chunkText(text: string, chunkSize = 1500, overlap = 200): string[] {
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

function cosineSim(a: number[], b: number[]): number {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

async function buildIndex() {
  if (indexCache.building) return;
  indexCache.building = true;
  try {
    const files: string[] = [];
    for await (const f of walk(APP_DIR)) files.push(f);

    const docs: { path: string; chunk: string }[] = [];
    for (const f of files) {
      try {
        const buf = await fs.readFile(f, "utf8");
        const blocks = extractContentBlocks(buf);
        for (const b of blocks) {
          const clean = b
            .replace(/\\r\\n/g, "\\n")
            .replace(/\\n{3,}/g, "\\n\\n")
            .slice(0, 200_000);
          const pieces = chunkText(clean);
          for (const piece of pieces) {
            docs.push({ path: f, chunk: piece });
          }
        }
      } catch {}
    }

    if (docs.length === 0) {
      indexCache.chunks = [];
      indexCache.ready = true;
      return;
    }

    const config = getLLMConfig();
    const embeddings = createEmbeddings(config);
    const vectors = await embeddings.embedDocuments(docs.map((d) => d.chunk));

    indexCache.chunks = docs.map((d, i) => ({
      id: \`\${d.path}:\${i}\`,
      text: d.chunk,
      path: d.path,
      embedding: vectors[i],
    }));
    indexCache.ready = true;
  } finally {
    indexCache.building = false;
  }
}

async function ensureIndex(force = false) {
  if (force) {
    indexCache.ready = false;
    indexCache.chunks = [];
  }
  if (!indexCache.ready) {
    await buildIndex();
  }
}

export async function POST(req: Request) {
  try {
    const { question, refresh } = await req.json();

    let config;
    try {
      config = getLLMConfig();
    } catch (error: any) {
      return NextResponse.json(
        { error: error?.message || "LLM configuration error" },
        { status: 500 },
      );
    }

    await ensureIndex(Boolean(refresh));

    const embedder = createEmbeddings(config);
    const qVec = await embedder.embedQuery(String(question || ""));

    const scored = indexCache.chunks
      .map((c) => ({ c, score: cosineSim(qVec, c.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    const context = scored
      .map(
        ({ c, score }) =>
          \`File: \${path.relative(PROJECT_ROOT, c.path)}\\nScore: \${score.toFixed(3)}\\n----\\n\${c.text}\`,
      )
      .join("\\n\\n================\\n\\n");

    const llm = createChatModel(config);
    const prompt = [
      {
        role: "system",
        content:
          "You are a helpful documentation assistant. Answer strictly from the provided context. If the answer is not in the context, say you don't know and suggest where to look. Make sure the mdx can be nested properly if you show code components within nested \`\`\`",
      },
      {
        role: "user",
        content: \`Question: \${question}\\n\\nContext:\\n\${context}\`,
      },
    ] as const;

    const stream = await llm.stream(prompt as any);

    const metadata = {
      sources: scored.map(({ c, score }) => ({
        id: c.id,
        path: path.relative(PROJECT_ROOT, c.path),
        score,
      })),
      chunkCount: indexCache.chunks.length,
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
        } catch (error: any) {
          controller.enqueue(
            encoder.encode(
              \`data: \${JSON.stringify({ type: "error", data: error?.message || "Stream error" })}\\n\\n\`,
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
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unknown error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ready: indexCache.ready,
    chunks: indexCache.chunks.length,
  });
}
`;
