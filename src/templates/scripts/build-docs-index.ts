export const buildDocsIndexScriptTemplate = `/**
 * Precompute document embeddings at build time.
 *
 * Runs before \`next build\` (wired into the "build" script in package.json).
 * Embeds every docs chunk once and writes services/mcp/docs-index.json, so the
 * running app loads vectors instead of re-embedding the whole doc set on every
 * serverless cold start (the main cause of slow first chats / proxy timeouts).
 *
 * Fails soft: without an API key, or on any embedding error, it leaves the
 * existing (possibly empty) index in place and exits 0 so the build proceeds.
 * The app then falls back to embedding on demand at runtime.
 */
import path from "node:path";
import { writeFileSync } from "node:fs";
// @next/env is CommonJS; use a default import so the named export resolves
// under tsx's ESM loader (a named import is not statically detected).
import nextEnv from "@next/env";
import { getAllDocsChunks } from "../services/mcp/tools";
import { getLLMConfig, isLLMAvailable } from "../services/llm/config";
import { createEmbeddings } from "../services/llm/factory";
import { reduceDims, quantizeInt8, encodeInt8 } from "../services/mcp/vector";

// This runs as a standalone process before \`next build\`, so it must load
// .env / .env.local / .env.production itself (the same way Next does). Real
// environment variables still take precedence over .env files.
nextEnv.loadEnvConfig(process.cwd());

const OUTPUT = path.join(process.cwd(), "services", "mcp", "docs-index.json");
const BATCH_SIZE = 10;

async function main() {
  if (!isLLMAvailable()) {
    console.warn(
      "[doccupine] No LLM API key set - skipping embedding precompute. " +
        "The chat will embed docs on demand at runtime.",
    );
    return;
  }

  const chunks = await getAllDocsChunks();
  if (chunks.length === 0) {
    console.warn("[doccupine] No docs found to embed - skipping precompute.");
    return;
  }

  const config = getLLMConfig();
  const embeddings = createEmbeddings(config);

  // Embed in small batches to stay within provider token limits, then reduce
  // each vector to config.embeddingDims and quantize to int8. Storing raw float
  // arrays as JSON balloons to 100MB+ on large doc sets, which OOMs / stalls the
  // serverless chat on cold start; int8 base64 keeps the index ~20x smaller.
  const texts = chunks.map((c) => c.text);
  const encoded: string[] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = await embeddings.embedDocuments(
      texts.slice(i, i + BATCH_SIZE),
    );
    for (const vector of batch) {
      encoded.push(
        encodeInt8(quantizeInt8(reduceDims(vector, config.embeddingDims))),
      );
    }
  }

  const data = {
    provider: config.provider,
    embeddingModel: config.embeddingModel,
    dims: config.embeddingDims,
    quantization: "int8",
    chunks: chunks.map((c, i) => ({ ...c, embedding: encoded[i] })),
  };

  writeFileSync(OUTPUT, JSON.stringify(data));
  console.log(
    \`[doccupine] Precomputed \${data.chunks.length} doc embeddings -> \${OUTPUT}\`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    // Never fail the build on an embedding error - fall back to runtime embedding.
    console.warn(
      "[doccupine] Embedding precompute failed; continuing build. " +
        "The chat will embed docs at runtime.",
      error instanceof Error ? error.message : error,
    );
    process.exit(0);
  });
`;
